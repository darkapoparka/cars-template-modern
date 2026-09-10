import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  analyzeInventoryCsv,
  applyInventoryCsvMapping,
  consumeTrustedRegeneratedInventoryCsvSnapshot,
  createInventoryCsvMappingVersion,
  decimalStringToMinorUnits,
  detectInventoryCsvDelimiter,
  escapeInventoryIssueExportCell,
  INVENTORY_CSV_REQUIRED_COLUMNS,
  InventoryCsvContractError,
  parseInventoryCsvMappingDefinition,
  regenerateInventoryCsvSnapshot,
} from "./inventory-csv";

const SHA_256_HEX_PATTERN = /^[a-f0-9]{64}$/;

describe("deterministic inventory CSV contract", () => {
  test.each([
    ["external_id,make\ncar-1,Volvo", ","],
    ["external_id;make\ncar-1;Volvo", ";"],
    ["external_id\tmake\ncar-1\tVolvo", "\t"],
  ])("detects supported delimiters", (input, expected) => {
    expect(detectInventoryCsvDelimiter(input)).toBe(expected);
  });

  test("requires user selection for ambiguous dialects", () => {
    expect(() =>
      detectInventoryCsvDelimiter("external_id,make;model\ncar-1,Volvo;XC60")
    ).toThrowError(expect.objectContaining({ code: "ambiguous_delimiter" }));
  });

  test("normalizes BOM and exact aliases without fuzzy acceptance", () => {
    const analysis = analyzeInventoryCsv(
      "\uFEFFExternal ID;Manufacturer;Unknown Column\ncar-1;Volvo;value"
    );
    expect(analysis.delimiter).toBe(";");
    expect(analysis.autoMappings).toEqual(
      expect.arrayContaining([
        { canonicalField: "external_id", sourceHeader: "external_id" },
        { canonicalField: "make", sourceHeader: "manufacturer" },
      ])
    );
    expect(analysis.autoMappings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceHeader: "unknown_column" }),
      ])
    );
  });

  test("blocks normalized header collisions and PII columns", () => {
    expect(() =>
      analyzeInventoryCsv("External ID,external-id\ncar-1,car-1")
    ).toThrowError(expect.objectContaining({ code: "header_collision" }));
    const analysis = analyzeInventoryCsv(
      "external_id,buyer_email,contact_phone,owner_national_id\ncar-1,buyer@example.com,+359881234567,secret-id"
    );
    expect(analysis.blockedPiiHeaders).toEqual([
      "buyer_email",
      "contact_phone",
      "owner_national_id",
    ]);
    expect(analysis.rows).toEqual([{ external_id: "car-1" }]);
  });

  test("rejects invalid UTF-8 and NUL bytes", () => {
    expect(() =>
      analyzeInventoryCsv(new Uint8Array([0xff, 0xfe, 0x00]))
    ).toThrowError(InventoryCsvContractError);
  });

  test("converts decimal money with BigInt semantics", () => {
    expect(decimalStringToMinorUnits("1234.50", 2)).toBe("123450");
    expect(decimalStringToMinorUnits("-0.01", 2)).toBe("-1");
    expect(() => decimalStringToMinorUnits("12.345", 2)).toThrowError(
      expect.objectContaining({ code: "ambiguous_decimal" })
    );
  });

  test("uses one fixed upload timestamp for missing source times", () => {
    const fixed = new Date("2026-07-13T10:00:00.000Z");
    expect(
      applyInventoryCsvMapping(
        [{ external_id: "car-1", source_updated_at: "" }],
        [
          { canonicalField: "external_id", sourceHeader: "external_id" },
          {
            canonicalField: "source_updated_at",
            sourceHeader: "source_updated_at",
          },
        ],
        fixed
      )[0]
    ).toMatchObject({ source_updated_at: fixed.toISOString() });
  });

  test("accepts only timezone-independent ISO dates", () => {
    const mapDate = (value: string) =>
      applyInventoryCsvMapping(
        [{ external_id: "car-1", source_updated_at: value }],
        [
          { canonicalField: "external_id", sourceHeader: "external_id" },
          {
            canonicalField: "source_updated_at",
            sourceHeader: "source_updated_at",
            transform: { format: "iso", type: "date" },
          },
        ],
        new Date("2026-07-13T10:00:00.000Z")
      )[0]?.source_updated_at;

    expect(mapDate("2024-01-02")).toBe("2024-01-02T00:00:00.000Z");
    expect(mapDate("2024-01-02T03:04:05+02:00")).toBe(
      "2024-01-02T01:04:05.000Z"
    );
    expect(() => mapDate("01/02/2024")).toThrowError(
      expect.objectContaining({ code: "invalid_date" })
    );
    expect(() => mapDate("2024-02-30")).toThrowError(
      expect.objectContaining({ code: "invalid_date" })
    );
  });

  test("applies strict ISO dates through the default auto-mapping path", () => {
    const analyzeAndMap = (sourceUpdatedAt: string, mediaExpiresAt: string) => {
      const analysis = analyzeInventoryCsv(
        `external_id,source_updated_at,media_rights_expires_at\ncar-1,${sourceUpdatedAt},${mediaExpiresAt}`
      );
      return applyInventoryCsvMapping(
        analysis.rows,
        analysis.autoMappings,
        new Date("2026-07-13T10:00:00.000Z")
      )[0];
    };

    expect(
      analyzeAndMap("2024-01-02T03:04:05+02:00", "2025-06-01")
    ).toMatchObject({
      media_rights_expires_at: "2025-06-01T00:00:00.000Z",
      source_updated_at: "2024-01-02T01:04:05.000Z",
    });
    expect(() => analyzeAndMap("01/02/2024", "2025-06-01")).toThrowError(
      expect.objectContaining({ code: "invalid_date" })
    );
    expect(() => analyzeAndMap("2024-01-02", "06/01/2025")).toThrowError(
      expect.objectContaining({ code: "invalid_date" })
    );
  });

  test("hashes mapping versions deterministically", () => {
    const base = {
      delimiter: "," as const,
      headerFingerprint: "header-sha",
      mappings: [
        { canonicalField: "make" as const, sourceHeader: "manufacturer" },
        { canonicalField: "external_id" as const, sourceHeader: "id" },
      ],
    };
    expect(createInventoryCsvMappingVersion(base).mappingHash).toBe(
      createInventoryCsvMappingVersion({
        ...base,
        mappings: [...base.mappings].reverse(),
      }).mappingHash
    );

    const enumMapping = {
      delimiter: "," as const,
      headerFingerprint: "enum-header-sha",
      mappings: [
        {
          canonicalField: "fuel_type" as const,
          sourceHeader: "fuel",
          transform: {
            aliases: { benzine: "petrol", diesel: "diesel" },
            type: "enum_alias" as const,
          },
        },
      ],
    };
    expect(createInventoryCsvMappingVersion(enumMapping).mappingHash).toBe(
      createInventoryCsvMappingVersion({
        ...enumMapping,
        mappings: [
          {
            ...enumMapping.mappings[0],
            transform: {
              aliases: { diesel: "diesel", benzine: "petrol" },
              type: "enum_alias" as const,
            },
          },
        ],
      }).mappingHash
    );
  });

  test("rejects duplicate targets before mapping-version hashing", () => {
    expect(() =>
      createInventoryCsvMappingVersion({
        delimiter: ",",
        headerFingerprint: "duplicate-header-sha",
        mappings: [
          { canonicalField: "make", sourceHeader: "manufacturer" },
          { canonicalField: "make", sourceHeader: "brand" },
        ],
      })
    ).toThrowError(
      expect.objectContaining({ code: "duplicate_mapping_target" })
    );
  });

  test("escapes spreadsheet formulas in issue exports", () => {
    expect(escapeInventoryIssueExportCell("=HYPERLINK(1)")).toBe(
      "'=HYPERLINK(1)"
    );
    for (const value of ["\t=CMD()", "\r+CMD()", "\n-CMD()", "  @CMD()"]) {
      expect(escapeInventoryIssueExportCell(value)).toBe(`'${value}`);
    }
    expect(escapeInventoryIssueExportCell("safe")).toBe("safe");
  });

  test("recomputes stored mapping identity and regenerates canonical rows", () => {
    const csv = `${INVENTORY_CSV_REQUIRED_COLUMNS.join(",")}\nupsert,car-1,2026-07-13T09:00:00Z,car,Volvo,XC60,2024,suv,gasoline,automatic,offer-1,Volvo XC60,Clean car,available,12000,5749900,EUR,2,margin,Sofia,Bulgaria,BG,bg|de`;
    const analysis = analyzeInventoryCsv(csv);
    const mapping = createInventoryCsvMappingVersion({
      delimiter: analysis.delimiter,
      headerFingerprint: analysis.headerFingerprint,
      mappings: analysis.autoMappings,
    });
    const parsed = parseInventoryCsvMappingDefinition(mapping);
    const snapshot = regenerateInventoryCsvSnapshot({
      artifact: csv,
      artifactHash: createHash("sha256").update(csv).digest("hex"),
      fixedUploadTime: new Date("2026-07-13T10:00:00Z"),
      mapping: parsed,
      sourceGeneratedAt: new Date("2026-07-13T10:00:00Z"),
    });

    expect(snapshot.quarantinedRows).toEqual([]);
    expect(snapshot.fixedUploadTime).toBe("2026-07-13T10:00:00.000Z");
    expect(snapshot.validRows).toHaveLength(1);
    expect(snapshot.validRows[0]?.record).toMatchObject({
      externalId: "car-1",
      offer: { destinationMarketCodes: ["bg", "de"] },
      operation: "upsert",
      vehicle: { make: "Volvo", model: "XC60", year: 2024 },
    });
    expect(snapshot.validRows[0]?.normalizedDigest).toMatch(
      SHA_256_HEX_PATTERN
    );
    expect(Object.isFrozen(snapshot.validRows)).toBe(true);
    expect(Object.isFrozen(snapshot.validRows[0]?.record)).toBe(true);
    expect(() => {
      const record = snapshot.validRows[0]?.record as unknown as {
        offer: { title: string };
      };
      record.offer.title = "FORGED AFTER REGEN";
    }).toThrow();
    expect(consumeTrustedRegeneratedInventoryCsvSnapshot(snapshot)).toBe(
      snapshot
    );
    expect(() =>
      consumeTrustedRegeneratedInventoryCsvSnapshot(snapshot)
    ).toThrowError(
      expect.objectContaining({ code: "untrusted_regenerated_snapshot" })
    );
  });

  test("fails closed on stored mapping hash drift and quarantines invalid rows", () => {
    const csv = `${INVENTORY_CSV_REQUIRED_COLUMNS.join(",")}\nupsert,car-1,01/02/2024,car,Volvo,XC60,2024,suv,petrol,automatic,offer-1,Volvo XC60,Clean car,available,12000,5749900,EUR,2,margin,Sofia,Bulgaria,BG,bg`;
    const analysis = analyzeInventoryCsv(csv);
    const mapping = createInventoryCsvMappingVersion({
      delimiter: analysis.delimiter,
      headerFingerprint: analysis.headerFingerprint,
      mappings: analysis.autoMappings,
    });
    expect(() =>
      parseInventoryCsvMappingDefinition({
        ...mapping,
        mappingHash: "0".repeat(64),
      })
    ).toThrowError(expect.objectContaining({ code: "mapping_hash_mismatch" }));

    expect(
      regenerateInventoryCsvSnapshot({
        artifact: csv,
        artifactHash: createHash("sha256").update(csv).digest("hex"),
        fixedUploadTime: new Date("2026-07-13T10:00:00Z"),
        mapping,
        sourceGeneratedAt: new Date("2026-07-13T10:00:00Z"),
      }).quarantinedRows
    ).toEqual([
      expect.objectContaining({
        issues: [expect.objectContaining({ path: "row" })],
        sourceRowNumber: 2,
      }),
    ]);
  });

  test("rejects substituted artifact bytes instead of branding a caller hash", () => {
    const csv = `${INVENTORY_CSV_REQUIRED_COLUMNS.join(",")}\nupsert,car-1,2026-07-13T09:00:00Z,car,Volvo,XC60,2024,suv,gasoline,automatic,offer-1,Volvo XC60,Clean car,available,12000,5749900,EUR,2,margin,Sofia,Bulgaria,BG,bg`;
    const analysis = analyzeInventoryCsv(csv);
    const mapping = createInventoryCsvMappingVersion({
      delimiter: analysis.delimiter,
      headerFingerprint: analysis.headerFingerprint,
      mappings: analysis.autoMappings,
    });

    expect(() =>
      regenerateInventoryCsvSnapshot({
        artifact: csv,
        artifactHash: "a".repeat(64),
        fixedUploadTime: new Date("2026-07-13T10:00:00Z"),
        mapping,
        sourceGeneratedAt: new Date("2026-07-13T10:00:00Z"),
      })
    ).toThrowError(
      expect.objectContaining({ code: "artifact_receipt_mismatch" })
    );
  });
});

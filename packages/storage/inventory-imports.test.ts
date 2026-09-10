import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  consumeTrustedInventoryImportArtifact,
  purgePrivateArtifact,
  verifyInventoryImportArtifact,
} from "./inventory-imports";
import { InMemoryPrivateObjectStorageProvider } from "./private-documents";

const bytes = new TextEncoder().encode("external_id,make\ncar-1,Volvo\n");
const sha256 = createHash("sha256").update(bytes).digest("hex");
const binding = {
  dealerOrgId: "org_123456",
  expectedByteSize: bytes.byteLength,
  expectedObjectKey:
    "inventory-imports/org_123456/source_123456/session_123456/original/nonce_123456",
  expectedProviderName: "in-memory-test",
  expectedSha256: sha256,
  importSessionId: "session_123456",
  inventorySourceId: "source_123456",
} as const;

const makeProvider = () => {
  const provider = new InMemoryPrivateObjectStorageProvider();
  provider.putSyntheticObject(
    {
      byteSize: bytes.byteLength,
      contentType: "text/csv",
      objectKey: binding.expectedObjectKey,
      sha256,
    },
    bytes
  );
  return provider;
};

describe("inventory import private artifacts", () => {
  test("brands exact tenant-bound CSV bytes and consumes the receipt once", async () => {
    const receipt = await verifyInventoryImportArtifact(
      makeProvider(),
      binding
    );
    const trusted = consumeTrustedInventoryImportArtifact(receipt);

    expect(trusted.bytes).toEqual(bytes);
    expect(trusted.dealerOrgId).toBe(binding.dealerOrgId);
    await expect(async () =>
      consumeTrustedInventoryImportArtifact(receipt)
    ).rejects.toThrow("already consumed");
  });

  test.each([
    ["dealerOrgId", "org_654321"],
    ["inventorySourceId", "source_654321"],
    ["importSessionId", "session_654321"],
    ["expectedProviderName", "another-provider"],
    ["expectedByteSize", bytes.byteLength - 1],
    ["expectedSha256", "0".repeat(64)],
  ] as const)("rejects a mismatched %s binding", async (field, value) => {
    await expect(
      verifyInventoryImportArtifact(makeProvider(), {
        ...binding,
        [field]: value,
      })
    ).rejects.toThrow();
  });

  test("rejects provider bytes that do not match exact metadata", async () => {
    const provider = makeProvider();
    provider.putSyntheticObject(
      {
        byteSize: 1,
        contentType: "text/csv",
        objectKey: binding.expectedObjectKey,
        sha256,
      },
      bytes
    );

    await expect(
      verifyInventoryImportArtifact(provider, {
        ...binding,
        expectedByteSize: 1,
      })
    ).rejects.toThrow("bytes do not match");
  });

  test("treats deletion retry as success only after verified absence", async () => {
    const provider = makeProvider();
    await purgePrivateArtifact(provider, binding.expectedObjectKey);
    await expect(
      purgePrivateArtifact(provider, binding.expectedObjectKey)
    ).resolves.toBeUndefined();
  });

  test("converges when deletion succeeded before the provider threw", async () => {
    const provider = makeProvider();
    await provider.deleteObject(binding.expectedObjectKey);
    const crashWindowProvider = {
      ...provider,
      deleteObject: () =>
        Promise.reject(new Error("provider acknowledgement lost")),
      name: provider.name,
      verifyAbsent: (objectKey: string) => provider.verifyAbsent(objectKey),
    } as unknown as typeof provider;

    await expect(
      purgePrivateArtifact(crashWindowProvider, binding.expectedObjectKey)
    ).resolves.toBeUndefined();
  });

  test("does not trust a provider deletion acknowledgement while bytes remain", async () => {
    const provider = makeProvider();
    const lyingProvider = {
      deleteObject: async () => ({ deleted: true }),
      name: provider.name,
      verifyAbsent: async () => false,
    } as unknown as typeof provider;

    await expect(
      purgePrivateArtifact(lyingProvider, binding.expectedObjectKey)
    ).rejects.toThrow("deletion was not verified");
  });
});

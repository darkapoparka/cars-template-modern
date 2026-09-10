import type { PreviewPersona } from "./authenticated-preview-contract.mts";

export const protectedReleaseJourneys = [
  {
    id: "candidate-readiness",
    personas: [],
    title: "immutable Preview candidate endpoints are live and ready",
  },
  {
    id: "buyer-workspace",
    personas: ["buyer"],
    title: "buyer workspace data and mutations remain account scoped",
  },
  {
    id: "private-seller-listing-factory",
    personas: ["seller"],
    title: "private seller creates a draft and completes the media path",
  },
  {
    id: "dealer-importer-workspace",
    personas: ["dealer"],
    title: "dealer and importer workspace routes share one organization",
  },
  {
    id: "dealer-tenant-boundaries",
    personas: ["dealer"],
    title: "dealer direct object access fails outside the active organization",
  },
  {
    id: "admin-authorization-boundaries",
    personas: ["admin"],
    title: "admin queues allow the trusted role and deny dealer access",
  },
  {
    id: "support-operator-boundaries",
    personas: ["operator"],
    title: "support metadata cannot cross admin or dealer boundaries",
  },
  {
    id: "session-fail-closed",
    personas: ["operator"],
    title: "logout and missing browser sessions fail closed",
  },
] as const satisfies readonly {
  readonly id: string;
  readonly personas: readonly PreviewPersona[];
  readonly title: string;
}[];

export type ProtectedReleaseJourneyId =
  (typeof protectedReleaseJourneys)[number]["id"];

export const protectedReleaseJourneyById = Object.fromEntries(
  protectedReleaseJourneys.map((journey) => [journey.id, journey])
) as Readonly<
  Record<ProtectedReleaseJourneyId, (typeof protectedReleaseJourneys)[number]>
>;

export const protectedReleasePersonaJourneyCounts = Object.freeze({
  admin: 1,
  buyer: 1,
  dealer: 2,
  operator: 2,
  seller: 1,
}) satisfies Readonly<Record<PreviewPersona, number>>;

export const assertProtectedReleaseJourneyRegistration = (
  registeredIds: readonly string[]
) => {
  const duplicates = registeredIds.filter(
    (id, index) => registeredIds.indexOf(id) !== index
  );
  if (duplicates.length > 0) {
    throw new Error(
      `Protected release journey registration contains duplicates: ${[
        ...new Set(duplicates),
      ].join(", ")}`
    );
  }

  const expected = protectedReleaseJourneys.map(({ id }) => id).sort();
  const actual = [...registeredIds].sort();
  if (
    actual.length !== expected.length ||
    actual.some((id, index) => id !== expected[index])
  ) {
    throw new Error(
      `Protected release journey registration must exactly match ${expected.join(", ")}`
    );
  }
};

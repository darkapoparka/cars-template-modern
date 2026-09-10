export type Persona = "admin" | "buyer" | "dealer" | "operator" | "seller";

interface PersonaJourney {
  readonly deniedPaths: readonly string[];
  readonly paths: readonly string[];
  readonly storageStateEnvironment: string;
}

export const personaJourneys: Record<Persona, PersonaJourney> = {
  admin: {
    deniedPaths: ["/dealer/inventory"],
    paths: ["/admin/moderation", "/admin/trust", "/admin/profile-claims"],
    storageStateEnvironment: "E2E_ADMIN_STORAGE_STATE",
  },
  buyer: {
    deniedPaths: ["/dealer/inventory", "/admin/moderation"],
    paths: ["/saved", "/saved/searches", "/messages", "/account"],
    storageStateEnvironment: "E2E_BUYER_STORAGE_STATE",
  },
  dealer: {
    deniedPaths: ["/admin/moderation"],
    paths: [
      "/dealer/inventory",
      "/dealer/inventory/sources",
      "/dealer/inventory/runs",
      "/dealer/leads",
      "/dealer/analytics",
    ],
    storageStateEnvironment: "E2E_DEALER_STORAGE_STATE",
  },
  operator: {
    deniedPaths: ["/dealer/inventory", "/admin/moderation"],
    paths: ["/account"],
    storageStateEnvironment: "E2E_OPERATOR_STORAGE_STATE",
  },
  seller: {
    deniedPaths: ["/dealer/inventory", "/admin/moderation"],
    paths: ["/sell/new", "/sell/listings"],
    storageStateEnvironment: "E2E_SELLER_STORAGE_STATE",
  },
};

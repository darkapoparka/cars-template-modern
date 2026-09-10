export interface StoredMediaObject {
  readonly contentType: string;
  readonly pathname: string;
  readonly size: number;
  readonly url: string;
}

export interface StorageProvider {
  deleteObject(pathname: string): Promise<void>;
  name: string;
}

export const stubStorageProvider = {
  deleteObject: () =>
    Promise.reject(new Error("storage_provider_not_configured")),
  name: "stub",
} satisfies StorageProvider;

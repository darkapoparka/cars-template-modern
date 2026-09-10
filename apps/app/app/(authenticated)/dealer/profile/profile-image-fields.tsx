"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { upload } from "@repo/storage/client";
import {
  LISTING_MEDIA_ALLOWED_TYPES,
  LISTING_MEDIA_MAX_FILE_BYTES,
  sanitizeUploadFilename,
  uploadCandidateSchema,
} from "@repo/storage/upload-policy";
import { UploadIcon } from "lucide-react";
import { useState } from "react";

const mediaFields = [
  {
    fileLabel: "Файл за лого",
    kind: "logo",
    label: "Лого",
    name: "logoUrl",
  },
  {
    fileLabel: "Файл за профилна снимка",
    kind: "cover",
    label: "Профилна снимка",
    name: "profileImageUrl",
  },
] as const;

type ProfileMediaKind = (typeof mediaFields)[number]["kind"];

interface ProfileImageFieldsProps {
  readonly canManage: boolean;
  readonly defaultLogoUrl?: string;
  readonly defaultProfileImageUrl?: string;
  readonly directorySlug: string;
  readonly storageConfigured: boolean;
}

export const ProfileImageFields = ({
  canManage,
  defaultLogoUrl,
  defaultProfileImageUrl,
  directorySlug,
  storageConfigured,
}: ProfileImageFieldsProps) => {
  const [files, setFiles] = useState<Partial<Record<ProfileMediaKind, File>>>(
    {}
  );
  const [messages, setMessages] = useState<
    Partial<Record<ProfileMediaKind, string>>
  >({});
  const [uploading, setUploading] = useState<ProfileMediaKind>();
  const [urls, setUrls] = useState({
    cover: defaultProfileImageUrl ?? "",
    logo: defaultLogoUrl ?? "",
  });

  const startUpload = async (kind: ProfileMediaKind) => {
    const file = files[kind];
    if (!file) {
      return;
    }

    setUploading(kind);
    setMessages((current) => ({ ...current, [kind]: undefined }));
    try {
      const candidate = uploadCandidateSchema.parse({
        contentType: file.type,
        filename: file.name,
        size: file.size,
      });
      const blob = await upload(
        `dealer-profiles/${directorySlug}/${kind}/${sanitizeUploadFilename(file.name)}`,
        file,
        {
          access: "public",
          clientPayload: JSON.stringify({
            ...candidate,
            directorySlug,
            kind,
          }),
          handleUploadUrl: "/api/dealer-profile-media/upload",
        }
      );

      setUrls((current) => ({ ...current, [kind]: blob.url }));
      setFiles((current) => ({ ...current, [kind]: undefined }));
      setMessages((current) => ({
        ...current,
        [kind]:
          "Качването завърши. Запишете черновата, за да използвате изображението.",
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [kind]:
          error instanceof Error
            ? error.message
            : "Изображението не беше качено.",
      }));
    } finally {
      setUploading(undefined);
    }
  };

  return (
    <div className="space-y-5 p-4">
      {mediaFields.map((field) => {
        const isUploading = uploading === field.kind;
        const inputId = `${field.kind}Url`;
        const fileInputId = `${field.kind}File`;
        const fileInputDisabled =
          !(canManage && storageConfigured) || isUploading;
        const uploadDisabled =
          !(canManage && storageConfigured && files[field.kind]) ||
          Boolean(uploading);

        return (
          <fieldset className="space-y-3" key={field.kind}>
            <legend className="font-medium text-sm">{field.label}</legend>
            <div className="space-y-2">
              <Label htmlFor={inputId}>Публичен URL</Label>
              <Input
                disabled={!canManage}
                id={inputId}
                name={field.name}
                onChange={(event) =>
                  setUrls((current) => ({
                    ...current,
                    [field.kind]: event.target.value,
                  }))
                }
                placeholder="https://"
                type="url"
                value={urls[field.kind]}
              />
            </div>
            <div className="space-y-2 rounded-md bg-control/55 p-3">
              <Label htmlFor={fileInputId}>{field.fileLabel}</Label>
              <Input
                accept={LISTING_MEDIA_ALLOWED_TYPES.join(",")}
                disabled={fileInputDisabled}
                id={fileInputId}
                onChange={(event) =>
                  setFiles((current) => ({
                    ...current,
                    [field.kind]: event.target.files?.[0],
                  }))
                }
                type="file"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">
                  JPG, PNG или WebP · до{" "}
                  {LISTING_MEDIA_MAX_FILE_BYTES / 1024 / 1024} MB
                </p>
                <Button
                  disabled={uploadDisabled}
                  onClick={() => startUpload(field.kind)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <UploadIcon aria-hidden="true" className="size-4" />
                  {isUploading ? "Качване…" : "Качи"}
                </Button>
              </div>
              {messages[field.kind] ? (
                <p aria-live="polite" className="text-xs">
                  {messages[field.kind]}
                </p>
              ) : null}
            </div>
          </fieldset>
        );
      })}
      {storageConfigured ? null : (
        <p className="text-muted-foreground text-xs leading-5">
          Публичното хранилище не е конфигурирано. HTTPS адресите остават
          достъпни, но системата няма да отчете файл като качен.
        </p>
      )}
    </div>
  );
};

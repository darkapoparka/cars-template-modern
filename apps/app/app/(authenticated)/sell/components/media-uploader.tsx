"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { upload } from "@repo/storage/client";
import {
  sanitizeUploadFilename,
  validateUploadBatch,
} from "@repo/storage/upload-policy";
import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MediaUploaderProps {
  readonly listingId: string;
}

export const MediaUploader = ({ listingId }: MediaUploaderProps) => {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const selectedFilesLabel =
    files.length > 0 ? `Качи ${files.length} снимки` : "Качи снимки";
  const uploadLabel = uploading
    ? "Качване…"
    : failed
      ? "Опитай отново"
      : selectedFilesLabel;

  const startUpload = async () => {
    try {
      const candidates = validateUploadBatch(
        files.map((file) => ({
          contentType: file.type,
          filename: file.name,
          size: file.size,
        }))
      );
      setUploading(true);
      setFailed(false);
      setMessage(undefined);

      for (const [index, file] of files.entries()) {
        const candidate = candidates[index];
        if (!candidate) {
          continue;
        }
        await upload(
          `listings/${listingId}/${sanitizeUploadFilename(file.name)}`,
          file,
          {
            access: "public",
            clientPayload: JSON.stringify({ ...candidate, listingId }),
            handleUploadUrl: "/api/listing-media/upload",
          }
        );
      }

      setFiles([]);
      setMessage("Снимките са качени и чакат обработка.");
      setFailed(false);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error && error.message.includes("file")
          ? "Проверете типа, размера и броя на избраните файлове."
          : "Качването не успя. Снимките остават избрани за нов опит."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <label className="font-medium text-sm" htmlFor="listing-photos">
        Изберете снимки
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        id="listing-photos"
        multiple
        onChange={(event) => {
          setFiles(Array.from(event.target.files ?? []));
          setFailed(false);
          setMessage(undefined);
        }}
        type="file"
      />
      <Button
        className="w-fit gap-2"
        disabled={files.length === 0 || uploading}
        onClick={startUpload}
        type="button"
        variant="secondary"
      >
        <UploadIcon className="h-4 w-4" />
        {uploadLabel}
      </Button>
      {message && (
        <p
          aria-live="polite"
          className="text-sm"
          role={failed ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </div>
  );
};

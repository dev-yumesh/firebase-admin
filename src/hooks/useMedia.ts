"use client";
import { useCallback, useState } from "react";
import { storage, ID } from "@/lib/firebaseMediaClient";
import { env } from "@/config/env.config";

type UploadMediaOptions = {
  /** Storage path prefix (folder); defaults to `FIREBASE_STORAGE_MEDIA_FOLDER`. */
  bucketId?: string;
  fileId?: string;
};

type UploadMediaResult = {
  fileId: string;
  url: string;
};

export const useMedia = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = useCallback(
    async (file: File, options?: UploadMediaOptions): Promise<UploadMediaResult> => {
      setIsUploading(true);
      setError(null);

      try {
        const folder = options?.bucketId ?? env.FIREBASE_STORAGE_MEDIA_FOLDER;
        const desiredFileId = options?.fileId ?? ID.unique();
        const uploaded = await storage.createFile({
          bucketId: folder,
          fileId: desiredFileId,
          file,
        });

        const fileId = uploaded.$id || uploaded.id || desiredFileId;
        const url = uploaded.url;

        return { fileId, url };
      } catch (err: any) {
        const message = err?.message || "Failed to upload media";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    uploadMedia,
    isUploading,
    error,
  };
};

export type { UploadMediaOptions, UploadMediaResult };

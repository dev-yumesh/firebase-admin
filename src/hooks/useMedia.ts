"use client";
import { useCallback, useState } from "react";
import { storage, ID } from "@/lib/appwriteServices";
import { env } from "@/config/env.config";

type UploadMediaOptions = {
  bucketId?: string;
  fileId?: string;
};

type UploadMediaResult = {
  fileId: string;
  url: string;
};

const buildAppwriteFileUrl = (bucketId: string, fileId: string) =>
  `${env.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${env.APPWRITE_PROJECT_ID}`;

export const useMedia = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = useCallback(
    async (file: File, options?: UploadMediaOptions): Promise<UploadMediaResult> => {
      setIsUploading(true);
      setError(null);

      try {
        const bucketId = options?.bucketId ?? env.APPWRITE_STORAGE_BUCKET_ID;
        const desiredFileId = options?.fileId ?? ID.unique();
        const uploaded = await storage.createFile({
          bucketId,
          fileId: desiredFileId,
          file,
        });

        const fileId =
          (uploaded as any).$id ||
          (uploaded as any).id ||
          desiredFileId;
        const url = buildAppwriteFileUrl(bucketId, fileId);

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

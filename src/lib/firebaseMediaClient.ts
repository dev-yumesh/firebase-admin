"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./firebaseClient";

export { ID } from "./storageId";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadFileToFirebaseStorage(
  file: File,
  params: { folder: string; fileId: string }
): Promise<{ $id: string; id: string; url: string }> {
  const safeName = sanitizeFileName(file.name);
  const path = `${params.folder}/${params.fileId}_${safeName}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { $id: path, id: path, url };
}

/**
 * Firebase-backed upload helper shaped like Storage for minimal call-site churn.
 * `bucketId` is treated as a Storage path prefix (folder), not a Firebase bucket.
 */
export const storage = {
  async createFile(
    bucketIdOrOpts: string | { bucketId: string; fileId: string; file: File },
    fileId?: string,
    fileArg?: File
  ): Promise<{ $id: string; id: string; url: string }> {
    let folder: string;
    let fid: string;
    let file: File;
    if (typeof bucketIdOrOpts === "object") {
      folder = bucketIdOrOpts.bucketId;
      fid = bucketIdOrOpts.fileId;
      file = bucketIdOrOpts.file;
    } else {
      folder = bucketIdOrOpts;
      fid = fileId!;
      file = fileArg!;
    }
    return uploadFileToFirebaseStorage(file, { folder, fileId: fid });
  },
};

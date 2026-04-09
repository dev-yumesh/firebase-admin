import { getStorage } from "firebase-admin/storage";
import "@/lib/firebaseAdmin";
import { env } from "@/config/env.config";

export async function uploadBufferWithReadUrl(
  buffer: Buffer,
  destinationPath: string,
  contentType: string
): Promise<string> {
  const bucket = getStorage().bucket(env.FIREBASE_STORAGE_BUCKET);
  const file = bucket.file(destinationPath);
  await file.save(buffer, {
    metadata: { contentType, cacheControl: "public, max-age=31536000" },
    resumable: false,
  });
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: new Date("2100-01-01"),
  });
  return url;
}

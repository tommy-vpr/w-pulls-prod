import { Storage } from "@google-cloud/storage";

const serviceAccount = JSON.parse(
  Buffer.from(process.env.GCS_SERVICE_ACCOUNT_BASE64!, "base64").toString(
    "utf-8",
  ),
);

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

export const bucket = storage.bucket(process.env.GCP_BUCKET_NAME!);

export async function uploadToGCS(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const blob = bucket.file(filename);

  await blob.save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000",
    },
  });

  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

export async function deleteFromGCS(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error("Error deleting file from GCS:", error);
  }
}

export function getFilenameFromUrl(url: string): string | null {
  const match = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
  return match ? match[1] : null;
}

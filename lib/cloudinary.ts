/**
 * Cloudinary upload utility.
 * Uses the unsigned upload API — no server required.
 *
 * Requires env vars:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  (must be "Unsigned" in Cloudinary settings)
 */

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadOptions {
  /** Called repeatedly with 0–100 progress */
  onProgress?: (pct: number) => void;
  /** Cloudinary folder to store under (optional) */
  folder?: string;
}

/**
 * Uploads a single File to Cloudinary and resolves with the result.
 * Throws on failure with a human-readable message.
 */
export async function uploadToCloudinary(
  file: File,
  { onProgress, folder = "nammafit" }: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || cloudName === "your_cloud_name_here") {
    throw new Error(
      "Cloudinary cloud name not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local"
    );
  }
  if (!uploadPreset || uploadPreset === "your_unsigned_preset_here") {
    throw new Error(
      "Cloudinary upload preset not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
      } else {
        let msg = "Upload failed";
        try {
          const err = JSON.parse(xhr.responseText);
          msg = err?.error?.message ?? msg;
        } catch {
          // ignore parse error
        }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", url);
    xhr.send(formData);
  });
}

/** Returns human-readable file size  e.g. "1.4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Accepted image MIME types */
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Max upload size: 10 MB */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

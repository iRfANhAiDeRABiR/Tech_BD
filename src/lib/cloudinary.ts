import { v2 as cloudinary } from "cloudinary";

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return cloudinary;
}

export async function uploadProductImage(file: File) {
  return uploadImage(file, "tech-bd/products");
}

export async function uploadCategoryImage(file: File) {
  return uploadImage(file, "tech-bd/categories");
}

async function uploadImage(file: File, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");

  const dataUri = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  const result = await getCloudinary().uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    transformation: [{ width: 1200, height: 900, crop: "limit", quality: "auto", fetch_format: "auto" }],
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteProductImage(publicId?: string | null) {
  if (publicId) await getCloudinary().uploader.destroy(publicId);
}
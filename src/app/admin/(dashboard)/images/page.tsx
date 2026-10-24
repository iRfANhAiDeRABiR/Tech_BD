import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import {
  AdminImagesManager,
  type ImageItem,
  type AdminProductOption,
} from "@/components/admin/AdminImagesManager";

export default async function AdminImagesPage() {
  const imgDir = path.resolve(process.cwd(), "public/img_content");

  // Read files from disk
  let files: string[] = [];
  try {
    files = fs
      .readdirSync(imgDir)
      .filter((f) => !f.endsWith(".zip") && !f.startsWith("."))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch (err) {
    console.error("Error reading img_content directory:", err);
  }

  // Fetch products and categories to map image usage
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        image: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        image: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Build ImageItem map
  const images: ImageItem[] = files.map((file) => {
    const url = `/img_content/${file}`;
    let sizeBytes = 0;
    try {
      const stats = fs.statSync(path.join(imgDir, file));
      sizeBytes = stats.size;
    } catch {
      // Ignore
    }

    const productsUsing = products
      .filter((p) => p.image === url)
      .map((p) => ({ id: p.id, name: p.name }));

    const categoriesUsing = categories
      .filter((c) => c.image === url)
      .map((c) => ({ id: c.id, name: c.name }));

    return {
      fileName: file,
      url,
      sizeBytes,
      productsUsing,
      categoriesUsing,
    };
  });

  const productOptions: AdminProductOption[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
  }));

  return <AdminImagesManager images={images} products={productOptions} />;
}

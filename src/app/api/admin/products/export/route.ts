import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const format = searchParams.get("format")?.toLowerCase() === "json" ? "json" : "csv";

  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        options: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            sku: true,
            price: true,
            originalPrice: true,
            description: true,
            isDefault: true,
            isActive: true,
            sortOrder: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });

    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "json") {
      const jsonData = products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category.name,
        categorySlug: p.category.slug,
        price: p.price,
        originalPrice: p.originalPrice,
        badge: p.badge,
        status: p.status,
        isFeatured: p.isFeatured,
        outOfStock: p.outOfStock,
        sortOrder: p.sortOrder,
        image: p.image,
        shortDescription: p.shortDescription,
        descriptionHtml: p.descriptionHtml,
        options: p.options,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="products-export-${dateStr}.json"`,
        },
      });
    }

    // CSV format
    const headers = [
      "id",
      "slug",
      "name",
      "category",
      "price",
      "originalPrice",
      "badge",
      "status",
      "isFeatured",
      "outOfStock",
      "sortOrder",
      "image",
      "shortDescription",
      "descriptionHtml",
      "options",
    ];

    const rows = products.map((p) => {
      const optionsJson = p.options.length ? JSON.stringify(p.options) : "";
      return [
        escapeCsvField(p.id),
        escapeCsvField(p.slug),
        escapeCsvField(p.name),
        escapeCsvField(p.category.name),
        escapeCsvField(p.price),
        escapeCsvField(p.originalPrice ?? ""),
        escapeCsvField(p.badge ?? ""),
        escapeCsvField(p.status),
        escapeCsvField(p.isFeatured),
        escapeCsvField(p.outOfStock),
        escapeCsvField(p.sortOrder),
        escapeCsvField(p.image),
        escapeCsvField(p.shortDescription),
        escapeCsvField(p.descriptionHtml),
        escapeCsvField(optionsJson),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products-export-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error("Product export error:", error);
    return new NextResponse("Failed to export products", { status: 500 });
  }
}


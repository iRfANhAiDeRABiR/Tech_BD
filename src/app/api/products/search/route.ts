import { NextResponse } from "next/server";
import { getStoreCatalog } from "@/data/products";
import { scoreProductSearchMatch } from "@/lib/productSearch";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const { products, categories } = await getStoreCatalog();
    const categoryNames = new Map(categories.map((c) => [c.slug, c.name]));

    const scored = products
      .map((product) => {
        const categoryName = categoryNames.get(product.category) ?? product.category;
        const score = scoreProductSearchMatch(product, categoryName, q);
        return { product, categoryName, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map(({ product, categoryName }) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        categoryName,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        badge: product.badge,
      }));

    return NextResponse.json(
      { results: scored },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Product search API error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}


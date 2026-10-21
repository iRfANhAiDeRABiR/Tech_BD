import Image from "next/image";
import { toPlainText } from "@/lib/text";
import type { ProductSummary } from "@/types/product";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const name = toPlainText(product.name);
  const description = toPlainText(product.desc);

  return (
    <article className="product-card">
      {product.badge && (
        <span
          className={`product-card__badge product-card__badge--${product.badge}`}
        >
          {product.badge}
        </span>
      )}

      <div
        className="product-card__image"
        style={{ background: "var(--bg-glass)" }}
      >
        <Image
          src={product.image}
          alt={name}
          width={300}
          height={220}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      <div className="product-card__content">
        <span className="product-card__category">{product.category}</span>

        <h3 className="product-card__name">{name}</h3>

        <p className="product-card__desc">{description}</p>

        <div className="product-card__footer">
          <div className="product-card__price">
            <span className="price-current">
              ৳{product.price.toLocaleString()}
            </span>

            {product.originalPrice && (
              <span className="price-original">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <span className="product-card__buy" aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </article>
  );
}
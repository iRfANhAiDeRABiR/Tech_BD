"use client";

import { useState } from "react";
import type { ProductOption } from "@/types/product";
import { saveProductAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";

type EditableOption = ProductOption & { sku?: string | null; isDefault?: boolean; isActive?: boolean; sortOrder?: number };
type ProductValue = {
  id?: string; name?: string; slug?: string; categoryId?: number; badge?: string | null; price?: number; originalPrice?: number | null;
  shortDescription?: string; descriptionHtml?: string; image?: string; icon?: string | null; color?: string | null; gradient?: string | null;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED"; isFeatured?: boolean; outOfStock?: boolean; sortOrder?: number; options?: EditableOption[];
};

export function ProductForm({ categories, product = {} }: { categories: { id: number; name: string }[]; product?: ProductValue }) {
  const [options, setOptions] = useState<EditableOption[]>(product.options ?? []);
  const update = (index: number, key: keyof EditableOption, value: string | number | boolean | null) => setOptions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const addOption = () => setOptions((items) => [...items, { id: crypto.randomUUID(), name: "Retail key", type: "RETAIL_KEY", price: product.price ?? 0, originalPrice: null, description: "", sku: "", isDefault: items.length === 0, isActive: true, sortOrder: items.length }]);

  return <form action={saveProductAction} className={styles.panel}>
    {product.id && <input type="hidden" name="productId" value={product.id} />}
    <input type="hidden" name="options" value={JSON.stringify(options)} />
    <div className={styles.grid}>
      <div className={styles.field}><label>Product ID</label><input name="storefrontProductId" defaultValue={product.id ?? ""} placeholder="chatgpt-plus" required /></div>
      <div className={styles.field}><label>Name</label><input name="name" defaultValue={product.name} required /></div>
      <div className={styles.field}><label>Slug</label><input name="slug" defaultValue={product.slug} required /></div>
      <div className={styles.field}><label>Category</label><select name="categoryId" defaultValue={product.categoryId} required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
      <div className={styles.field}><label>Badge</label><input name="badge" defaultValue={product.badge ?? ""} placeholder="popular, sale, new" /></div>
      <div className={styles.field}><label>Base price (BDT)</label><input name="price" type="number" min="0" defaultValue={product.price ?? 0} required /></div>
      <div className={styles.field}><label>Original price</label><input name="originalPrice" type="number" min="0" defaultValue={product.originalPrice ?? ""} /></div>
      <div className={styles.field}><label>Status</label><select name="status" defaultValue={product.status ?? "ACTIVE"}><option>ACTIVE</option><option>DRAFT</option><option>ARCHIVED</option></select></div>
      <div className={styles.field}><label>Sort order</label><input name="sortOrder" type="number" defaultValue={product.sortOrder ?? 0} /></div>
      <div className={styles.fieldFull}><label>Short description</label><textarea name="shortDescription" defaultValue={product.shortDescription} required /></div>
      <div className={styles.fieldFull}><label>Product details (safe HTML supported)</label><textarea name="descriptionHtml" defaultValue={product.descriptionHtml} required /></div>
      <div className={styles.field}><label>Upload image (Cloudinary, max 5 MB)</label><input name="image" type="file" accept="image/*" /></div>
      <div className={styles.field}><label>Or image URL</label><input name="imageUrl" type="text" defaultValue={product.image ?? ""} placeholder="/img_content/win11pro.png" /></div>
      <div className={styles.field}><label>Icon / emoji</label><input name="icon" defaultValue={product.icon ?? "💻"} /></div>
      <div className={styles.field}><label>Accent color</label><input name="color" defaultValue={product.color ?? "#38bdf8"} /></div>
      <div className={styles.fieldFull}><label>Gradient CSS</label><input name="gradient" defaultValue={product.gradient ?? "linear-gradient(135deg, #38bdf8, #6366f1)"} /></div>
      <label className={styles.check}><input name="isFeatured" type="checkbox" defaultChecked={product.isFeatured} /> Featured product</label>
      <label className={styles.check}><input name="outOfStock" type="checkbox" defaultChecked={product.outOfStock} /> Out of stock</label>
    </div>

    <div className={styles.header} style={{ marginTop: 32, marginBottom: 10 }}><div><h2>License / purchase options</h2><p className={styles.muted}>Examples: retail key, bind key, OEM, or subscription.</p></div><button className={styles.buttonSecondary} type="button" onClick={addOption}>Add option</button></div>
    {options.map((option, index) => <div className={styles.option} key={option.id ?? index}>
      <div className={styles.optionHeader}><strong>Option {index + 1}</strong><button className={styles.danger} type="button" onClick={() => setOptions((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>
      <div className={styles.grid} style={{ marginTop: 14 }}>
        <div className={styles.field}><label>Name</label><input value={option.name} onChange={(event) => update(index, "name", event.target.value)} /></div>
        <div className={styles.field}><label>Type</label><select value={option.type} onChange={(event) => update(index, "type", event.target.value)}><option value="RETAIL_KEY">Retail key</option><option value="BIND_KEY">Bind key</option><option value="OEM_KEY">OEM key</option><option value="SUBSCRIPTION">Subscription</option><option value="OTHER">Other</option></select></div>
        <div className={styles.field}><label>SKU</label><input value={option.sku ?? ""} onChange={(event) => update(index, "sku", event.target.value)} /></div>
        <div className={styles.field}><label>Price</label><input type="number" min="0" value={option.price} onChange={(event) => update(index, "price", Number(event.target.value))} /></div>
        <div className={styles.field}><label>Original price</label><input type="number" min="0" value={option.originalPrice ?? ""} onChange={(event) => update(index, "originalPrice", event.target.value === "" ? null : Number(event.target.value))} /></div>
        <div className={styles.field}><label>Sort order</label><input type="number" value={option.sortOrder ?? index} onChange={(event) => update(index, "sortOrder", Number(event.target.value))} /></div>
        <div className={styles.fieldFull}><label>Description</label><textarea value={option.description ?? ""} onChange={(event) => update(index, "description", event.target.value)} /></div>
        <label className={styles.check}><input type="radio" name="defaultOption" checked={Boolean(option.isDefault)} onChange={() => setOptions((items) => items.map((item, itemIndex) => ({ ...item, isDefault: itemIndex === index })))} /> Default option</label>
        <label className={styles.check}><input type="checkbox" checked={option.isActive ?? true} onChange={(event) => update(index, "isActive", event.target.checked)} /> Active</label>
      </div>
    </div>)}
    <div className={styles.actions}><button className={styles.button} type="submit">Save product</button></div>
  </form>;
}
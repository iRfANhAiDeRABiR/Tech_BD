import { saveCategoryAction } from "@/app/admin/actions";
import { AVAILABLE_IMG_CONTENT } from "@/lib/available-images";
import styles from "@/app/admin/admin.module.css";

type CategoryValue = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string | null;
  accent?: string | null;
  image?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export function CategoryForm({
  category = {},
  submitLabel,
}: {
  category?: CategoryValue;
  submitLabel: string;
}) {
  return <form action={saveCategoryAction} className={styles.panel}>
    {category.id && <input type="hidden" name="categoryId" value={category.id} />}
    <div className={styles.grid}>
      <div className={styles.field}><label>Name</label><input name="name" defaultValue={category.name} required /></div>
      <div className={styles.field}><label>Slug</label><input name="slug" defaultValue={category.slug} required /></div>
      <div className={styles.field}><label>Accent color</label><input name="accent" defaultValue={category.accent ?? "#38bdf8"} /></div>
      <div className={styles.field}><label>Sort order</label><input name="sortOrder" type="number" defaultValue={category.sortOrder ?? 0} /></div>
      <div className={styles.fieldFull}><label>Description</label><textarea name="description" defaultValue={category.description ?? ""} /></div>
      <div className={styles.field}><label>Upload image</label><input name="image" type="file" accept="image/*" /></div>
      <div className={styles.field}>
        <label>Or image URL</label>
        <input
          name="imageUrl"
          type="text"
          list="category-img-content-datalist"
          defaultValue={category.image ?? ""}
          placeholder="/img_content/win11pro.png"
          autoComplete="on"
        />
        <datalist id="category-img-content-datalist">
          {AVAILABLE_IMG_CONTENT.map((path) => (
            <option key={path} value={path} />
          ))}
        </datalist>
      </div>
      <label className={styles.check}><input name="isActive" type="checkbox" defaultChecked={category.isActive ?? true} /> Active</label>
    </div>
    <div className={styles.actions}><button className={styles.button} type="submit">{submitLabel}</button></div>
  </form>;
}
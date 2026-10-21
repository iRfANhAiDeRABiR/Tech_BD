import Link from "next/link";
import { notFound } from "next/navigation";
import { getSoftwareDownloadById } from "@/lib/software-downloads-store";
import { SoftwareDownloadForm } from "@/components/admin/SoftwareDownloadForm";
import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditSoftwareDownloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getSoftwareDownloadById(decodeURIComponent(id));
  if (!item) notFound();

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>Edit Software Download</h1>
          <p className={styles.muted}>{item.title} — {item.fullName}</p>
        </div>
        <Link className={styles.buttonSecondary} href="/admin/downloads">
          ← Back to Downloads
        </Link>
      </div>

      <SoftwareDownloadForm
        download={item}
        submitLabel="Update Software Download"
      />
    </>
  );
}

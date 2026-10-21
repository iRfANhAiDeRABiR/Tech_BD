import Link from "next/link";
import { getSoftwareDownloads } from "@/lib/software-downloads-store";
import { SoftwareDownloadForm } from "@/components/admin/SoftwareDownloadForm";
import { SoftwareIconTile } from "@/components/downloads/SoftwareIconTile";
import { deleteSoftwareDownloadAction, saveSoftwareDownloadOrderAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";
import { ExternalLink, DownloadCloud, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDownloadsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; ordered?: string }>;
}) {
  const [items, query] = await Promise.all([
    getSoftwareDownloads(),
    searchParams,
  ]);

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>Software Downloads</h1>
          <p className={styles.muted}>
            Manage official software download links, multi-version files, custom pictures, and display order on the Software Download Center.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            className={styles.buttonSecondary}
            href="/downloads"
            target="_blank"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Eye size={16} /> View Download Center ↗
          </Link>
        </div>
      </div>

      {(query.saved || query.deleted || query.ordered) && (
        <p className={styles.notice}>
          Software download center updated successfully.
        </p>
      )}

      {/* Add New Software Download Form */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <DownloadCloud size={20} color="var(--primary, #0ea5e9)" /> Add New Software Download
        </h2>
        <SoftwareDownloadForm submitLabel="Add Software to Download Center" />
      </div>

      {/* Serial Order & Table Management */}
      <div className={styles.orderHeader}>
        <div>
          <h2>Display Serial Order ({items.length} Softwares)</h2>
          <p className={styles.muted}>
            Lower serial numbers show first on the public download center. You can freely change these numbers and click Save Order.
          </p>
        </div>
        <form id="downloads-order-form" action={saveSoftwareDownloadOrderAction} />
        <button
          form="downloads-order-form"
          className={styles.button}
          type="submit"
        >
          Save Order
        </button>
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 24, overflowX: "auto" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Serial</th>
              <th style={{ width: 76 }}>Icon</th>
              <th>Software Name</th>
              <th>Category</th>
              <th>Architecture & Size</th>
              <th>Links & Versions</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    form="downloads-order-form"
                    type="hidden"
                    name="downloadId"
                    value={item.id}
                  />
                  <input
                    form="downloads-order-form"
                    className={styles.serialInput}
                    name="sortOrder"
                    type="number"
                    min="-9999"
                    max="9999"
                    defaultValue={item.sortOrder ?? 10}
                    aria-label={`${item.title} serial number`}
                  />
                </td>
                <td style={{ width: 76, paddingRight: 16 }}>
                  <div style={{ width: 52, height: 52, flexShrink: 0 }}>
                    <SoftwareIconTile
                      variant={item.variant}
                      image={item.image}
                      title={item.title}
                      size="sm"
                    />
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  {item.fullName && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        marginTop: 2,
                        maxWidth: 260,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.fullName}
                    >
                      {item.fullName}
                    </div>
                  )}
                  {item.badgeLabel && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(14, 165, 233, 0.12)",
                        color: "var(--primary, #0ea5e9)",
                      }}
                    >
                      {item.badgeLabel}
                    </span>
                  )}
                </td>
                <td>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "var(--surface-sunken, rgba(0,0,0,0.04))",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {item.category}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {item.architecture}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                    {item.fileSize} • {item.fileType}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        color: "var(--primary, #0ea5e9)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        textDecoration: "underline",
                        maxWidth: 220,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.downloadUrl}
                    >
                      Primary Link <ExternalLink size={12} />
                    </a>
                    {item.versions && item.versions.length > 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        +{item.versions.length} sub-editions configured
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 8px",
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: item.isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: item.isActive ? "#10b981" : "#ef4444",
                    }}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div
                    className={styles.actions}
                    style={{ margin: 0, justifyContent: "flex-end" }}
                  >
                    <Link
                      className={styles.buttonSecondary}
                      href={`/admin/downloads/${item.id}/edit`}
                    >
                      Edit
                    </Link>
                    <form action={deleteSoftwareDownloadAction}>
                      <input type="hidden" name="downloadId" value={item.id} />
                      <button className={styles.danger} type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

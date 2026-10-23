"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, ChevronDown } from "lucide-react";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import styles from "@/app/admin/admin.module.css";

export function ProductImportExport() {
  const { lang } = useAdminLanguage();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    created?: number;
    updated?: number;
    count?: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(format);
    setIsDropdownOpen(false);
    try {
      const res = await fetch(`/api/admin/products/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export products. Please try again.");
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setImportResult(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("updateExisting", String(updateExisting));

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Import failed");
      }

      setImportResult(data);
      router.refresh();
    } catch (err) {
      setImportResult({
        success: false,
        message: err instanceof Error ? err.message : "An unexpected error occurred during import.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setImportResult(null);
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, position: "relative" }}>
      {/* Export Dropdown Group */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={styles.buttonSecondary}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px" }}
          disabled={Boolean(isExporting)}
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          <span>{lang === "bn" ? "এক্সপোর্ট" : "Export"}</span>
          <ChevronDown size={14} style={{ opacity: 0.7 }} />
        </button>

        {isDropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 30,
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: 6,
              minWidth: 150,
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={() => handleExport("csv")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                border: 0,
                background: "transparent",
                color: "var(--text-primary)",
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-glass-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <FileText size={14} /> {lang === "bn" ? "CSV এক্সপোর্ট" : "Export CSV"}
            </button>
            <button
              type="button"
              onClick={() => handleExport("json")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                border: 0,
                background: "transparent",
                color: "var(--text-primary)",
                borderRadius: 6,
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-glass-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <FileText size={14} /> {lang === "bn" ? "JSON এক্সপোর্ট" : "Export JSON"}
            </button>
          </div>
        )}
      </div>

      {/* Import Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={styles.buttonSecondary}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px" }}
      >
        <Upload size={16} />
        <span>{lang === "bn" ? "ইমপোর্ট" : "Import"}</span>
      </button>

      {/* Import Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) closeModal();
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 18,
              padding: 28,
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                  {lang === "bn" ? "প্রোডাক্ট ইমপোর্ট" : "Import Products"}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                  {lang === "bn"
                    ? "CSV বা JSON ফাইল আপলোড করে বাল্ক প্রোডাক্ট তৈরি বা আপডেট করুন।"
                    : "Upload a CSV or JSON file to bulk create or update your catalog."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isLoading}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileText size={18} style={{ color: "var(--accent-primary)" }} />
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  {lang === "bn"
                    ? "সঠিক ফরম্যাট দরকার? আমাদের CSV টেমপ্লেট ব্যবহার করুন।"
                    : "Need the right format? Use our sample CSV template."}
                </span>
              </div>
              <a
                href="/api/admin/products/template"
                download="product-import-template.csv"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                }}
              >
                <Download size={14} /> {lang === "bn" ? "টেমপ্লেট ডাউনলোড" : "Download Template"}
              </a>
            </div>

            {/* Form */}
            <form onSubmit={handleImportSubmit}>
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--border-color)",
                  borderRadius: 12,
                  padding: 30,
                  textAlign: "center",
                  background: file ? "rgba(16, 185, 129, 0.05)" : "var(--bg-glass)",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                  marginBottom: 16,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <Upload
                  size={32}
                  style={{
                    color: file ? "#10b981" : "var(--accent-primary)",
                    margin: "0 auto 10px",
                    display: "block",
                  }}
                />
                {file ? (
                  <div>
                    <strong style={{ color: "var(--text-primary)", display: "block", fontSize: 14 }}>
                      {file.name}
                    </strong>
                    <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                      {(file.size / 1024).toFixed(1)} KB • {lang === "bn" ? "ফাইল পরিবর্তন করতে ক্লিক করুন" : "Click to change file"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, display: "block" }}>
                      {lang === "bn" ? "ফাইল ব্রাউজ করতে ক্লিক করুন বা এখানে ড্র্যাগ করুন" : "Click to browse or drag & drop file here"}
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4, display: "block" }}>
                      {lang === "bn" ? ".CSV এবং .JSON ফাইল সমর্থিত" : "Supports .CSV and .JSON files"}
                    </span>
                  </div>
                )}
              </div>

              {/* Options */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    style={{ accentColor: "var(--accent-primary)" }}
                  />
                  <span style={{ color: "var(--text-primary)" }}>
                    {lang === "bn"
                      ? "আইডি বা স্লাগ বিদ্যমান থাকলে প্রোডাক্ট আপডেট করুন"
                      : "Update existing products if ID or Slug already exists"}
                  </span>
                </label>
              </div>

              {/* Feedback Alert */}
              {importResult && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    marginBottom: 18,
                    fontSize: 13,
                    background: importResult.success ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                    border: `1px solid ${importResult.success ? "#059669" : "#dc2626"}`,
                    color: importResult.success ? "#34d399" : "#f87171",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {importResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <strong>
                      {importResult.success
                        ? `Import Complete: ${importResult.created ?? 0} created, ${importResult.updated ?? 0} updated.`
                        : "Import Error"}
                    </strong>
                  </div>
                  {importResult.message && (
                    <p style={{ margin: "6px 0 0", opacity: 0.9 }}>{importResult.message}</p>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div style={{ marginTop: 8, maxHeight: 100, overflowY: "auto" }}>
                      <span style={{ fontWeight: 600 }}>Notices:</span>
                      <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className={styles.buttonSecondary}
                >
                  {importResult?.success
                    ? (lang === "bn" ? "সম্পন্ন" : "Done")
                    : (lang === "bn" ? "বাতিল" : "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!file || isLoading}
                  className={styles.button}
                  style={{ minWidth: 120, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{lang === "bn" ? "ইমপোর্ট হচ্ছে..." : "Importing..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>{lang === "bn" ? "ইমপোর্ট শুরু করুন" : "Start Import"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


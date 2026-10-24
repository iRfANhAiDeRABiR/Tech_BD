"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Headphones,
  Search,
  HelpCircle,
  MessageCircle,
  Send,
  ShoppingBag,
  Copy,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  FileDown,
} from "lucide-react";
import {
  SOFTWARE_DOWNLOADS,
  DOWNLOAD_FAQS,
  type SoftwareDownloadItem,
} from "@/data/software-downloads";
import { SoftwareIconTile } from "./SoftwareIconTile";
import styles from "./Downloads.module.css";

interface DownloadsPageClientProps {
  initialItems?: SoftwareDownloadItem[];
  initialUserVerified?: boolean;
  initialVerifiedOrderNumber?: string | null;
  initialUserLoggedIn?: boolean;
}

const STORAGE_KEY = "techbd_verified_download_order";

export function DownloadsPageClient({
  initialItems = SOFTWARE_DOWNLOADS,
  initialUserVerified = false,
  initialVerifiedOrderNumber = null,
  initialUserLoggedIn = false,
}: DownloadsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeSoftware, setActiveSoftware] =
    useState<SoftwareDownloadItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Verification states
  const [isVerified, setIsVerified] = useState<boolean>(initialUserVerified);
  const [verifiedOrder, setVerifiedOrder] = useState<string | null>(
    initialVerifiedOrderNumber
  );
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [pendingSoftware, setPendingSoftware] =
    useState<SoftwareDownloadItem | null>(null);
  const [orderInput, setOrderInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Check sessionStorage and auto-check logged-in user on mount
  useEffect(() => {
    if (isVerified) {
      if (verifiedOrder && typeof window !== "undefined") {
        sessionStorage.setItem(STORAGE_KEY, verifiedOrder);
      }
      return;
    }

    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        setIsVerified(true);
        setVerifiedOrder(cached);
        return;
      }
    }

    // Auto-check for logged-in user if not already verified on server
    fetch("/api/downloads/verify-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.valid) {
          setIsVerified(true);
          setVerifiedOrder(data.orderNumber || null);
          if (typeof window !== "undefined" && data.orderNumber) {
            sessionStorage.setItem(STORAGE_KEY, data.orderNumber);
          }
        }
      })
      .catch(() => {});
  }, [isVerified, verifiedOrder]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(initialItems.map((item) => item.category).filter(Boolean))
    );
    return [
      { label: "সবগুলো (All)", value: "All" },
      ...unique.map((cat) => ({
        label:
          cat === "Office"
            ? "Microsoft Office"
            : cat === "Windows"
            ? "Windows OS"
            : cat,
        value: cat,
      })),
    ];
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.version.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [initialItems, searchQuery, selectedCategory]);

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadClick = (item: SoftwareDownloadItem) => {
    if (isVerified) {
      setActiveSoftware(item);
      setCopiedUrl(false);
    } else {
      setPendingSoftware(item);
      setOrderInput("");
      setVerifyError(null);
      setShowOrderModal(true);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = orderInput.trim();
    if (!clean) {
      setVerifyError("অনুগ্রহ করে আপনার অর্ডার আইডি লিখুন।");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch("/api/downloads/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: clean }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setIsVerified(true);
        const resolvedOrderNumber = data.orderNumber || clean;
        setVerifiedOrder(resolvedOrderNumber);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(STORAGE_KEY, resolvedOrderNumber);
        }
        setShowOrderModal(false);

        // Unlock download immediately
        if (pendingSoftware) {
          setActiveSoftware(pendingSoftware);
          setPendingSoftware(null);
        }
      } else {
        setVerifyError(
          data.message ||
            "অর্ডার আইডি সঠিক নয় অথবা পেমেন্ট কনফার্ম করা হয়নি।"
        );
      }
    } catch (err) {
      setVerifyError("অর্ডার যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenAuth = () => {
    setShowOrderModal(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("techbd:open-auth-modal"));
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* ── Hero Section ── */}
        <header className={styles.hero}>
          <div className={styles.decorativeOrbit} aria-hidden="true" />

          <div className={styles.heroBadge}>
            <Headphones size={15} />
            <span>Software Download Link</span>
          </div>

          <h1 className={styles.heroTitle}>কিভাবে সাহায্য করতে পারি?</h1>

          <p className={styles.heroSubtitle}>
            সাধারণ প্রশ্নের উত্তর এখানে খুঁজে নিন বা সাপোর্ট টিকেট খুলুন
          </p>

          <div className={styles.searchBoxWrap}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="যা জানতে চান লিখুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="সফটওয়্যার খুঁজুন"
            />
            <Search size={18} className={styles.searchIcon} />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </header>

        {/* ── Verified Access Banner ── */}
        {isVerified && (
          <div className={styles.verifiedBanner} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={styles.verifiedBadgeDot} />
              <span>
                অর্ডার যাচাই সম্পন্ন হয়েছে {verifiedOrder ? `(#${verifiedOrder})` : ""} — সকল সফটওয়্যার ডাউনলোড লিঙ্ক সক্রিয়!
              </span>
            </div>
            {verifiedOrder && (
              <a
                href={`/api/orders/${encodeURIComponent(verifiedOrder)}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  background: "#0f172a",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
                title="Download official PDF invoice for this verified order"
              >
                <FileDown size={13} />
                <span>Invoice (PDF)</span>
              </a>
            )}
          </div>
        )}

        {/* ── Software Download Grid Section ── */}
        <section aria-labelledby="software-downloads-heading">
          <div className={styles.sectionHeaderRow}>
            <h2 id="software-downloads-heading" className={styles.sectionHeading}>
              <span className={styles.sectionHeadingIcon}>
                <Download size={20} />
              </span>
              <span>সফটওয়্যার ডাউনলোড</span>
            </h2>

            <div className={styles.filterTabs} role="tablist" aria-label="Filter software">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`${styles.filterTab} ${
                    selectedCategory === cat.value ? styles.filterTabActive : ""
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className={styles.grid}>
              {filteredItems.map((item) => (
                <article key={item.id} className={styles.card}>
                  <SoftwareIconTile item={item} />

                  <h3 className={styles.cardTitle}>{item.title}</h3>

                  <button
                    type="button"
                    className={styles.downloadBtn}
                    onClick={() => handleDownloadClick(item)}
                  >
                    {isVerified ? <Download size={15} /> : <Lock size={15} />}
                    <span>ডাউনলোড</span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyTitle}>কোনো সফটওয়্যার পাওয়া যায়নি</h3>
              <p className={styles.emptyText}>
                অনুগ্রহ করে অন্য কোনো নাম দিয়ে খুঁজুন অথবা সব ক্যাটাগরি নির্বাচন করুন।
              </p>
              <button
                type="button"
                className={styles.filterTab}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                সবগুলো দেখুন
              </button>
            </div>
          )}
        </section>

        {/* ── FAQ & Support Section ── */}
        <section className={styles.helpSection} aria-label="সাধারণ প্রশ্নাবলী ও সাপোর্ট">
          <div className={styles.faqCard}>
            <h2 className={styles.subSectionTitle}>
              <HelpCircle size={20} color="#6366f1" />
              <span>সাধারণ প্রশ্নাবলী (FAQ)</span>
            </h2>

            <div className={styles.faqList}>
              {DOWNLOAD_FAQS.map((faq, index) => (
                <div key={index} className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>{faq.question}</h3>
                  <p className={styles.faqAnswer}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.supportCard}>
            <h2 className={styles.subSectionTitle}>
              <Headphones size={20} color="#0ba5ec" />
              <span>সরাসরি সাপোর্ট নিন</span>
            </h2>

            <p className={styles.supportDesc}>
              সফটওয়্যার ডাউনলোড, ইনস্টলেশন কিংবা লাইসেন্স কি এক্টিভেশন করতে যেকোনো সমস্যার সম্মুখীন হলে আমাদের ২৪/৭ সাপোর্ট টিমের সাথে যোগাযোগ করুন।
            </p>

            <div className={styles.supportActions}>
              <a
                href="https://wa.me/message/7ZV3N6YFBF5ED1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.supportBtnWhatsapp}
              >
                <MessageCircle size={18} />
                <span>WhatsApp সাপোর্ট চ্যাট</span>
              </a>

              <a
                href="https://t.me/techsolutionsbd247"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.supportBtnTelegram}
              >
                <Send size={18} />
                <span>Telegram সাপোর্ট চ্যাট</span>
              </a>

              <Link href="/products#products-by-category" className={styles.supportBtnShop}>
                <ShoppingBag size={18} />
                <span>জেনুইন লাইসেন্স কি কিনুন</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Order ID Verification Modal ── */}
      {showOrderModal && (
        <div
          className={styles.verifyModalBackdrop}
          onClick={() => setShowOrderModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-modal-title"
        >
          <div
            className={styles.verifyModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setShowOrderModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className={styles.verifyModalHeader}>
              <div className={styles.verifyModalIconWrap}>
                <ShieldCheck size={28} />
              </div>
              <h3 id="verify-modal-title" className={styles.verifyModalTitle}>
                অর্ডার ভেরিফিকেশন
              </h3>
              <p className={styles.verifyModalSubtitle}>
                সফটওয়্যার ডাউনলোড লিঙ্ক আনলক করতে আপনার কনফার্ম হওয়া অর্ডারের আইডি দিন
              </p>

              {pendingSoftware && (
                <div className={styles.softwarePreviewChip}>
                  <span>ডাউনলোড করবেন:</span>
                  <strong>{pendingSoftware.title}</strong>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifySubmit} className={styles.verifyForm}>
              <div className={styles.verifyInputGroup}>
                <label htmlFor="order-id-input" className={styles.verifyInputLabel}>
                  অর্ডার নম্বর / আইডি (Order ID)
                </label>
                <div className={styles.verifyInputWrapper}>
                  <Search size={16} className={styles.verifyInputIcon} />
                  <input
                    id="order-id-input"
                    type="text"
                    className={styles.verifyInput}
                    placeholder="যেমন: TECHBD-ATD-XXXXXX বা #12345"
                    value={orderInput}
                    onChange={(e) => {
                      setOrderInput(e.target.value);
                      if (verifyError) setVerifyError(null);
                    }}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {verifyError && (
                <div className={`${styles.verifyAlert} ${styles.verifyAlertError}`}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{verifyError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || !orderInput.trim()}
                className={styles.verifySubmitBtn}
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    যাচাই করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    যাচাই ও ডাউনলোড করুন
                  </>
                )}
              </button>
            </form>

            <div className={styles.verifyModalFooter}>
              <p className={styles.verifyLoginPrompt}>
                ইতিমধ্যেই অর্ডার করেছেন?{" "}
                <button
                  type="button"
                  className={styles.verifyLoginBtn}
                  onClick={handleOpenAuth}
                >
                  লগইন করুন
                </button>{" "}
                (আপনার একাউন্ট থেকে অটো যাচাই হবে)
              </p>

              <div className={styles.verifySupportRow}>
                <a
                  href="https://wa.me/message/7ZV3N6YFBF5ED1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.verifySupportLink}
                >
                  <MessageCircle size={14} />
                  অর্ডার আইডি খুঁজতে সাহায্য প্রয়োজন?
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Version & Direct Download Modal ── */}
      {activeSoftware && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setActiveSoftware(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-modal-title"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setActiveSoftware(null)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className={styles.modalHeader}>
              <SoftwareIconTile item={activeSoftware} />
              <div className={styles.modalTitleWrap}>
                <h3 id="download-modal-title">{activeSoftware.title}</h3>
                <p>{activeSoftware.fullName}</p>
              </div>
            </div>

            <div className={styles.modalMetaGrid}>
              <div className={styles.modalMetaBox}>
                <small>সংস্করণ (Version)</small>
                <strong>{activeSoftware.version || "Latest"}</strong>
              </div>
              <div className={styles.modalMetaBox}>
                <small>আর্কিটেকচার</small>
                <strong>{activeSoftware.architecture || "64-Bit & 32-Bit"}</strong>
              </div>
              <div className={styles.modalMetaBox}>
                <small>ফাইল ফরম্যাট</small>
                <strong>{activeSoftware.fileType || "Installer"}</strong>
              </div>
            </div>

            <div className={styles.versionList}>
              {activeSoftware.versions.map((ver, idx) => (
                <a
                  key={idx}
                  href={ver.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.versionLinkItem}
                >
                  <div className={styles.versionLinkInfo}>
                    <strong>{ver.label}</strong>
                    <span>
                      Official Direct Download • {ver.arch || activeSoftware.architecture}
                    </span>
                  </div>
                  <span className={styles.versionDownloadBadge}>
                    <Download size={14} />
                    ডাউনলোড
                  </span>
                </a>
              ))}
            </div>

            <div className={styles.modalFooter}>
              <Link
                href={activeSoftware.productLink || "/products"}
                className={styles.buyKeyLink}
                onClick={() => setActiveSoftware(null)}
              >
                🔑 এই সফটওয়্যারের লাইসেন্স কি কিনুন →
              </Link>

              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => handleCopyLink(activeSoftware.downloadUrl)}
              >
                {copiedUrl ? (
                  <>
                    <Check size={14} style={{ display: "inline", marginRight: 4 }} />
                    লিঙ্ক কপি হয়েছে
                  </>
                ) : (
                  <>
                    <Copy size={14} style={{ display: "inline", marginRight: 4 }} />
                    লিঙ্ক কপি করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

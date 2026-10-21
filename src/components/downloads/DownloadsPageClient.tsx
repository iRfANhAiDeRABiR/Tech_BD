"use client";

import React, { useMemo, useState } from "react";
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
}

export function DownloadsPageClient({
  initialItems = SOFTWARE_DOWNLOADS,
}: DownloadsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeSoftware, setActiveSoftware] =
    useState<SoftwareDownloadItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(initialItems.map((item) => item.category).filter(Boolean)),
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
                    onClick={() => {
                      setActiveSoftware(item);
                      setCopiedUrl(false);
                    }}
                  >
                    <Download size={15} />
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

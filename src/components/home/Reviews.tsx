import type { CSSProperties } from "react";

interface CustomerReview {
  tag: string;
  quote: string;
  name: string;
  initials: string;
  date: string;
  accent: string;
}

const column1Reviews: CustomerReview[] = [
  {
    tag: "VERIFIED PURCHASE",
    quote: "Best service 🥰🥰🥰🥰 go ahead! Instant delivery and genuine activation key.",
    name: "Md Kabir",
    initials: "MK",
    date: "Jul 24, 2025",
    accent: "#8b5cf6",
  },
  {
    tag: "MS OFFICE 2021",
    quote:
      "আমি অফিস ২১ নিছি। ভালোই সার্ভিস দিছে। আপনারাও নিতে পারেন, একদম ফাস্ট ডেলিভারি পেয়েছি।",
    name: "Mohammed Anwar",
    initials: "MA",
    date: "Feb 5, 2025",
    accent: "#0ea5e9",
  },
  {
    tag: "WINDOWS 11 PRO",
    quote:
      "Got my Windows 11 Pro Retail key within 5 minutes on WhatsApp. Linked with my Microsoft account smoothly!",
    name: "Mehedi Rahman",
    initials: "MR",
    date: "Aug 12, 2025",
    accent: "#10b981",
  },
  {
    tag: "VERIFIED PURCHASE",
    quote:
      "প্রথমে একটু চিন্তায় ছিলাম কিন্তু পেমেন্ট করার ১০ মিনিটের মধ্যে অরিজিনাল লাইসেন্স পেয়ে গেছি। আলহামদুলিল্লাহ!",
    name: "Abuturaf Mia",
    initials: "AM",
    date: "Jun 29, 2025",
    accent: "#f59e0b",
  },
];

const column2Reviews: CustomerReview[] = [
  {
    tag: "VERIFIED PURCHASE",
    quote:
      "If you are new at this service — this is the perfect site for you. They helped me well. I am very thankful.",
    name: "Kamrul Hasan",
    initials: "KH",
    date: "Jun 30, 2025",
    accent: "#0ea5e9",
  },
  {
    tag: "WINDOWS + OFFICE",
    quote:
      "Trustable shop & very quick service, better support provided. I bought Windows 10 and Office 2024.",
    name: "Fazlul Karim Anik",
    initials: "FK",
    date: "Feb 3, 2025",
    accent: "#ec4899",
  },
  {
    tag: "VERIFIED PURCHASE",
    quote:
      "আজকে এক বছরের জন্য সাবস্ক্রিপশন নিলাম। সবকিছু ঠিকঠাক আছে এবং সাপোর্ট ইনস্ট্যান্ট থাকে যা অনেক বড় কোম্পানিও দিতে পারে না।",
    name: "Md Tawhid",
    initials: "MT",
    date: "Feb 5, 2025",
    accent: "#8b5cf6",
  },
  {
    tag: "ADOBE CREATIVE CLOUD",
    quote:
      "Official Adobe Enterprise invitation came directly to my personal email. Working flawlessly on my PC and MacBook!",
    name: "Tanvir Islam",
    initials: "TI",
    date: "Jul 19, 2025",
    accent: "#f97316",
  },
];

const column3Reviews: CustomerReview[] = [
  {
    tag: "VERIFIED PURCHASE",
    quote:
      "Thank you for your service. I am grateful for the passion and professionalism you continue to bring to your service.",
    name: "Rizon Islam",
    initials: "RI",
    date: "Jun 14, 2025",
    accent: "#ec4899",
  },
  {
    tag: "MICROSOFT 365",
    quote:
      "Started to use their 365 version on my personal email. 1TB OneDrive and Office apps working great. Thanks to Tech Solutions BD!",
    name: "Abdullah As Sadik",
    initials: "AS",
    date: "Jan 27, 2025",
    accent: "#10b981",
  },
  {
    tag: "VERIFIED PURCHASE",
    quote: "Nice service. Trusted page for genuine software keys in Bangladesh.",
    name: "Md Amirul Islam",
    initials: "AI",
    date: "Nov 13, 2025",
    accent: "#f97316",
  },
  {
    tag: "OFFICE 2024 PRO PLUS",
    quote:
      "অফিস ২০২৪ প্রো প্লাস লাইসেন্স কী নিয়েছি। অ্যাক্টিভেশন করতে গিয়ে যেটুকু সমস্যা হয়েছিল সাপোর্ট টিম সাথে সাথে সমাধান করে দিয়েছে।",
    name: "Sadiya Afrin",
    initials: "SA",
    date: "May 18, 2025",
    accent: "#6366f1",
  },
];

const column4Reviews: CustomerReview[] = [
  {
    tag: "VERIFIED PURCHASE",
    quote: "Best page. Thank YOU so much for your quick and reliable service.",
    name: "LX Mamun",
    initials: "LM",
    date: "Jun 14, 2025",
    accent: "#f59e0b",
  },
  {
    tag: "CANVA & AI TOOLS",
    quote:
      "Your service is very helpful and your response is quick. Everyone can try buying genuine subscriptions from this page. Thank you so much.",
    name: "MD Al-Amin",
    initials: "AA",
    date: "Jun 14, 2025",
    accent: "#10b981",
  },
  {
    tag: "IDM LIFETIME KEY",
    quote:
      "অরিজিনাল আইডিএম লাইফটাইম সিরিয়াল কী নিলাম। আপডেট দিলেও কোনো সমস্যা হয় না। অসংখ্য ধন্যবাদ Tech Solutions BD কে!",
    name: "Rakibul Hasan",
    initials: "RH",
    date: "Sep 04, 2025",
    accent: "#0ea5e9",
  },
  {
    tag: "AUTODESK SUBSCRIPTION",
    quote:
      "Activated AutoCAD and Revit on my own Autodesk account within 15 minutes. Genuine license at the best price in BD!",
    name: "Nafis Chowdhury",
    initials: "NC",
    date: "Aug 29, 2025",
    accent: "#8b5cf6",
  },
];

const columns = [
  { id: "col-1", direction: "up" as const, duration: "32s", items: column1Reviews },
  { id: "col-2", direction: "down" as const, duration: "36s", items: column2Reviews },
  { id: "col-3", direction: "up" as const, duration: "34s", items: column3Reviews },
  { id: "col-4", direction: "down" as const, duration: "38s", items: column4Reviews },
];

export function Reviews() {
  return (
    <section className="cr-section" id="reviews">
      <div className="cr-container">
        <div className="cr-header">
          <div className="cr-badge-pill">
            <span className="cr-badge-star" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className="cr-badge-text">CUSTOMER REVIEWS</span>
          </div>

          <p className="cr-subtitle">
            সারা বাংলাদেশ থেকে গ্রাহকরা আমাদের সার্ভিস নিয়ে যা বলছেন
          </p>

          <div className="cr-stats-row" aria-label="Customer satisfaction statistics">
            <div className="cr-stat-card">
              <div className="cr-stat-value">
                <span>5.0</span>
                <span className="cr-stat-star" aria-hidden="true">
                  ★
                </span>
              </div>
              <span className="cr-stat-label">গড় রেটিং</span>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-value">50,000+</div>
              <span className="cr-stat-label">সন্তুষ্ট গ্রাহক</span>
            </div>

            <div className="cr-stat-card">
              <div className="cr-stat-value">99%</div>
              <span className="cr-stat-label">পজিটিভ রিভিউ</span>
            </div>
          </div>
        </div>

        <div className="cr-columns-viewport">
          {columns.map((col) => {
            const loopItems = [...col.items, ...col.items];
            const trackStyle = {
              "--duration": col.duration,
            } as CSSProperties;

            return (
              <div className="cr-column" key={col.id}>
                <div
                  className={`cr-track ${
                    col.direction === "up" ? "cr-track--up" : "cr-track--down"
                  }`}
                  style={trackStyle}
                >
                  {loopItems.map((review, idx) => {
                    const cardStyle = {
                      "--card-accent": review.accent,
                    } as CSSProperties;

                    return (
                      <article
                        className="cr-card"
                        style={cardStyle}
                        key={`${col.id}-${review.name}-${idx}`}
                      >
                        <div className="cr-card-top">
                          <div className="cr-card-tag-wrap">
                            <span className="cr-quote-icon" aria-hidden="true">
                              ❝
                            </span>
                            <span className="cr-card-tag">{review.tag}</span>
                          </div>
                          <div
                            className="cr-stars"
                            aria-label="5 out of 5 stars"
                          >
                            ★★★★★
                          </div>
                        </div>

                        <p className="cr-quote-text">“{review.quote}”</p>

                        <div className="cr-author-row">
                          <span className="cr-avatar" aria-hidden="true">
                            {review.initials}
                          </span>
                          <div className="cr-author-meta">
                            <div className="cr-author-name-row">
                              <span className="cr-author-name">{review.name}</span>
                              <span
                                className="cr-verified-badge"
                                title="Verified Customer"
                                aria-label="Verified Customer"
                              >
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            </div>
                            <span className="cr-review-source">
                              Facebook Review · {review.date}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
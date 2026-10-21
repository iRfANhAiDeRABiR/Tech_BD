import type { Metadata } from "next";
import PolicyCopyProtection from "@/components/policies/PolicyCopyProtection";
import styles from "../policies.module.css";

export const metadata: Metadata = {
  title: "Delivery Info | Tech Solutions BD",
  description: "How Tech Solutions BD delivers digital software licenses — timeframes, methods, and what to do if delayed.",
};

export default function DeliveryInfoPage() {
  return (
    <main className={`${styles.page} ${styles.copyRestricted}`} data-policy-copy-protected="true">
      <PolicyCopyProtection />
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>⚡ Digital Delivery</span>
          <h1 className={styles.title}>Delivery Info</h1>
          <p className={styles.subtitle}>
            We deliver 100% digitally — no waiting for shipping. Your license key goes straight to your inbox.
          </p>
          <div className={styles.meta}>
            <span>🗓 Last updated: July 2025</span>
          </div>
        </header>

        {/* Speed summary — full width */}
        <div className={styles.section} style={{ background: "color-mix(in srgb, var(--accent-secondary) 6%, var(--bg-card))", borderColor: "color-mix(in srgb, var(--accent-secondary) 22%, var(--border-glass))", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, textAlign: "center" }}>
            {[
              { time: "5–30 min", label: "Standard Orders / সাধারণ অর্ডার" },
              { time: "Up to 3 hrs", label: "Peak Times / ব্যস্ত সময়" },
              { time: "Max 24 hrs", label: "Complex Products / জটিল পণ্য" },
            ].map((item) => (
              <div key={item.label}>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-secondary)", margin: "0 0 4px" }}>{item.time}</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bilingualHeader}>
          <span className={styles.langLabel}>🇬🇧 English</span>
          <span className={styles.langLabel}>🇧🇩 বাংলা</span>
        </div>

        {/* Note row */}
        <div className={styles.bilingualRow}>
          <div className={styles.note}>
            Delivery times are counted from the moment your payment is verified. Contact us on WhatsApp or Telegram if you haven&apos;t received your order after 24 hours.
          </div>
          <div className={styles.note}>
            পেমেন্ট যাচাইয়ের পর থেকে ডেলিভারির সময় গণনা শুরু হয়। ২৪ ঘণ্টার মধ্যে অর্ডার না পেলে WhatsApp বা Telegram-এ যোগাযোগ করুন।
          </div>
        </div>

        {/* Section 1 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>1</span>
              <h2 className={styles.sectionTitle}>Delivery Methods</h2>
            </div>
            <ul className={styles.list}>
              <li><strong>Email delivery:</strong> License key, activation code, and instructions sent to your registered email.</li>
              <li><strong>Account delivery:</strong> Some products (e.g., Microsoft 365 Family) are delivered via a shared account — credentials sent by email.</li>
              <li><strong>WhatsApp:</strong> For urgent orders, delivery details can also be shared directly on WhatsApp upon request.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>ডেলিভারি পদ্ধতি</h2>
            </div>
            <ul className={styles.list}>
              <li><strong>ইমেইল ডেলিভারি:</strong> লাইসেন্স কী, অ্যাক্টিভেশন কোড ও নির্দেশিকা নিবন্ধিত ইমেইলে পাঠানো হয়।</li>
              <li><strong>অ্যাকাউন্ট ডেলিভারি:</strong> কিছু পণ্য (যেমন Microsoft 365 Family) শেয়ারড অ্যাকাউন্টের মাধ্যমে ডেলিভারি হয় — ইমেইলে শংসাপত্র পাঠানো হয়।</li>
              <li><strong>WhatsApp:</strong> জরুরি অর্ডারের জন্য অনুরোধ করলে সরাসরি WhatsApp-এ ডেলিভারি বিবরণ দেওয়া হয়।</li>
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>2</span>
              <h2 className={styles.sectionTitle}>Estimated Times by Product</h2>
            </div>
            <table className={styles.timeTable}>
              <thead>
                <tr><th>Product Type</th><th>Est. Time</th></tr>
              </thead>
              <tbody>
                <tr><td>Windows / Office License Key</td><td>5–30 min</td></tr>
                <tr><td>Microsoft 365 (Personal / Family)</td><td>5–30 min</td></tr>
                <tr><td>Adobe Creative Cloud</td><td>5–30 min</td></tr>
                <tr><td>VPN / Anti-Virus</td><td>5–30 min</td></tr>
                <tr><td>Complex / Enterprise Setup</td><td>Up to 24 hrs</td></tr>
              </tbody>
            </table>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>পণ্য অনুযায়ী আনুমানিক ডেলিভারির সময়</h2>
            </div>
            <table className={styles.timeTable}>
              <thead>
                <tr><th>পণ্যের ধরন</th><th>আনু. সময়</th></tr>
              </thead>
              <tbody>
                <tr><td>Windows / Office লাইসেন্স কী</td><td>৫–৩০ মিনিট</td></tr>
                <tr><td>Microsoft 365 (ব্যক্তিগত / পারিবারিক)</td><td>৫–৩০ মিনিট</td></tr>
                <tr><td>Adobe Creative Cloud</td><td>৫–৩০ মিনিট</td></tr>
                <tr><td>VPN / অ্যান্টি-ভাইরাস</td><td>৫–৩০ মিনিট</td></tr>
                <tr><td>জটিল / এন্টারপ্রাইজ সেটআপ</td><td>সর্বোচ্চ ২৪ ঘণ্টা</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>3</span>
              <h2 className={styles.sectionTitle}>After Delivery</h2>
            </div>
            <ul className={styles.list}>
              <li>Activate your product as soon as possible after receiving it.</li>
              <li>If activation fails, contact us within <strong>24 hours</strong> — we&apos;ll replace the key or troubleshoot with you.</li>
              <li>Follow the activation guide included in your delivery email.</li>
              <li>For subscription products, note the renewal date provided in the email.</li>
              <li>Our support team is available 24/7 on WhatsApp and Telegram.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>ডেলিভারির পর</h2>
            </div>
            <ul className={styles.list}>
              <li>পণ্য পাওয়ার সাথে সাথে অ্যাক্টিভেট করুন।</li>
              <li>অ্যাক্টিভেশন ব্যর্থ হলে <strong>২৪ ঘণ্টার মধ্যে</strong> যোগাযোগ করুন — আমরা কী প্রতিস্থাপন করব বা সমস্যা সমাধান করব।</li>
              <li>ডেলিভারি ইমেইলে অন্তর্ভুক্ত অ্যাক্টিভেশন গাইড অনুসরণ করুন।</li>
              <li>সাবস্ক্রিপশন পণ্যের ক্ষেত্রে ইমেইলে দেওয়া নবায়নের তারিখ মনে রাখুন।</li>
              <li>আমাদের সাপোর্ট টিম WhatsApp ও Telegram-এ ২৪/৭ সক্রিয়।</li>
            </ul>
          </div>
        </div>

        {/* Section 4 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>4</span>
              <h2 className={styles.sectionTitle}>If You Haven&apos;t Received Your Order</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Check your spam/junk folder</p>
                  <p className={styles.stepDesc}>Delivery emails sometimes end up in spam. Search for &quot;Tech Solutions BD&quot; in your inbox.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Check your account&apos;s order page</p>
                  <p className={styles.stepDesc}>Log in and check My Orders — your delivery may be listed there even if the email was missed.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Contact us on WhatsApp</p>
                  <p className={styles.stepDesc}>If more than 24 hours have passed, send your order ID and transaction reference to our WhatsApp.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>4</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Confirm your email address</p>
                  <p className={styles.stepDesc}>If you entered an incorrect email at checkout, contact us to arrange re-delivery.</p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>ডেলিভারি না পেলে কী করবেন</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>১</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>স্প্যাম/জাংক ফোল্ডার চেক করুন</p>
                  <p className={styles.stepDesc}>ডেলিভারি ইমেইল কখনো কখনো স্প্যামে যায়। ইনবক্সে &quot;Tech Solutions BD&quot; সার্চ করুন।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>২</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>অ্যাকাউন্টের My Orders চেক করুন</p>
                  <p className={styles.stepDesc}>লগইন করে My Orders দেখুন — ইমেইল মিস হলেও সেখানে ডেলিভারি থাকতে পারে।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>৩</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>WhatsApp-এ যোগাযোগ করুন</p>
                  <p className={styles.stepDesc}>২৪ ঘণ্টার বেশি হলে অর্ডার আইডি ও ট্রানজেকশন রেফারেন্সসহ WhatsApp-এ মেসেজ করুন।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>৪</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>ইমেইল ঠিকানা নিশ্চিত করুন</p>
                  <p className={styles.stepDesc}>চেকআউটে ভুল ইমেইল দিয়ে থাকলে পুনরায় ডেলিভারির ব্যবস্থার জন্য আমাদের সাথে যোগাযোগ করুন।</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2>Delivery issue? / ডেলিভারিতে সমস্যা?</h2>
          <p>We&apos;re online 24/7. Message us and we&apos;ll sort it out fast. / আমরা ২৪/৭ অনলাইন। মেসেজ করুন, দ্রুত সমাধান করব।</p>
          <div className={styles.contactLinks}>
            <a href="https://wa.me/message/7ZV3N6YFBF5ED1" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
            <a href="https://t.me/techsolutionsbd247" target="_blank" rel="noopener noreferrer">✈️ Telegram</a>
            <a href="mailto:info@techsolutions.bd">✉️ info@techsolutions.bd</a>
            <a href="tel:+8809697399879">📞 +880 9697399879</a>
          </div>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import PolicyCopyProtection from "@/components/policies/PolicyCopyProtection";
import styles from "../policies.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Tech Solutions BD",
  description: "How Tech Solutions BD collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={`${styles.page} ${styles.copyRestricted}`} data-policy-copy-protected="true">
      <PolicyCopyProtection />
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>🔒 Privacy</span>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.subtitle}>
            Your privacy matters to us. This policy explains what information we collect, how we use it, and how we keep it safe.
          </p>
          <div className={styles.meta}>
            <span>🗓 Last updated: July 2025</span>
            <span>🏢 Tech Solutions BD, Dhaka, Bangladesh</span>
          </div>
        </header>

        <div className={styles.bilingualHeader}>
          <span className={styles.langLabel}>🇬🇧 English</span>
          <span className={styles.langLabel}>🇧🇩 বাংলা</span>
        </div>

        {/* Section 1 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>1</span>
              <h2 className={styles.sectionTitle}>Information We Collect</h2>
            </div>
            <ul className={styles.list}>
              <li><strong>Contact details:</strong> Name, email address, and phone number provided when you place an order or contact us.</li>
              <li><strong>Order data:</strong> Products purchased, payment method used, transaction reference numbers.</li>
              <li><strong>Device &amp; usage data:</strong> Browser type, IP address, and pages visited — used only for security and site improvement.</li>
              <li>We do not store full card numbers or mobile banking credentials.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>আমরা কী তথ্য সংগ্রহ করি</h2>
            </div>
            <ul className={styles.list}>
              <li><strong>যোগাযোগের তথ্য:</strong> অর্ডার দেওয়া বা যোগাযোগ করার সময় প্রদত্ত নাম, ইমেইল ঠিকানা ও ফোন নম্বর।</li>
              <li><strong>অর্ডার ডেটা:</strong> কেনা পণ্য, ব্যবহৃত পেমেন্ট পদ্ধতি, লেনদেন রেফারেন্স নম্বর।</li>
              <li><strong>ডিভাইস ও ব্যবহার তথ্য:</strong> ব্রাউজারের ধরন, আইপি ঠিকানা এবং পরিদর্শিত পেজ — শুধুমাত্র নিরাপত্তা ও সাইট উন্নয়নের জন্য।</li>
              <li>আমরা পূর্ণ কার্ড নম্বর বা মোবাইল ব্যাংকিং শংসাপত্র সংরক্ষণ করি না।</li>
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>2</span>
              <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
            </div>
            <ul className={styles.list}>
              <li>To process and deliver your order (license keys, activation instructions).</li>
              <li>To send order confirmation and support communications to your email.</li>
              <li>To verify payments and prevent fraudulent transactions.</li>
              <li>To respond to support requests via WhatsApp, Telegram, or email.</li>
              <li>To improve our products, pricing, and website experience.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>কীভাবে আমরা আপনার তথ্য ব্যবহার করি</h2>
            </div>
            <ul className={styles.list}>
              <li>আপনার অর্ডার প্রক্রিয়া ও ডেলিভারির জন্য (লাইসেন্স কী, অ্যাক্টিভেশন নির্দেশিকা)।</li>
              <li>অর্ডার নিশ্চিতকরণ ও সাপোর্ট যোগাযোগ আপনার ইমেইলে পাঠাতে।</li>
              <li>পেমেন্ট যাচাই ও জালিয়াতিমূলক লেনদেন প্রতিরোধে।</li>
              <li>WhatsApp, Telegram বা ইমেইলে সাপোর্ট অনুরোধে সাড়া দিতে।</li>
              <li>আমাদের পণ্য, মূল্য ও ওয়েবসাইট অভিজ্ঞতা উন্নত করতে।</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>3</span>
              <h2 className={styles.sectionTitle}>Information Sharing</h2>
            </div>
            <ul className={styles.list}>
              <li>We do <strong>not</strong> sell, rent, or trade your personal information to third parties.</li>
              <li>We may share information with payment processors (bKash, Nagad, etc.) solely to complete transactions.</li>
              <li>We may disclose information if required by Bangladeshi law or lawful authority.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>তথ্য শেয়ার</h2>
            </div>
            <ul className={styles.list}>
              <li>আমরা তৃতীয় পক্ষের কাছে আপনার ব্যক্তিগত তথ্য <strong>বিক্রি, ভাড়া বা বিনিময় করি না।</strong></li>
              <li>শুধুমাত্র লেনদেন সম্পন্ন করার জন্য পেমেন্ট প্রসেসরদের (bKash, Nagad ইত্যাদি) সাথে তথ্য শেয়ার হতে পারে।</li>
              <li>বাংলাদেশের আইন বা আইনি কর্তৃপক্ষের প্রয়োজনে তথ্য প্রকাশ করা হতে পারে।</li>
            </ul>
          </div>
        </div>

        {/* Section 4 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>4</span>
              <h2 className={styles.sectionTitle}>Data Security</h2>
            </div>
            <ul className={styles.list}>
              <li>Order and account data is stored on secured, access-controlled servers.</li>
              <li>Passwords are hashed and never stored in plain text.</li>
              <li>We use HTTPS encryption for all data transmitted between your browser and our site.</li>
              <li>We limit staff access to customer data to those who need it to provide support.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>ডেটা নিরাপত্তা</h2>
            </div>
            <ul className={styles.list}>
              <li>অর্ডার ও অ্যাকাউন্ট ডেটা নিরাপদ, অ্যাক্সেস-নিয়ন্ত্রিত সার্ভারে সংরক্ষিত।</li>
              <li>পাসওয়ার্ড হ্যাশ করা হয় এবং কখনো প্লেইন টেক্সটে সংরক্ষণ করা হয় না।</li>
              <li>আপনার ব্রাউজার ও আমাদের সাইটের মধ্যে প্রেরিত সকল ডেটায় HTTPS এনক্রিপশন ব্যবহার করা হয়।</li>
              <li>সাপোর্টের জন্য প্রয়োজনীয় কর্মীর বাইরে গ্রাহক ডেটায় অ্যাক্সেস সীমিত।</li>
            </ul>
          </div>
        </div>

        {/* Section 5 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>5</span>
              <h2 className={styles.sectionTitle}>Your Rights</h2>
            </div>
            <ul className={styles.list}>
              <li>You may request a copy of the personal data we hold about you.</li>
              <li>You may request correction of inaccurate information.</li>
              <li>You may request deletion of your account and associated data (subject to legal retention obligations).</li>
              <li>To exercise any of these rights, contact us at <a href="mailto:info@techsolutions.bd" style={{ color: "var(--accent-primary)" }}>info@techsolutions.bd</a>.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>আপনার অধিকার</h2>
            </div>
            <ul className={styles.list}>
              <li>আমাদের কাছে রক্ষিত আপনার ব্যক্তিগত ডেটার কপি চাইতে পারবেন।</li>
              <li>ভুল তথ্য সংশোধনের অনুরোধ করতে পারবেন।</li>
              <li>আপনার অ্যাকাউন্ট ও সংশ্লিষ্ট ডেটা মুছে ফেলার অনুরোধ করতে পারবেন (আইনি ধারণ বাধ্যবাধকতা সাপেক্ষে)।</li>
              <li>এই অধিকার প্রয়োগ করতে <a href="mailto:info@techsolutions.bd" style={{ color: "var(--accent-primary)" }}>info@techsolutions.bd</a>-এ যোগাযোগ করুন।</li>
            </ul>
          </div>
        </div>

        {/* Section 6 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>6</span>
              <h2 className={styles.sectionTitle}>Cookies</h2>
            </div>
            <ul className={styles.list}>
              <li>We use essential cookies to keep you logged in and remember your cart.</li>
              <li>No advertising or third-party tracking cookies are used.</li>
              <li>You can disable cookies in your browser settings, but some site features may not work correctly.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>কুকিজ</h2>
            </div>
            <ul className={styles.list}>
              <li>আপনাকে লগইন রাখতে ও কার্ট মনে রাখতে আমরা প্রয়োজনীয় কুকিজ ব্যবহার করি।</li>
              <li>কোনো বিজ্ঞাপন বা তৃতীয় পক্ষের ট্র্যাকিং কুকিজ ব্যবহার করা হয় না।</li>
              <li>ব্রাউজার সেটিংস থেকে কুকিজ অক্ষম করা যাবে, তবে কিছু সাইট ফিচার সঠিকভাবে কাজ নাও করতে পারে।</li>
            </ul>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2>Privacy questions? / গোপনীয়তা বিষয়ক প্রশ্ন?</h2>
          <p>Reach out and we&apos;ll respond within 1–2 business days. / যোগাযোগ করুন, আমরা ১–২ কার্যদিবসের মধ্যে সাড়া দেব।</p>
          <div className={styles.contactLinks}>
            <a href="mailto:info@techsolutions.bd">✉️ info@techsolutions.bd</a>
            <a href="https://wa.me/message/7ZV3N6YFBF5ED1" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
            <a href="tel:+8809697399879">📞 +880 9697399879</a>
          </div>
        </div>
      </div>
    </main>
  );
}

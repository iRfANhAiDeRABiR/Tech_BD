import type { Metadata } from "next";
import PolicyCopyProtection from "@/components/policies/PolicyCopyProtection";
import styles from "../policies.module.css";

export const metadata: Metadata = {
  title: "Terms & Conditions | Tech Solutions BD",
  description: "Read the Terms & Conditions for using Tech Solutions BD.",
};

export default function TermsPage() {
  return (
    <main className={`${styles.page} ${styles.copyRestricted}`} data-policy-copy-protected="true">
      <PolicyCopyProtection />
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>📄 Legal Document</span>
          <h1 className={styles.title}>Terms &amp; Conditions</h1>
          <p className={styles.subtitle}>
            By using Tech Solutions BD you agree to these terms. Please read them carefully before making a purchase.
          </p>
          <div className={styles.meta}>
            <span>🗓 Last updated: July 2025</span>
            <span>🏢 Tech Solutions BD, Dhaka, Bangladesh</span>
          </div>
        </header>

        {/* Language labels */}
        <div className={styles.bilingualHeader}>
          <span className={styles.langLabel}>🇬🇧 English</span>
          <span className={styles.langLabel}>🇧🇩 বাংলা</span>
        </div>

        {/* Intro note */}
        <div className={styles.bilingualRow}>
          <div className={styles.note}>
            These Terms &amp; Conditions apply to all purchases and use of services on Tech Solutions BD. By browsing or placing an order you confirm you have read, understood, and agreed to these terms.
          </div>
          <div className={styles.note}>
            এই শর্তাবলী Tech Solutions BD-এর সকল ক্রয় ও সেবা ব্যবহারের ক্ষেত্রে প্রযোজ্য। সাইট ব্রাউজ করে বা অর্ডার দিয়ে আপনি নিশ্চিত করছেন যে আপনি এই শর্তগুলো পড়েছেন, বুঝেছেন এবং সম্মত হয়েছেন।
          </div>
        </div>

        {/* Section 1 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>1</span>
              <h2 className={styles.sectionTitle}>About Our Services</h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: 14 }}>
              Tech Solutions BD is a digital software store based in Dhaka, Bangladesh. We sell and deliver:
            </p>
            <ul className={styles.list}>
              <li>Windows OS &amp; Microsoft Office license keys</li>
              <li>Microsoft 365 subscriptions (Personal, Family, Business)</li>
              <li>Adobe Creative Cloud &amp; standalone app licenses</li>
              <li>VPN software and Anti-Virus subscriptions</li>
              <li>Other genuine digital software licenses</li>
            </ul>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginTop: 14 }}>
              All products are delivered digitally — no physical shipping involved.
            </p>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>আমাদের পরিষেবার বিবরণ</h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: 14 }}>
              Tech Solutions BD বাংলাদেশের ঢাকাভিত্তিক একটি ডিজিটাল সফটওয়্যার স্টোর। আমরা বিক্রয় ও সরবরাহ করি:
            </p>
            <ul className={styles.list}>
              <li>Windows OS ও Microsoft Office লাইসেন্স কী</li>
              <li>Microsoft 365 সাবস্ক্রিপশন (ব্যক্তিগত, পারিবারিক, ব্যবসায়িক)</li>
              <li>Adobe Creative Cloud ও স্বতন্ত্র অ্যাপ লাইসেন্স</li>
              <li>VPN সফটওয়্যার ও অ্যান্টি-ভাইরাস সাবস্ক্রিপশন</li>
              <li>অন্যান্য বৈধ ডিজিটাল সফটওয়্যার লাইসেন্স</li>
            </ul>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginTop: 14 }}>
              সকল পণ্য ডিজিটালভাবে সরবরাহ করা হয় — কোনো ভৌত শিপিং নেই।
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>2</span>
              <h2 className={styles.sectionTitle}>Account &amp; User Responsibilities</h2>
            </div>
            <ul className={styles.list}>
              <li>You must be at least 18 years old to place an order.</li>
              <li>You are responsible for keeping your account credentials secure.</li>
              <li>One person may not hold multiple accounts for the same purpose.</li>
              <li>Accounts used for fraudulent activity will be permanently banned.</li>
              <li>You must provide accurate contact and payment information.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>অ্যাকাউন্ট ও ব্যবহারকারীর দায়িত্ব</h2>
            </div>
            <ul className={styles.list}>
              <li>অর্ডার দিতে হলে আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে।</li>
              <li>অ্যাকাউন্টের লগইন তথ্য নিরাপদ রাখার দায়িত্ব আপনার।</li>
              <li>একই উদ্দেশ্যে একাধিক অ্যাকাউন্ট খোলা যাবে না।</li>
              <li>প্রতারণামূলক কার্যকলাপে ব্যবহৃত অ্যাকাউন্ট স্থায়ীভাবে বন্ধ করা হবে।</li>
              <li>সঠিক যোগাযোগ ও পেমেন্ট তথ্য প্রদান করা বাধ্যতামূলক।</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>3</span>
              <h2 className={styles.sectionTitle}>Pricing &amp; Payment</h2>
            </div>
            <ul className={styles.list}>
              <li>All prices are listed in Bangladeshi Taka (BDT).</li>
              <li>We accept bKash, Nagad, Rocket, UPAY, VISA, and Mastercard.</li>
              <li>Payment must be completed before your order is confirmed and delivered.</li>
              <li>Prices are subject to change without prior notice.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>মূল্য ও পেমেন্ট</h2>
            </div>
            <ul className={styles.list}>
              <li>সকল মূল্য বাংলাদেশি টাকায় (BDT) উল্লেখ করা হয়।</li>
              <li>আমরা bKash, Nagad, Rocket, UPAY, VISA ও Mastercard গ্রহণ করি।</li>
              <li>অর্ডার নিশ্চিত ও পণ্য সরবরাহের আগে পেমেন্ট সম্পন্ন করতে হবে।</li>
              <li>পূর্ব নোটিশ ছাড়াই মূল্য পরিবর্তন করার অধিকার আমাদের রয়েছে।</li>
            </ul>
          </div>
        </div>

        {/* Section 4 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>4</span>
              <h2 className={styles.sectionTitle}>Digital Product Delivery</h2>
            </div>
            <ul className={styles.list}>
              <li>Most orders are delivered within 5–30 minutes of payment confirmation.</li>
              <li>License keys or activation instructions are sent to your registered email.</li>
              <li>Delivery may take up to 24 hours during peak periods.</li>
              <li>Once a license key is delivered it cannot be recalled or re-issued for the same order.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>ডিজিটাল পণ্য সরবরাহ নীতি</h2>
            </div>
            <ul className={styles.list}>
              <li>পেমেন্ট নিশ্চিত হওয়ার পর বেশিরভাগ অর্ডার ৫–৩০ মিনিটের মধ্যে ডেলিভারি হয়।</li>
              <li>লাইসেন্স কী বা অ্যাক্টিভেশন নির্দেশিকা আপনার নিবন্ধিত ইমেইলে পাঠানো হয়।</li>
              <li>ব্যস্ত সময়ে ডেলিভারিতে ২৪ ঘণ্টা পর্যন্ত সময় লাগতে পারে।</li>
              <li>একবার লাইসেন্স কী সরবরাহ হলে একই অর্ডারে পুনরায় ইস্যু করা যাবে না।</li>
            </ul>
          </div>
        </div>

        {/* Section 5 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>5</span>
              <h2 className={styles.sectionTitle}>Prohibited Activities</h2>
            </div>
            <ul className={styles.list}>
              <li>Reselling purchased keys without written permission from Tech Solutions BD.</li>
              <li>Attempting to obtain a refund after successfully activating a product.</li>
              <li>Sharing your license key with others beyond permitted use.</li>
              <li>Using system vulnerabilities or bots to place fraudulent orders.</li>
              <li>Creating fake payment screenshots or misrepresenting transactions.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>নিষিদ্ধ কার্যক্রম</h2>
            </div>
            <ul className={styles.list}>
              <li>Tech Solutions BD-এর লিখিত অনুমতি ছাড়া কেনা কী পুনরায় বিক্রি করা।</li>
              <li>পণ্য সফলভাবে অ্যাক্টিভ করার পর রিফান্ড চাওয়ার চেষ্টা করা।</li>
              <li>অনুমোদিত সীমার বাইরে লাইসেন্স কী অন্যদের সাথে শেয়ার করা।</li>
              <li>সিস্টেমের দুর্বলতা বা বট ব্যবহার করে জালিয়াতিমূলক অর্ডার দেওয়া।</li>
              <li>ভুয়া পেমেন্ট স্ক্রিনশট তৈরি বা লেনদেন মিথ্যাভাবে উপস্থাপন করা।</li>
            </ul>
          </div>
        </div>

        {/* Section 6 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>6</span>
              <h2 className={styles.sectionTitle}>Liability Limitations</h2>
            </div>
            <ul className={styles.list}>
              <li>We are not responsible for errors caused by third-party software vendors.</li>
              <li>We are not liable for losses arising from internet downtime or email delivery issues.</li>
              <li>We are not responsible if you use a product outside its permitted scope.</li>
              <li>Maximum liability is limited to the amount paid for the specific order.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>দায় সীমা</h2>
            </div>
            <ul className={styles.list}>
              <li>তৃতীয় পক্ষের সফটওয়্যার বিক্রেতার ত্রুটির জন্য আমরা দায়ী নই।</li>
              <li>ইন্টারনেট বিভ্রাট বা ইমেইল ডেলিভারি সমস্যাজনিত ক্ষতির জন্য আমরা দায়ী নই।</li>
              <li>অনুমোদিত সীমার বাইরে পণ্য ব্যবহার করলে আমরা দায়ী নই।</li>
              <li>সর্বোচ্চ দায় সংশ্লিষ্ট অর্ডারের পরিশোধিত অর্থের মধ্যে সীমাবদ্ধ।</li>
            </ul>
          </div>
        </div>

        {/* Section 7 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>7</span>
              <h2 className={styles.sectionTitle}>Policy Changes</h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
              Tech Solutions BD reserves the right to update these terms at any time. Changes take effect as soon as they are published on this page. Continued use of the website after changes constitutes your acceptance of the revised terms.
            </p>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>শর্তাবলী পরিবর্তন</h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
              Tech Solutions BD যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখে। পরিবর্তন এই পেজে প্রকাশিত হওয়ার সাথে সাথে কার্যকর হয়। পরিবর্তনের পরেও সাইট ব্যবহার অব্যাহত রাখলে আপনি সংশোধিত শর্তাবলীতে সম্মত হয়েছেন বলে গণ্য হবে।
            </p>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2>Questions about these terms? / শর্তাবলী নিয়ে প্রশ্ন আছে?</h2>
          <p>Contact our support team. / আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।</p>
          <div className={styles.contactLinks}>
            <a href="https://wa.me/message/7ZV3N6YFBF5ED1" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
            <a href="mailto:info@techsolutions.bd">✉️ info@techsolutions.bd</a>
            <a href="tel:+8809697399879">📞 +880 9697399879</a>
            <a href="https://t.me/techsolutionsbd247" target="_blank" rel="noopener noreferrer">✈️ Telegram</a>
          </div>
        </div>
      </div>
    </main>
  );
}

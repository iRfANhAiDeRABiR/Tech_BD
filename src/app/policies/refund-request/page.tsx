import type { Metadata } from "next";
import Link from "next/link";
import PolicyCopyProtection from "@/components/policies/PolicyCopyProtection";
import styles from "../policies.module.css";

export const metadata: Metadata = {
  title: "Refund Request | Tech Solutions BD",
  description: "Submit a refund request for your Tech Solutions BD order.",
};

export default function RefundRequestPage() {
  return (
    <main className={`${styles.page} ${styles.copyRestricted}`} data-policy-copy-protected="true">
      <PolicyCopyProtection />
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>↩ Refund Request</span>
          <h1 className={styles.title}>Refund Request</h1>
          <p className={styles.subtitle}>
            Read our policy below, then contact us on WhatsApp or Telegram with your order details to open a request.
          </p>
          <div className={styles.meta}>
            <span>🗓 Last updated: July 2025</span>
          </div>
        </header>

        <div className={styles.bilingualHeader}>
          <span className={styles.langLabel}>🇬🇧 English</span>
          <span className={styles.langLabel}>🇧🇩 বাংলা</span>
        </div>

        {/* Eligibility glance */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>✓</span>
              <h2 className={styles.sectionTitle}>Eligibility Summary</h2>
            </div>
            <div className={styles.verdictRow}>
              <div className={styles.verdictYes}>
                <p className={styles.verdictTitle}>✅ Eligible for refund</p>
                <ul className={styles.list}>
                  <li>Defective key, no replacement within 24 hrs.</li>
                  <li>Wrong product received.</li>
                  <li>Request within 24 hrs of delivery.</li>
                </ul>
              </div>
              <div className={styles.verdictNo}>
                <p className={styles.verdictTitle}>❌ Not eligible</p>
                <ul className={styles.list}>
                  <li>Key already activated.</li>
                  <li>More than 24 hrs after delivery.</li>
                  <li>Change of mind.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>রিফান্ড যোগ্যতা সংক্ষেপ</h2>
            </div>
            <div className={styles.verdictRow}>
              <div className={styles.verdictYes}>
                <p className={styles.verdictTitle}>✅ রিফান্ড পাবেন</p>
                <ul className={styles.list}>
                  <li>ত্রুটিপূর্ণ কী, ২৪ ঘণ্টায় রিপ্লেসমেন্ট নেই।</li>
                  <li>ভুল পণ্য পেয়েছেন।</li>
                  <li>ডেলিভারির ২৪ ঘণ্টার মধ্যে অনুরোধ।</li>
                </ul>
              </div>
              <div className={styles.verdictNo}>
                <p className={styles.verdictTitle}>❌ রিফান্ড পাবেন না</p>
                <ul className={styles.list}>
                  <li>কী ইতোমধ্যে অ্যাক্টিভ।</li>
                  <li>ডেলিভারির ২৪ ঘণ্টা পর।</li>
                  <li>মন পরিবর্তন।</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>1</span>
              <h2 className={styles.sectionTitle}>Conditions for a Valid Request</h2>
            </div>
            <ul className={styles.list}>
              <li>The license key has not been fully activated or used.</li>
              <li>Contact us within <strong>24 hours</strong> of receiving the product.</li>
              <li>Provide your order ID and payment transaction reference.</li>
              <li>A screenshot of the error (if applicable) helps speed up the review.</li>
              <li>The product fault must be confirmed by our support team.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>বৈধ আবেদনের শর্ত</h2>
            </div>
            <ul className={styles.list}>
              <li>লাইসেন্স কী সম্পূর্ণরূপে অ্যাক্টিভ বা ব্যবহার করা হয়নি।</li>
              <li>পণ্য পাওয়ার <strong>২৪ ঘণ্টার মধ্যে</strong> যোগাযোগ করুন।</li>
              <li>অর্ডার আইডি ও পেমেন্ট ট্রানজেকশন রেফারেন্স প্রদান করুন।</li>
              <li>ত্রুটির স্ক্রিনশট (প্রযোজ্য হলে) যাচাই দ্রুততর করে।</li>
              <li>পণ্যের ত্রুটি আমাদের সাপোর্ট টিম কর্তৃক নিশ্চিত হতে হবে।</li>
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>2</span>
              <h2 className={styles.sectionTitle}>When Refunds Are Not Issued</h2>
            </div>
            <ul className={styles.list}>
              <li>The key was activated and works correctly.</li>
              <li>The request comes more than 24 hours after delivery.</li>
              <li>Change of mind — digital products cannot be &quot;returned&quot;.</li>
              <li>The issue is caused by your own device or account settings.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>কখন রিফান্ড দেওয়া হয় না</h2>
            </div>
            <ul className={styles.list}>
              <li>কী অ্যাক্টিভ হয়েছে এবং সঠিকভাবে কাজ করছে।</li>
              <li>ডেলিভারির ২৪ ঘণ্টার বেশি সময় পর আবেদন।</li>
              <li>মন পরিবর্তন — ডিজিটাল পণ্য &quot;ফেরত&quot; দেওয়া সম্ভব নয়।</li>
              <li>সমস্যাটি আপনার ডিভাইস বা অ্যাকাউন্ট সেটিংসের কারণে।</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>3</span>
              <h2 className={styles.sectionTitle}>Process &amp; Timeline</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Contact us (within 24 hrs)</p>
                  <p className={styles.stepDesc}>Send your order ID, transaction reference, and issue description via WhatsApp, Telegram, or email.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Review (1–5 business days)</p>
                  <p className={styles.stepDesc}>Our team verifies your claim. We may try a replacement key first before a cash refund.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Refund payment (3–10 business days)</p>
                  <p className={styles.stepDesc}>Approved refunds are processed via the original payment method.</p>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 16, fontSize: "0.83rem", color: "var(--text-muted)" }}>
              For the full policy, see our{" "}
              <Link href="/policies/refund-policy" style={{ color: "var(--accent-primary)" }}>
                Refund &amp; Return Policy
              </Link>.
            </p>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>রিফান্ড প্রক্রিয়া ও সময়সীমা</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>১</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>যোগাযোগ করুন (২৪ ঘণ্টার মধ্যে)</p>
                  <p className={styles.stepDesc}>অর্ডার আইডি, ট্রানজেকশন রেফারেন্স ও সমস্যার বিবরণসহ WhatsApp, Telegram বা ইমেইলে পাঠান।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>২</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>যাচাই (১–৫ কার্যদিবস)</p>
                  <p className={styles.stepDesc}>আমাদের দল দাবি যাচাই করবে। নগদ রিফান্ডের আগে রিপ্লেসমেন্ট কী দেওয়ার চেষ্টা করা হবে।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>৩</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>রিফান্ড পেমেন্ট (৩–১০ কার্যদিবস)</p>
                  <p className={styles.stepDesc}>অনুমোদিত রিফান্ড মূল পেমেন্ট পদ্ধতিতে প্রক্রিয়া করা হবে।</p>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 16, fontSize: "0.83rem", color: "var(--text-muted)" }}>
              সম্পূর্ণ নীতির জন্য আমাদের{" "}
              <Link href="/policies/refund-policy" style={{ color: "var(--accent-primary)" }}>
                রিফান্ড ও ফেরত নীতি
              </Link>{" "}পেজ দেখুন।
            </p>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2>Ready to submit a request? / রিফান্ড আবেদন করতে চান?</h2>
          <p>
            Contact us with your <strong>order ID</strong> and <strong>transaction reference</strong>. We respond within 6 business hours.
            <br />
            <span style={{ color: "var(--text-muted)" }}>অর্ডার আইডি ও ট্রানজেকশন রেফারেন্সসহ যোগাযোগ করুন। ৬ কার্যঘণ্টার মধ্যে সাড়া দেব।</span>
          </p>
          <div className={styles.contactLinks}>
            <a href="https://wa.me/message/7ZV3N6YFBF5ED1" target="_blank" rel="noopener noreferrer">💬 WhatsApp (fastest)</a>
            <a href="https://t.me/techsolutionsbd247" target="_blank" rel="noopener noreferrer">✈️ Telegram</a>
            <a href="mailto:info@techsolutions.bd">✉️ info@techsolutions.bd</a>
            <a href="tel:+8809697399879">📞 +880 9697399879</a>
          </div>
        </div>
      </div>
    </main>
  );
}

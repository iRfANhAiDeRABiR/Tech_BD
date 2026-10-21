import type { Metadata } from "next";
import PolicyCopyProtection from "@/components/policies/PolicyCopyProtection";
import styles from "../policies.module.css";

export const metadata: Metadata = {
  title: "Refund & Return Policy | Tech Solutions BD",
  description: "Understand Tech Solutions BD's refund and return policy for digital software licenses.",
};

export default function RefundPolicyPage() {
  return (
    <main className={`${styles.page} ${styles.copyRestricted}`} data-policy-copy-protected="true">
      <PolicyCopyProtection />
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>↩ Customer Protection</span>
          <h1 className={styles.title}>Refund &amp; Return Policy</h1>
          <p className={styles.subtitle}>
            We stand behind every product we sell. Here&apos;s when you&apos;re eligible for a refund and how the process works.
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
              <h2 className={styles.sectionTitle}>Eligibility at a Glance</h2>
            </div>
            <div className={styles.verdictRow}>
              <div className={styles.verdictYes}>
                <p className={styles.verdictTitle}>✅ You may get a refund</p>
                <ul className={styles.list}>
                  <li>Key does not work and we can&apos;t replace it within 24 hours.</li>
                  <li>You received the wrong product.</li>
                  <li>Request made within 24 hours of delivery.</li>
                </ul>
              </div>
              <div className={styles.verdictNo}>
                <p className={styles.verdictTitle}>❌ Not applicable</p>
                <ul className={styles.list}>
                  <li>License key already activated.</li>
                  <li>More than 24 hours after delivery.</li>
                  <li>Change of mind.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>রিফান্ড যোগ্যতা এক নজরে</h2>
            </div>
            <div className={styles.verdictRow}>
              <div className={styles.verdictYes}>
                <p className={styles.verdictTitle}>✅ রিফান্ড পাবেন</p>
                <ul className={styles.list}>
                  <li>কী কাজ করেনি এবং ২৪ ঘণ্টায় রিপ্লেসমেন্ট দিতে পারিনি।</li>
                  <li>ভুল পণ্য পেয়েছেন।</li>
                  <li>ডেলিভারির ২৪ ঘণ্টার মধ্যে অনুরোধ।</li>
                </ul>
              </div>
              <div className={styles.verdictNo}>
                <p className={styles.verdictTitle}>❌ রিফান্ড পাবেন না</p>
                <ul className={styles.list}>
                  <li>লাইসেন্স কী ইতোমধ্যে অ্যাক্টিভ।</li>
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
              <h2 className={styles.sectionTitle}>Conditions for a Valid Refund</h2>
            </div>
            <ul className={styles.list}>
              <li>The license key has not been fully activated or used.</li>
              <li>You notify us within <strong>24 hours</strong> of receiving the key.</li>
              <li>Payment was completed and confirmed before delivery.</li>
              <li>The order appears in your account history.</li>
              <li>A genuine technical fault with the key is confirmed by our support team.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>বৈধ রিফান্ডের শর্তাবলী</h2>
            </div>
            <ul className={styles.list}>
              <li>লাইসেন্স কী সম্পূর্ণরূপে অ্যাক্টিভ বা ব্যবহার করা হয়নি।</li>
              <li>কী পাওয়ার <strong>২৪ ঘণ্টার মধ্যে</strong> আমাদের জানাতে হবে।</li>
              <li>ডেলিভারির আগে পেমেন্ট সম্পন্ন ও নিশ্চিত হয়েছিল।</li>
              <li>আপনার অ্যাকাউন্টের অর্ডার হিস্ট্রিতে অর্ডারটি দেখা যাচ্ছে।</li>
              <li>আমাদের সাপোর্ট টিম কী-এর প্রকৃত প্রযুক্তিগত ত্রুটি নিশ্চিত করেছে।</li>
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>2</span>
              <h2 className={styles.sectionTitle}>When Refunds Are Not Granted</h2>
            </div>
            <ul className={styles.list}>
              <li>The key was successfully activated and used.</li>
              <li>The refund request is made more than 24 hours after delivery.</li>
              <li>You are unable to provide your order details or transaction reference.</li>
              <li>Change of mind — digital products cannot be &quot;returned&quot;.</li>
              <li>The issue is caused by your own hardware, OS, or account settings.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>রিফান্ড প্রযোজ্য নয় যখন</h2>
            </div>
            <ul className={styles.list}>
              <li>কী সফলভাবে অ্যাক্টিভ ও ব্যবহার করা হয়েছে।</li>
              <li>ডেলিভারির ২৪ ঘণ্টারও বেশি সময় পর আবেদন করা হয়েছে।</li>
              <li>অর্ডারের বিবরণ বা লেনদেন রেফারেন্স দিতে পারছেন না।</li>
              <li>মন পরিবর্তন — ডিজিটাল পণ্য &quot;ফেরত&quot; দেওয়া সম্ভব নয়।</li>
              <li>সমস্যাটি আপনার নিজের হার্ডওয়্যার, OS বা অ্যাকাউন্ট সেটিংসের কারণে।</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>3</span>
              <h2 className={styles.sectionTitle}>Refund Process &amp; Timeline</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Submit request (within 24 hrs)</p>
                  <p className={styles.stepDesc}>Contact us via WhatsApp, Telegram, or email with your order ID and transaction reference.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Review (1–5 business days)</p>
                  <p className={styles.stepDesc}>Our team verifies your claim and may ask for a screenshot of the error.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Refund issued</p>
                  <p className={styles.stepDesc}>Approved refunds are sent via bKash, Nagad, or Rocket within 3–10 business days.</p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>রিফান্ড প্রক্রিয়া ও সময়সীমা</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>১</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>আবেদন জমা (২৪ ঘণ্টার মধ্যে)</p>
                  <p className={styles.stepDesc}>অর্ডার আইডি ও লেনদেন রেফারেন্সসহ WhatsApp, Telegram বা ইমেইলে যোগাযোগ করুন।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>২</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>যাচাই (১–৫ কার্যদিবস)</p>
                  <p className={styles.stepDesc}>আমাদের দল আপনার দাবি যাচাই করবে এবং ত্রুটির স্ক্রিনশট চাইতে পারে।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>৩</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>রিফান্ড প্রদান</p>
                  <p className={styles.stepDesc}>অনুমোদিত রিফান্ড ৩–১০ কার্যদিবসের মধ্যে bKash, Nagad বা Rocket-এ পাঠানো হবে।</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>4</span>
              <h2 className={styles.sectionTitle}>Special Conditions</h2>
            </div>
            <ul className={styles.list}>
              <li>Subscription products (e.g. Microsoft 365) are non-refundable once activated on a Microsoft account.</li>
              <li>For genuine faults we&apos;ll always try to provide a <strong>replacement key first</strong>.</li>
              <li>Discounted or promotional orders may have restricted refund eligibility.</li>
              <li>Bank card refunds may take an additional 5–10 working days to appear.</li>
              <li>For complex cases our team will update you within 6 business hours.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>বিশেষ শর্তাবলী</h2>
            </div>
            <ul className={styles.list}>
              <li>সাবস্ক্রিপশন পণ্য (যেমন Microsoft 365) একবার Microsoft অ্যাকাউন্টে অ্যাক্টিভ হলে রিফান্ড প্রযোজ্য নয়।</li>
              <li>প্রকৃত ত্রুটির ক্ষেত্রে আমরা সবসময় আগে <strong>রিপ্লেসমেন্ট কী</strong> দেওয়ার চেষ্টা করব।</li>
              <li>ছাড়যুক্ত বা প্রমোশনাল অর্ডারে রিফান্ড যোগ্যতা সীমিত হতে পারে।</li>
              <li>ব্যাংক কার্ড রিফান্ড স্টেটমেন্টে আসতে অতিরিক্ত ৫–১০ কার্যদিবস সময় লাগতে পারে।</li>
              <li>জটিল ক্ষেত্রে আমাদের দল ৬ কার্যঘণ্টার মধ্যে আপনাকে আপডেট জানাবে।</li>
            </ul>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2>Need to raise a refund? / রিফান্ড করতে চান?</h2>
          <p>Contact us within 24 hours of receiving your order. / অর্ডার পাওয়ার ২৪ ঘণ্টার মধ্যে যোগাযোগ করুন।</p>
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

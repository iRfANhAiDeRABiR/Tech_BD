import type { Metadata } from "next";
import PolicyCopyProtection from "@/components/policies/PolicyCopyProtection";
import styles from "../policies.module.css";
import { PAYMENT_NUMBERS } from "@/lib/payment-config";

export const metadata: Metadata = {
  title: "Order & Cancellation Policy | Tech Solutions BD",
  description: "Learn how to place an order, make payment, and cancel at Tech Solutions BD.",
};

export default function OrderCancellationPage() {
  return (
    <main className={`${styles.page} ${styles.copyRestricted}`} data-policy-copy-protected="true">
      <PolicyCopyProtection />
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>🛒 Order Guidelines</span>
          <h1 className={styles.title}>Order &amp; Cancellation Policy</h1>
          <p className={styles.subtitle}>
            Everything you need to know about placing an order, completing payment, and cancelling if needed.
          </p>
          <div className={styles.meta}>
            <span>🗓 Last updated: July 2025</span>
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
              <h2 className={styles.sectionTitle}>How to Place an Order</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Choose your product</p>
                  <p className={styles.stepDesc}>Browse the Products page, select the item, and click &quot;Add to Cart&quot; or &quot;Buy Now&quot;.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Complete payment</p>
                  <p className={styles.stepDesc}>Pay via bKash, Nagad, Rocket, UPAY, VISA, or Mastercard. Save your Transaction ID (TxnID).</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Confirm your order</p>
                  <p className={styles.stepDesc}>Enter your TxnID and email address to confirm. We&apos;ll verify and prepare your delivery.</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>4</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>Receive your product</p>
                  <p className={styles.stepDesc}>After verification (5–30 mins), your license key will be sent to your email.</p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>অর্ডার করার ধাপ</h2>
            </div>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>১</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>পণ্য বেছে নিন</p>
                  <p className={styles.stepDesc}>Products পেজ থেকে পণ্য বেছে &quot;Add to Cart&quot; বা &quot;Buy Now&quot; ক্লিক করুন।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>২</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>পেমেন্ট করুন</p>
                  <p className={styles.stepDesc}>bKash, Nagad, Rocket, UPAY, VISA বা Mastercard-এ পেমেন্ট করুন। ট্রানজেকশন আইডি (TxnID) সংরক্ষণ করুন।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>৩</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>অর্ডার কনফার্ম করুন</p>
                  <p className={styles.stepDesc}>TxnID ও ইমেইল দিয়ে অর্ডার নিশ্চিত করুন। আমরা যাচাই করে ডেলিভারি প্রস্তুত করব।</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>৪</span>
                <div className={styles.stepBody}>
                  <p className={styles.stepTitle}>পণ্য পান</p>
                  <p className={styles.stepDesc}>যাচাইয়ের পর (৫–৩০ মিনিট) লাইসেন্স কী আপনার ইমেইলে পাঠানো হবে।</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>2</span>
              <h2 className={styles.sectionTitle}>Payment Instructions</h2>
            </div>
            <ul className={styles.list}>
              <li>Always save your payment <strong>Transaction ID (TxnID)</strong> — you will need it to confirm your order.</li>
              <li>For bKash / Nagad / UPAY: send to our number <strong>{PAYMENT_NUMBERS.bkash}</strong> | Rocket: <strong>{PAYMENT_NUMBERS.rocket}</strong> using &quot;Send Money&quot;.</li>
              <li>After paying, enter the TxnID in the order confirmation step on our website.</li>
              <li>Payment by SMS or verbal confirmation is not accepted.</li>
              <li>If payment is not confirmed within 24 hours, the order may be cancelled automatically.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>পেমেন্ট নির্দেশিকা</h2>
            </div>
            <ul className={styles.list}>
              <li>পেমেন্টের <strong>ট্রানজেকশন আইডি (TxnID)</strong> সংরক্ষণ করুন — অর্ডার নিশ্চিত করতে এটি লাগবে।</li>
              <li>bKash / Nagad / UPAY: <strong>{PAYMENT_NUMBERS.bkash}</strong> | Rocket: <strong>{PAYMENT_NUMBERS.rocket}</strong> নম্বরে &quot;Send Money&quot; করুন।</li>
              <li>পেমেন্টের পর ওয়েবসাইটের অর্ডার কনফার্মেশন ধাপে TxnID প্রবেশ করান।</li>
              <li>SMS বা মৌখিক নিশ্চিতকরণ গ্রহণযোগ্য নয়।</li>
              <li>২৪ ঘণ্টার মধ্যে পেমেন্ট নিশ্চিত না হলে অর্ডারটি স্বয়ংক্রিয়ভাবে বাতিল হতে পারে।</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>3</span>
              <h2 className={styles.sectionTitle}>Order Verification Process</h2>
            </div>
            <ul className={styles.list}>
              <li>After payment, our system verifies your transaction ID within 5 minutes to 24 hours.</li>
              <li>Duplicate or invalid transaction IDs will put the order on hold.</li>
              <li>You can check your order status from your account page at any time.</li>
              <li>If verification takes longer than expected, contact us on WhatsApp for an update.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>অর্ডার যাচাই প্রক্রিয়া</h2>
            </div>
            <ul className={styles.list}>
              <li>পেমেন্টের পর আমাদের সিস্টেম ৫ মিনিট থেকে ২৪ ঘণ্টার মধ্যে ট্রানজেকশন যাচাই করে।</li>
              <li>ডুপ্লিকেট বা অবৈধ ট্রানজেকশন আইডি অর্ডারটিকে হোল্ডে রাখবে।</li>
              <li>যেকোনো সময় অ্যাকাউন্ট পেজ থেকে অর্ডারের স্ট্যাটাস দেখা যাবে।</li>
              <li>যাচাইয়ে বেশি সময় লাগলে WhatsApp-এ আপডেটের জন্য যোগাযোগ করুন।</li>
            </ul>
          </div>
        </div>

        {/* Section 4 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>4</span>
              <h2 className={styles.sectionTitle}>Order Cancellation Policy</h2>
            </div>
            <ul className={styles.list}>
              <li>Orders can be cancelled <strong>before payment is confirmed</strong>.</li>
              <li>Once payment is verified and the product delivered, the order <strong>cannot be cancelled</strong>.</li>
              <li>If you cancel before delivery but after payment, a refund will be issued within 3–10 business days.</li>
              <li>Repeated cancellations from the same account may result in order restrictions.</li>
              <li>For urgent cancellations, contact us on WhatsApp immediately after placing the order.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>অর্ডার বাতিল নীতি</h2>
            </div>
            <ul className={styles.list}>
              <li><strong>পেমেন্ট নিশ্চিত হওয়ার আগে</strong> অর্ডার বাতিল করা যাবে।</li>
              <li>পেমেন্ট যাচাই ও পণ্য ডেলিভারির পর অর্ডার <strong>বাতিল করা যাবে না।</strong></li>
              <li>ডেলিভারির আগে কিন্তু পেমেন্টের পরে বাতিল করলে ৩–১০ কার্যদিবসে রিফান্ড দেওয়া হবে।</li>
              <li>একই অ্যাকাউন্ট থেকে বারবার বাতিল করলে অর্ডারে বিধিনিষেধ আরোপ হতে পারে।</li>
              <li>জরুরি বাতিলের জন্য অর্ডার দেওয়ার সাথে সাথে WhatsApp-এ যোগাযোগ করুন।</li>
            </ul>
          </div>
        </div>

        {/* Section 5 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>5</span>
              <h2 className={styles.sectionTitle}>Important Notes</h2>
            </div>
            <ul className={styles.list}>
              <li>Always keep your order number — required for any support request.</li>
              <li>Check your spam/junk folder if you don&apos;t receive the delivery email within 30 minutes.</li>
              <li>Provide the correct email address at checkout — re-delivery to a wrong address is not guaranteed.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>গুরুত্বপূর্ণ তথ্য</h2>
            </div>
            <ul className={styles.list}>
              <li>অর্ডার নম্বর সংরক্ষণ করুন — যেকোনো সাপোর্ট অনুরোধে এটি লাগবে।</li>
              <li>৩০ মিনিটের মধ্যে ডেলিভারি ইমেইল না পেলে স্প্যাম/জাংক ফোল্ডার চেক করুন।</li>
              <li>চেকআউটে সঠিক ইমেইল দিন — ভুল ঠিকানায় পুনরায় ডেলিভারি নিশ্চিত নয়।</li>
            </ul>
          </div>
        </div>

        {/* Section 6 */}
        <div className={styles.bilingualRow}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>6</span>
              <h2 className={styles.sectionTitle}>Fraud Prevention</h2>
            </div>
            <ul className={styles.list}>
              <li>Submitting a fake payment screenshot to claim an order is a serious offence.</li>
              <li>Fraudulent accounts will be permanently banned and reported to relevant authorities.</li>
              <li>Each person may only place one active order per product at a time.</li>
            </ul>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeaderNoNum}>
              <h2>প্রতারণা প্রতিরোধ</h2>
            </div>
            <ul className={styles.list}>
              <li>অর্ডার দাবি করতে ভুয়া পেমেন্ট স্ক্রিনশট জমা দেওয়া গুরুতর অপরাধ।</li>
              <li>প্রতারণামূলক অ্যাকাউন্ট স্থায়ীভাবে বন্ধ করা হবে এবং সংশ্লিষ্ট কর্তৃপক্ষকে জানানো হবে।</li>
              <li>একই ব্যক্তি একটি পণ্যে একসাথে শুধুমাত্র একটি সক্রিয় অর্ডার করতে পারবেন।</li>
            </ul>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2>Need help with an order? / অর্ডার নিয়ে সাহায্য দরকার?</h2>
          <p>Our support team is available 24/7. / আমাদের সাপোর্ট টিম ২৪/৭ সক্রিয়।</p>
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

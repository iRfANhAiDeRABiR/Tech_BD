import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const shoppingBenefits = [
  {
    icon: "⚡",
    title: "Fast digital delivery",
    detail: "Receive your product details without shipping delays",
  },
  {
    icon: "✓",
    title: "Genuine products",
    detail: "Carefully sourced licenses and subscriptions",
  },
  {
    icon: "◇",
    title: "Secure purchase",
    detail: "Clear pricing with local payment options",
  },
  {
    icon: "☎",
    title: "Real human support",
    detail: "Friendly assistance before and after your order",
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <section
        className={styles.benefits}
        aria-label="Shopping benefits"
      >
        <div className={`container ${styles.benefitsGrid}`}>
          {shoppingBenefits.map((benefit) => (
            <div className={styles.benefit} key={benefit.title}>
              <span className={styles.benefitIcon} aria-hidden="true">
                {benefit.icon}
              </span>

              <span className={styles.benefitCopy}>
                <strong>{benefit.title}</strong>
                <span>{benefit.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className={`container ${styles.main}`}>
        <div className={styles.mainGrid}>
          <section className={styles.brandColumn}>
            <Link
              href="/home"
              className={styles.brand}
              aria-label="Tech Solutions BD home"
            >
              <span className={styles.logoFrame}>
                <Image
                  src="/img_content/tsb.png"
                  alt=""
                  width={52}
                  height={52}
                />
              </span>

              <span className={styles.brandName}>
                Tech Solutions
                <small>BD</small>
              </span>
            </Link>

            <p className={styles.brandDescription}>
              Genuine software licenses and subscriptions for people and
              businesses across Bangladesh, backed by fast digital delivery
              and dependable local support.
            </p>

            <div className={styles.trustNote}>
              <span className={styles.trustMark} aria-hidden="true">
                BD
              </span>

              <span>
                <strong>Bangladesh-based support</strong>
                <small>Buy with confidence from a local digital store</small>
              </span>
            </div>

            <div className={styles.socials} aria-label="Social channels">
              <a
                href="https://www.facebook.com/share/1F869SJntn/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.facebook}
                aria-label="Follow Tech Solutions BD on Facebook"
                title="Facebook"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              <a
                href="https://wa.me/message/7ZV3N6YFBF5ED1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsapp}
                aria-label="Chat with Tech Solutions BD on WhatsApp"
                title="WhatsApp"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </a>

              <a
                href="https://t.me/techsolutionsbd247"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.telegram}
                aria-label="Contact Tech Solutions BD on Telegram"
                title="Telegram"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                </svg>
              </a>
            </div>
          </section>

          <nav className={styles.linkColumn} aria-labelledby="footer-shop">
            <h2 id="footer-shop">Shop</h2>

            <ul className={styles.linkList}>
              <li>
                <Link href="/home?category=windows#products">
                  Windows licenses
                </Link>
              </li>
              <li>
                <Link href="/home?category=office#products">
                  Microsoft Office
                </Link>
              </li>
              <li>
                <Link href="/home?category=365#products">Microsoft 365</Link>
              </li>
              <li>
                <Link href="/home?category=adobe#products">Adobe products</Link>
              </li>
              <li>
                <Link href="/products#products-by-category">View all products</Link>
              </li>
            </ul>
          </nav>

          <nav className={styles.linkColumn} aria-labelledby="footer-help">
            <h2 id="footer-help">Customer care</h2>

            <ul className={styles.linkList}>
              <li>
                <Link href="/downloads">Software Download</Link>
              </li>
              <li>
                <Link href="/cart">Shopping cart</Link>
              </li>
              <li>
                <Link href="/tools">Useful tools</Link>
              </li>
              <li>
                <Link href="/home#features">Why shop with us</Link>
              </li>
              <li>
                <a href="mailto:info@techsolutions.bd">Email support</a>
              </li>
              <li>
                <a href="tel:+8809697399879">Call support</a>
              </li>
            </ul>
          </nav>

          <nav className={styles.linkColumn} aria-labelledby="footer-policies">
            <h2 id="footer-policies">Policies</h2>

            <ul className={styles.linkList}>
              <li>
                <Link href="/policies/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/policies/terms-and-conditions">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link href="/policies/refund-policy">Refund &amp; Return Policy</Link>
              </li>
              <li>
                <Link href="/policies/order-and-cancellation">Order &amp; Cancellation</Link>
              </li>
              <li>
                <Link href="/policies/delivery-info">Delivery Info</Link>
              </li>
              <li>
                <Link href="/policies/refund-request">Refund Request</Link>
              </li>
            </ul>
          </nav>

          <section className={styles.supportCard}>
            <span className={styles.supportEyebrow}>Need a hand?</span>
            <h2>We’ll help you choose the right product.</h2>
            <p>
              Talk to our team for product guidance, activation help, or an
              update on your digital order.
            </p>

            <a
              href="https://wa.me/message/7ZV3N6YFBF5ED1"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsAppButton}
            >
              Chat on WhatsApp
              <span aria-hidden="true">→</span>
            </a>

            <div className={styles.supportDetails}>
              <a href="tel:+8809697399879">+880 9697399879</a>
              <a href="mailto:info@techsolutions.bd">
                info@techsolutions.bd
              </a>
              <span>Dhaka, Bangladesh</span>
            </div>
          </section>
        </div>

        <div className={styles.paymentRow}>
          <div className={styles.paymentCopy}>
            <span className={styles.paymentLabel}>Payment options</span>
            <span>Convenient local and card payments</span>
          </div>

          <div className={styles.paymentMethods} aria-label="Payment methods">
            <span className={`${styles.paymentChip} ${styles.visaChip}`} title="Visa">
              <svg
                className={styles.visaLogo}
                viewBox="0 0 48 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Visa"
              >
                <path
                  d="M19.467 1.156L13.111 15.244H8.978L5.422 3.867C5.2 2.978 4.978 2.667 4.267 2.267C3.156 1.644 1.511 1.067 0 0.711L0.089 0.311H7.022C7.911 0.311 8.667 0.933 8.844 1.956L10.533 10.978L14.711 0.311H19.467V1.156ZM36.578 10.578C36.622 6.578 30.933 6.356 31.022 4.622C31.067 4.089 31.556 3.511 32.711 3.378C33.289 3.289 34.889 3.244 36.622 4.044L37.289 0.978C36.356 0.622 35.156 0.311 33.644 0.311C29.467 0.311 26.533 2.533 26.489 5.689C26.444 8.044 28.578 9.333 30.222 10.133C31.867 10.933 32.444 11.467 32.444 12.178C32.444 13.289 31.111 13.778 29.867 13.778C27.778 13.778 26.578 13.156 25.644 12.711L24.978 15.867C25.956 16.311 27.733 16.711 29.6 16.711C34.044 16.711 36.533 14.533 36.578 10.578ZM47.467 15.244H51.2L47.911 0.311H44.444C43.644 0.311 42.978 0.756 42.667 1.467L36.444 15.244H40.578L41.422 12.933H46.489L47.467 15.244ZM42.533 9.911L44.622 4.178L45.822 9.911H42.533ZM25.422 0.311L22.178 15.244H18.267L21.511 0.311H25.422Z"
                  fill="#1434CB"
                />
              </svg>
            </span>

            <span className={`${styles.paymentChip} ${styles.mastercardChip}`} title="Mastercard">
              <svg
                className={styles.mastercardCircles}
                viewBox="0 0 32 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Mastercard"
              >
                <circle cx="10" cy="10" r="9" fill="#EB001B" />
                <circle cx="22" cy="10" r="9" fill="#F79E1B" />
                <path
                  d="M16 3.65a8.96 8.96 0 0 0-3.4 6.35 8.96 8.96 0 0 0 3.4 6.35 8.96 8.96 0 0 0 3.4-6.35 8.96 8.96 0 0 0-3.4-6.35Z"
                  fill="#FF5F00"
                />
              </svg>
              <span className={styles.brandTextMastercard}>mastercard</span>
            </span>

            <span className={`${styles.paymentChip} ${styles.bkashChip}`} title="bKash">
              <svg
                className={styles.bkashBird}
                viewBox="240 8 235 215"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="bKash"
              >
                <path d="M327.99 110.75l12.99 58.4 85.01-43.04z" fill="#D12053" />
                <path d="M352.16 23.48L328 110.76l98.01 15.35z" fill="#E2136E" />
                <path d="M248.31 10.7l101.38 12.11-23.97 86.76z" fill="#D12053" />
                <path d="M247.52 27.76h11.29l31.67 40.5z" fill="#9E1638" />
                <path d="M428.69 125.55l-29.46-40.77 47.66-8.53z" fill="#D12053" />
                <path d="M423.77 137.5l3.04-9.07-74.39 37.74z" fill="#E2136E" />
                <path d="M325.91 113.05l15.52 69.77-46.06 37.46z" fill="#9E1638" />
                <path d="M442.25 96.97l27.05-.46-19.55-19.89z" fill="#E2136E" />
              </svg>
              <span className={styles.brandTextBkash}>bKash</span>
            </span>

            <span className={`${styles.paymentChip} ${styles.nagadChip}`} title="Nagad">
              <svg
                className={styles.nagadIcon}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Nagad"
              >
                <circle cx="20" cy="20" r="18" fill="#F7941D" />
                <path
                  d="M20 5C11.716 5 5 11.716 5 20C5 28.284 11.716 35 20 35C28.284 35 35 28.284 35 20"
                  stroke="#ED1C24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M20 12C15.582 12 12 15.582 12 20C12 24.418 15.582 28 20 28"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="23" cy="18" r="2.8" fill="#FFFFFF" />
                <path d="M20 20L27 27" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className={styles.brandTextNagad}>Nagad</span>
            </span>

            <span className={`${styles.paymentChip} ${styles.rocketChip}`} title="Rocket">
              <svg
                className={styles.rocketIcon}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Rocket"
              >
                <path d="M4 28L23 8L36 5L32 17L12 36L15 25L4 28Z" fill="#8C3494" />
                <path d="M23 8L18 22L32 17L23 8Z" fill="#6A1B7B" />
                <path d="M18 22L12 36L15 25L18 22Z" fill="#AB47BC" />
                <circle cx="28" cy="12" r="2" fill="#FFFFFF" />
              </svg>
              <span className={styles.brandTextRocket}>Rocket</span>
            </span>
          </div>

        </div>

        <div className={styles.bottomBar}>
          <p>
            © {new Date().getFullYear()} Tech Solutions BD. All rights
            reserved.
          </p>

          <p>
            Product names, logos, and brands belong to their respective
            owners.
          </p>
        </div>
      </div>
    </footer>
  );
}

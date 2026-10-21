import Link from "next/link";
import { loginAction } from "../actions";
import styles from "../admin.module.css";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className={styles.login}>
      <div className="auth-modal-container" style={{ maxHeight: "none" }}>
        <Link href="/home" className="auth-modal-close" aria-label="Back to Store">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>

        <div className="auth-modal-header">
          <div className="auth-brand-card">
            <div className="auth-brand-logo-box">
              <img
                src="/img_content/tsb.png"
                alt="Tech Solutions BD"
                width={38}
                height={38}
              />
            </div>
            <div className="auth-brand-text">
              <div className="auth-brand-name">
                <span className="auth-brand-name--white">Tech Solutions</span>{" "}
                <span className="auth-brand-name--blue">BD</span>
              </div>
            </div>
          </div>

          <h1 className="auth-modal-title">অ্যাডমিন লগইন</h1>
          <p className="auth-modal-subtitle">
            Tech Solutions BD ড্যাশবোর্ডে প্রবেশ করুন
          </p>
        </div>

        {query.error && (
          <div className="auth-alert auth-alert--error">
            ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।
          </div>
        )}

        <div className="auth-modal-body">
          <form action={loginAction} className="auth-form">
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <polyline points="3 7 12 13 21 7" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="অ্যাডমিন ইমেইল অ্যাড্রেস"
                required
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="পাসওয়ার্ড"
                minLength={8}
                required
              />
            </div>

            <button className="auth-submit-btn" type="submit" style={{ marginTop: 8 }}>
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>লগইন করুন</span>
            </button>
          </form>

          <div className="auth-trust-footer">
            <div className="auth-trust-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>SSL সুরক্ষিত</span>
            </div>
            <div className="auth-trust-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span>এনক্রিপ্টেড</span>
            </div>
            <div className="auth-trust-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>দ্রুত লগইন</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
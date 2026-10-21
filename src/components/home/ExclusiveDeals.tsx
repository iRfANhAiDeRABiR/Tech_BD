"use client";

import { FormEvent, useState } from "react";

export function ExclusiveDeals() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string };
      setMessage(
        data.message ??
          (response.ok
            ? "🎉 Subscribed! Check your email for your 10% off code."
            : "Could not complete your subscription. Please try again."),
      );
      if (response.ok) setEmail("");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="cta-section" aria-labelledby="exclusive-deals-title">
      <div className="container">
        <div className="cta-card">
          <div className="cta-card__content">
            <h2 id="exclusive-deals-title">
              Get <span className="gradient-text">Exclusive Deals</span>
            </h2>

            <p>
              Subscribe to our newsletter and get 10% off your first order plus
              weekly deals.
            </p>

            <form className="cta-form" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                aria-label="Email address"
                required
              />

              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Subscribing..." : "Subscribe"}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  focusable="false"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>

            {message ? (
              <p role="status" aria-live="polite" className="cta-form__message">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
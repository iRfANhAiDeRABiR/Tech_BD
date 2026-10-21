"use client";

import { FormEvent, useState } from "react";
import { notify } from "@/lib/toast";

const contactItems = [
  {
    title: "Address",
    value: "Dhaka, Bangladesh",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    shadow: "rgba(99, 102, 241, 0.35)",
    icon: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  {
    title: "Phone",
    value: "+880 9697399879",
    href: "tel:+8809697399879",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    shadow: "rgba(16, 185, 129, 0.35)",
    icon: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
  },
  {
    title: "Email",
    value: "info@techsolutions.bd",
    href: "mailto:info@techsolutions.bd",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
    shadow: "rgba(245, 158, 11, 0.35)",
    icon: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>
    ),
  },
];

const socialLinks = [
  {
    label: "Facebook",
    id: "facebook",
    href: "https://www.facebook.com/share/1F869SJntn/",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
  {
    label: "WhatsApp",
    id: "whatsapp",
    href: "https://wa.me/message/7ZV3N6YFBF5ED1",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z",
  },
  {
    label: "Telegram",
    id: "telegram",
    href: "https://t.me/techsolutionsbd247",
    path: "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z",
  },
];

export function ContactUs() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const msg = "Thanks! Your message has been received. We will get back to you soon.";
    setMessage("✅ Thanks! Your message has been received.");
    notify.success("Message sent", {
      description: msg,
      id: "contact-toast",
    });
    event.currentTarget.reset();
  }

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Get in Touch</span>

          <h2 className="section-title" id="contact-title">
            Contact <span className="gradient-text">Us</span>
          </h2>

          <p className="section-desc">Have questions? We&apos;re here to help!</p>
        </div>

        <div className="contact__grid">
          <div className="contact__info">
            {contactItems.map((item) => (
              <div className="contact-item" key={item.title}>
                <div
                  className="contact-item__icon"
                  style={{
                    background: item.gradient,
                    boxShadow: `0 6px 16px ${item.shadow}, inset 0 1px 1px rgba(255, 255, 255, 0.35)`,
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    {item.icon}
                  </svg>
                </div>

                <div>
                  <h4>{item.title}</h4>
                  <p>
                    {item.href ? <a href={item.href}>{item.value}</a> : item.value}
                  </p>
                </div>
              </div>
            ))}

            <div className="contact-socials" aria-label="Social channels">
              {socialLinks.map((link) => (
                <a
                  href={link.href}
                  className={`social-link social-link--${link.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  key={link.label}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d={link.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <form className="contact__form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                aria-label="Your name"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                aria-label="Your email"
                required
              />
            </div>

            <div className="form-group">
              <select name="subject" aria-label="Select subject" defaultValue="" required>
                <option value="" disabled>
                  Select Subject
                </option>
                <option value="order">Order Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="bulk">Bulk Order</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <textarea
                name="message"
                placeholder="Your Message"
                rows={4}
                aria-label="Your message"
                required
              />
            </div>

            <button type="submit" className="btn btn--primary btn--full">
              Send Message
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
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>

            {message ? (
              <p role="status" aria-live="polite" className="contact__message">
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Send, ChevronRight, PhoneCall, MessageCircle } from "lucide-react";
import styles from "./WhatsAppWidget.module.css";

const WA_BASE_URL = "https://wa.me/message/7ZV3N6YFBF5ED1";

const QUICK_TOPICS = [
  {
    label: "💻 Windows 11 Retail vs OEM Help",
    text: "Hello Tech Solutions BD, I need advice choosing between Windows 11 Retail vs OEM key.",
  },
  {
    label: "🏢 Office 2024 / 365 Activation Inquiry",
    text: "Hello Tech Solutions BD, I have an inquiry about Microsoft Office 2024 / 365 licensing.",
  },
  {
    label: "💳 bKash / Nagad Payment Verification",
    text: "Hello Tech Solutions BD, I need assistance verifying my bKash / Nagad payment for my order.",
  },
  {
    label: "⚡ IDM / Antivirus Lifetime License",
    text: "Hello Tech Solutions BD, I want to inquire about genuine IDM / Antivirus lifetime licenses.",
  },
];

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [customMsg, setCustomMsg] = useState("");
  const [activeFormat, setActiveFormat] = useState(0); // 0: WhatsApp, 1: Contact us, 2: Chat dots
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-switch between the 3 formats
  useEffect(() => {
    if (isOpen || isHovered) return;
    const interval = setInterval(() => {
      setActiveFormat((prev) => (prev + 1) % 3);
    }, 3200);
    return () => clearInterval(interval);
  }, [isOpen, isHovered]);

  // Auto-hide tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Focus input when opened & listen for Escape key
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const openWhatsApp = (msgText: string) => {
    const clean = msgText.trim();
    const url = clean
      ? `${WA_BASE_URL}?text=${encodeURIComponent(clean)}`
      : WA_BASE_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) {
      openWhatsApp("Hello Tech Solutions BD, I need assistance with genuine software licensing.");
    } else {
      openWhatsApp(customMsg);
    }
    setCustomMsg("");
  };

  return (
    <div className={styles.widgetContainer}>
      {/* 1. Chat Popup Window */}
      {isOpen && (
        <div className={styles.chatCard} role="dialog" aria-modal="true" aria-label="WhatsApp live chat">
          {/* Header */}
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.avatarWrap}>
                <Image
                  src="/img_content/tsb.png"
                  alt="Tech Solutions BD"
                  width={36}
                  height={36}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div>
                <h3 className={styles.headerTitle}>Tech Solutions BD</h3>
                <div className={styles.headerSubtitle}>
                  <span className={styles.statusDot} />
                  <span>Online | Replies in ~5 min</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={styles.closeHeaderBtn}
              aria-label="Close chat"
              title="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Body */}
          <div className={styles.cardBody}>
            <div className={styles.chatBubble}>
              <div>
                Hello! 👋 Welcome to <strong>Tech Solutions BD</strong>.
              </div>
              <div style={{ marginTop: 4 }}>
                How can we help you get 100% genuine software licenses today? Choose a topic below or write to us directly!
              </div>
              <div className={styles.timeLabel}>Just now</div>
            </div>

            {/* Quick Topic Prompts */}
            <div className={styles.quickPromptLabel}>Quick assistance topics:</div>
            <div className={styles.chipsGrid}>
              {QUICK_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openWhatsApp(topic.text)}
                  className={styles.chipBtn}
                >
                  <span>{topic.label}</span>
                  <ChevronRight size={14} style={{ opacity: 0.7 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Input & Send Footer */}
          <div className={styles.cardFooter}>
            <form onSubmit={handleSendCustom} className={styles.inputForm}>
              <input
                ref={inputRef}
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Write your message..."
                className={styles.msgInput}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                aria-label="Send WhatsApp message"
                title="Send to WhatsApp"
              >
                <Send size={16} />
              </button>
            </form>

            <div className={styles.helplineNote}>
              <PhoneCall size={11} />
              <span>Or call helpline: </span>
              <a href="tel:+8809697399879" className={styles.helplineLink}>
                +880 9697-399879
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tooltip Pill (before opening) */}
      {!isOpen && showTooltip && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={styles.tooltipBadge}
          title="Click to chat on WhatsApp"
        >
          <span style={{ color: "#22c55e" }}>●</span>
          <span>Need help? Chat with us!</span>
        </button>
      )}

      {/* 3. Floating WhatsApp Circular Trigger Button (Animates switching 3 formats) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={styles.triggerBtn}
        aria-label={
          isOpen
            ? "Close WhatsApp chat"
            : activeFormat === 1
            ? "Contact us on WhatsApp"
            : "Chat on WhatsApp with Tech Solutions BD"
        }
        title="Chat on WhatsApp with Tech Solutions BD"
      >
        {!isOpen && <span className={styles.pulseWave} aria-hidden="true" />}
        <span className={styles.onlineBadge} aria-hidden="true" />

        {isOpen ? (
          <div className={styles.closeIconWrapper}>
            <X size={26} strokeWidth={2.4} />
          </div>
        ) : (
          <div className={styles.formatContainer}>
            {/* Format 1: WhatsApp icon inside white circular disc */}
            <div
              className={`${styles.formatItem} ${
                activeFormat === 0 ? styles.active : ""
              }`}
            >
              <div className={styles.whiteDisc}>
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={styles.whatsappIcon}
                  aria-hidden="true"
                >
                  <path d="M12.04 2a9.84 9.84 0 0 0-8.45 14.9L2 22l5.22-1.54A9.96 9.96 0 1 0 12.04 2Zm0 17.93a8.06 8.06 0 0 1-4.1-1.12l-.29-.17-3.1.91.94-3.02-.19-.31a7.87 7.87 0 1 1 6.74 3.71Zm4.43-5.9c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.62.79-.77.95-.14.16-.28.18-.52.06-1.43-.71-2.37-1.27-3.32-2.89-.25-.43.25-.4.71-1.32.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.65.3-.22.24-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.72 2.62 4.16 3.67.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
                </svg>
              </div>
            </div>

            {/* Format 2: Contact us with double chat bubbles */}
            <div
              className={`${styles.formatItem} ${
                activeFormat === 1 ? styles.active : ""
              }`}
            >
              <div className={styles.contactUsStack}>
                <svg
                  width="23"
                  height="19"
                  viewBox="0 0 24 20"
                  fill="none"
                  className={styles.contactBubblesIcon}
                  aria-hidden="true"
                >
                  {/* Back outlined bubble */}
                  <path
                    d="M8.5 2.5h11a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-2l-2.5 2.5v-2.5h-6.5a2 2 0 0 1-2-2v-1"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Front solid filled bubble */}
                  <path
                    d="M2.5 4.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6l-3.5 3v-3H2.5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
                    fill="#ffffff"
                  />
                </svg>
                <span className={styles.contactUsText}>Contact us</span>
              </div>
            </div>

            {/* Format 3: Chat bubble with 3 typing dots inside white circular disc */}
            <div
              className={`${styles.formatItem} ${
                activeFormat === 2 ? styles.active : ""
              }`}
            >
              <div className={styles.whiteDisc}>
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#075E54"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.chatDotsIcon}
                  aria-hidden="true"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  <circle
                    cx="8"
                    cy="11.5"
                    r="1.15"
                    fill="#075E54"
                    stroke="none"
                    className={styles.dot1}
                  />
                  <circle
                    cx="12"
                    cy="11.5"
                    r="1.15"
                    fill="#075E54"
                    stroke="none"
                    className={styles.dot2}
                  />
                  <circle
                    cx="16"
                    cy="11.5"
                    r="1.15"
                    fill="#075E54"
                    stroke="none"
                    className={styles.dot3}
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}


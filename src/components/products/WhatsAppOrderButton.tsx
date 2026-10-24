"use client";

import styles from "./WhatsAppOrderButton.module.css";

interface WhatsAppOrderButtonProps {
  productId: string;
  productName: string;
  price: number;
  selectedOptionName?: string;
  variant?: "default" | "compact" | "iconOnly";
  className?: string;
}

export function WhatsAppOrderButton({
  productId,
  productName,
  price,
  selectedOptionName,
  variant = "default",
  className = "",
}: WhatsAppOrderButtonProps) {
  const WA_BASE_URL = "https://wa.me/message/7ZV3N6YFBF5ED1";
  
  const optionText = selectedOptionName ? ` (${selectedOptionName})` : "";
  const message = `Hi Tech Solutions BD! I would like to order:
📦 Product: ${productName}${optionText}
💰 Price: ৳${price}
🆔 Product ID: ${productId}

Please guide me on how to complete the payment and receive delivery.`;

  const waUrl = `${WA_BASE_URL}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.whatsappOrderBtn} ${
        variant === "compact"
          ? styles.compact
          : variant === "iconOnly"
          ? styles.iconOnly
          : ""
      } ${className}`}
      aria-label={`Order ${productName} directly via WhatsApp`}
      title="Order directly via WhatsApp"
    >
      <svg
        className={styles.whatsappIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2a9.84 9.84 0 0 0-8.45 14.9L2 22l5.22-1.54A9.96 9.96 0 1 0 12.04 2Zm0 17.93a8.06 8.06 0 0 1-4.1-1.12l-.29-.17-3.1.91.94-3.02-.19-.31a7.87 7.87 0 1 1 6.74 3.71Zm4.43-5.9c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.62.79-.77.95-.14.16-.28.18-.52.06-1.43-.71-2.37-1.27-3.32-2.89-.25-.43.25-.4.71-1.32.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.65.3-.22.24-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.72 2.62 4.16 3.67.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
      </svg>
      {variant !== "iconOnly" && <span>Order via WhatsApp</span>}
    </a>
  );
}


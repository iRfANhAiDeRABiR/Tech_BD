/**
 * Centralized payment numbers configuration.
 * Reads payment numbers from environment variables with safe fallbacks.
 *
 * Environment variables:
 * - NEXT_PUBLIC_BKASH_NUMBER (default: "01641699879")
 * - NEXT_PUBLIC_NAGAD_NUMBER (default: "01641699879")
 * - NEXT_PUBLIC_ROCKET_NUMBER (default: "015189028225")
 * - NEXT_PUBLIC_UPAY_NUMBER (default: "01641699879")
 */

export const PAYMENT_NUMBERS = {
  bkash: process.env.NEXT_PUBLIC_BKASH_NUMBER || "01641699879",
  nagad: process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01641699879",
  rocket: process.env.NEXT_PUBLIC_ROCKET_NUMBER || "015189028225",
  upay: process.env.NEXT_PUBLIC_UPAY_NUMBER || "01641699879",
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_NUMBERS;

export function getPaymentNumber(method: string): string {
  const key = method.toLowerCase() as PaymentMethodKey;
  return PAYMENT_NUMBERS[key] || PAYMENT_NUMBERS.bkash;
}

export interface PaymentInstructions {
  app: string[];
  ussd: string[];
}

export function getPaymentInstructions(
  method: "bkash" | "nagad" | "rocket",
  customNumber?: string,
): PaymentInstructions {
  const receiver = customNumber || getPaymentNumber(method);

  if (method === "bkash") {
    return {
      app: [
        "Open your bKash App and tap Send Money.",
        `Enter recipient number: ${receiver}`,
        "Enter the exact payable amount.",
        "Enter your PIN to complete the transfer.",
        "Copy the Transaction ID (TrxID) and enter it below.",
      ],
      ussd: [
        "Dial *247# on your mobile handset.",
        "Select Option 1: Send Money.",
        `Enter receiver number: ${receiver}`,
        "Enter the exact payable amount.",
        "Enter your bKash PIN to confirm payment.",
        "Enter the TrxID received in SMS below.",
      ],
    };
  }

  if (method === "nagad") {
    return {
      app: [
        "Open your Nagad App and tap Send Money.",
        `Enter recipient number: ${receiver}`,
        "Enter the exact payable amount.",
        "Enter your Nagad PIN to complete the transfer.",
        "Copy the Transaction ID (TrxID) and enter it below.",
      ],
      ussd: [
        "Dial *167# on your mobile handset.",
        "Select Option 1: Send Money.",
        `Enter receiver number: ${receiver}`,
        "Enter the exact payable amount.",
        "Enter your Nagad PIN to confirm payment.",
        "Enter the TrxID received in SMS below.",
      ],
    };
  }

  return {
    app: [
      "Open your Rocket App and select Send Money.",
      `Enter recipient number: ${receiver}`,
      "Enter the exact payable amount.",
      "Enter your Rocket PIN to complete the transfer.",
      "Copy the Transaction ID (TrxID) and enter it below.",
    ],
    ussd: [
      "Dial *322# on your mobile handset.",
      "Select Option 1: Send Money.",
      `Enter receiver number: ${receiver}`,
      "Enter the exact payable amount.",
      "Enter your Rocket PIN to confirm payment.",
      "Enter the TrxID received in SMS below.",
    ],
  };
}


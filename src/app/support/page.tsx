import { SupportTicketsBox } from "@/components/support/SupportTicketsBox";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Tickets & Help Desk | Tech Solutions BD",
  description:
    "Open a support ticket, report an issue, or get quick help with genuine Windows, Office, and antivirus digital licenses.",
};

export default function SupportPage() {
  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "36px 16px 64px",
      }}
    >
      <SupportTicketsBox />
    </div>
  );
}


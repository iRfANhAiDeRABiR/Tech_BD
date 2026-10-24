"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  ShieldCheck,
  ChevronRight,
  X,
  Target,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Info,
  UserCheck,
  Lock,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from "@/types/support-ticket";
import {
  getStoredTickets,
  createStoredTicket,
  addMessageToTicket,
  updateTicketStatus,
  formatRelativeTime,
  getClientDiagnosticDetails,
} from "@/lib/support-ticket-storage";
import styles from "./SupportTicketsBox.module.css";

interface SupportTicketsBoxProps {
  initialUserEmail?: string;
  initialUserName?: string;
  initialUserPhone?: string;
  embedded?: boolean;
}

const CATEGORIES: TicketCategory[] = [
  "License Key Activation",
  "Software Download",
  "Payment & Verification",
  "Bug",
  "General Inquiry",
  "Feedback",
];

const PRIORITIES: TicketPriority[] = ["Low", "Normal", "High", "Urgent"];

export function SupportTicketsBox({
  initialUserEmail = "",
  initialUserName = "",
  initialUserPhone = "",
  embedded = false,
}: SupportTicketsBoxProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<"All" | "Active" | "Closed">("All");

  // User auth state
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialUserEmail));
  const [customerName, setCustomerName] = useState(initialUserName);
  const [customerPhone, setCustomerPhone] = useState(initialUserPhone);
  const [customerEmail, setCustomerEmail] = useState(initialUserEmail);

  // Open modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("License Key Activation");
  const [priority, setPriority] = useState<TicketPriority>("Normal");
  const [orderNumber, setOrderNumber] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thread reply states
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Open login/signup modal
  const handleOpenAuth = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("techbd:open-auth-modal", { detail: { mode: "login" } })
      );
    }
  };

  // Open ticket click handler (requires auth)
  const handleOpenTicketClick = () => {
    if (!isLoggedIn) {
      notify.info("Please sign in or create an account to open support tickets.");
      handleOpenAuth();
      return;
    }
    setIsCreateOpen(true);
  };

  // Fetch tickets for a specific email
  const syncServerTickets = (email: string) => {
    if (!email) return;
    fetch(`/api/support/tickets?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.tickets && Array.isArray(data.tickets)) {
          const local = getStoredTickets();
          const map = new Map<string, SupportTicket>();
          local.forEach((t) => map.set(t.id, t));
          data.tickets.forEach((t: SupportTicket) => map.set(t.id, t));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setTickets(merged);
        }
      })
      .catch(() => {});
  };

  // Check auth session and fetch tickets
  useEffect(() => {
    // 1. Load locally stored tickets
    const local = getStoredTickets();
    setTickets(local);
    setIsLoaded(true);

    // 2. Check if logged in via Supabase
    const supabase = createClient();
    supabase.auth.getUser().then(async (res: any) => {
      const user = res?.data?.user;
      if (user) {
        setIsLoggedIn(true);
        const email = user.email || "";
        setCustomerEmail((prev) => prev || email);

        // Fetch profile details
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username, phone_e164, whatsapp_e164")
            .eq("id", user.id)
            .single();

          if (profile) {
            const name = profile.full_name || profile.username || email.split("@")[0] || "Customer";
            const phone = profile.phone_e164 || profile.whatsapp_e164 || "";
            setCustomerName((prev) => prev || name);
            setCustomerPhone((prev) => prev || phone);
          }
        } catch {
          // ignore
        }

        syncServerTickets(email);
      }
    });

    // 3. Listen to auth state changes (if user logs in while on this page)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          setIsLoggedIn(true);
          const email = session.user.email || "";
          setCustomerEmail(email);
          syncServerTickets(email);
        } else {
          setIsLoggedIn(false);
        }
      }
    );

    // 4. Check query param ?create=true
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("create") === "true") {
        if (initialUserEmail) {
          setIsCreateOpen(true);
        }
      }
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [initialUserEmail]);

  // Compute live stats
  const totalCount = tickets.length;
  const activeCount = tickets.filter(
    (t) => t.status === "Open" || t.status === "In Progress"
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed"
  ).length;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (filter === "Active") return t.status === "Open" || t.status === "In Progress";
    if (filter === "Closed") return t.status === "Resolved" || t.status === "Closed";
    return true;
  });

  // Handle creating a new ticket
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      handleOpenAuth();
      return;
    }

    if (!subject.trim() || !description.trim()) {
      notify.error("Please fill in subject and description");
      return;
    }

    setIsSubmitting(true);
    const diagInfo = getClientDiagnosticDetails();

    try {
      // 1. Create locally for instant UI update
      const newTicket = createStoredTicket({
        subject: subject.trim(),
        category,
        priority,
        orderNumber: orderNumber.trim() || undefined,
        customerName: customerName.trim() || "Customer",
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || "guest@techsolutionsbd.com",
        description: description.trim(),
        deviceInfo: diagInfo,
      });

      setTickets(getStoredTickets());

      // 2. Post to server store (persists to Database and fires real-time Telegram alert)
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketCode: newTicket.ticketCode,
          category: newTicket.category,
          priority: newTicket.priority,
          subject: newTicket.subject,
          description: description.trim(),
          customerName: newTicket.customerName,
          customerPhone: newTicket.customerPhone,
          customerEmail: newTicket.customerEmail,
          orderNumber: orderNumber.trim() || undefined,
          deviceInfo: diagInfo,
        }),
      });

      notify.success(`Ticket #${newTicket.ticketCode} Opened!`, {
        description: "Our support engineering team will answer in-thread shortly.",
      });

      // Reset form
      setSubject("");
      setDescription("");
      setOrderNumber("");
      setIsCreateOpen(false);
      setActiveTicket(newTicket);
    } catch {
      notify.error("Failed to open ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle in-thread reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    const text = replyText.trim();

    try {
      // 1. Update locally
      const updated = addMessageToTicket(
        activeTicket.id,
        text,
        "customer",
        customerName.trim() || "Customer"
      );

      if (updated) {
        setActiveTicket(updated);
        setTickets(getStoredTickets());
        setReplyText("");
      }

      // 2. Post to server API (notifies admin on Telegram)
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          ticketId: activeTicket.id,
          message: text,
          sender: "customer",
          senderName: customerName.trim() || "Customer",
          subject: activeTicket.subject,
        }),
      });

      notify.success("Reply added to thread");
    } catch {
      notify.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ── 1. Top Header Card ── */}
      <div className={styles.topCard}>
        <div className={styles.topCardMain}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <LifeBuoy size={26} strokeWidth={2.2} />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Support tickets</h1>
              <p className={styles.subtitle}>
                Report a bug, share feedback, or get help. We attach your
                connection and app details so we can debug faster.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.openTicketBtn}
            onClick={handleOpenTicketClick}
            title={isLoggedIn ? "Open a new support ticket" : "Sign in to open a support ticket"}
          >
            {isLoggedIn ? (
              <>
                <Plus size={16} strokeWidth={2.5} />
                <span>Open ticket</span>
              </>
            ) : (
              <>
                <Lock size={15} />
                <span>Sign in to Open Ticket</span>
              </>
            )}
          </button>
        </div>

        {/* ── Stats Bar ── */}
        <div className={styles.statsBar}>
          <div className={styles.statCol}>
            <div className={styles.statIconWrap}>
              <MessageSquare size={17} color="#94a3b8" />
            </div>
            <div>
              <div className={styles.statNum}>{isLoaded ? totalCount : 0}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
          </div>

          <div className={styles.statCol}>
            <div className={styles.statIconWrap}>
              <Clock size={17} color="#f59e0b" />
            </div>
            <div>
              <div className={styles.statNum}>{isLoaded ? activeCount : 0}</div>
              <div className={styles.statLabel}>Active</div>
            </div>
          </div>

          <div className={styles.statCol}>
            <div className={styles.statIconWrap}>
              <ShieldCheck size={18} color="#10b981" />
            </div>
            <div>
              <div className={styles.statNum}>{isLoaded ? resolvedCount : 0}</div>
              <div className={styles.statLabel}>Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Your Tickets Section ── */}
      <div className={styles.ticketsSection}>
        <div className={styles.ticketsHeader}>
          <h2 className={styles.sectionHeading}>Your tickets</h2>
          {isLoggedIn && (
            <div className={styles.filterTabs}>
              {(["All", "Active", "Closed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`${styles.filterTab} ${
                    filter === tab ? styles.filterTabActive : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.ticketList}>
          {!isLoggedIn ? (
            /* Auth Gate Card when customer is not signed in */
            <div className={styles.authGateCard}>
              <div className={styles.authGateIcon}>
                <Lock size={24} />
              </div>
              <h3 className={styles.authGateTitle}>Sign In to Access Your Support History</h3>
              <p className={styles.authGateDesc}>
                To open new support tickets, communicate with our engineering team in-thread, and track resolution history, please sign in or register with your account.
              </p>
              <button
                type="button"
                className={styles.authGateBtn}
                onClick={handleOpenAuth}
              >
                <LogIn size={16} />
                <span>Sign In / Sign Up to Continue</span>
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                No {filter !== "All" ? filter.toLowerCase() : ""} support tickets found.
              </p>
              <button
                type="button"
                className={styles.openTicketBtn}
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={15} />
                <span>Open ticket</span>
              </button>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={styles.ticketCard}
                onClick={() => setActiveTicket(ticket)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTicket(ticket);
                  }
                }}
              >
                <div className={styles.ticketLeft}>
                  <div className={styles.ticketTitleRow}>
                    <span className={styles.ticketSubject}>
                      {ticket.subject}
                    </span>
                    <span className={styles.ticketCode}>
                      #{ticket.ticketCode}
                    </span>
                  </div>

                  <div className={styles.ticketTagsRow}>
                    {/* Status Pill */}
                    <span
                      className={`${styles.tagPill} ${
                        ticket.status === "Closed" || ticket.status === "Resolved"
                          ? styles.statusClosed
                          : ticket.status === "In Progress"
                          ? styles.statusInProgress
                          : styles.statusOpen
                      }`}
                    >
                      {ticket.status}
                    </span>

                    {/* Priority Pill */}
                    <span
                      className={`${styles.tagPill} ${
                        ticket.priority === "Urgent" || ticket.priority === "High"
                          ? styles.priorityUrgent
                          : styles.priorityPill
                      }`}
                    >
                      {ticket.priority}
                    </span>

                    {/* Category Pill */}
                    <span className={`${styles.tagPill} ${styles.categoryPill}`}>
                      {ticket.category}
                    </span>
                  </div>
                </div>

                <div className={styles.ticketRight}>
                  <span className={styles.messageCount} title="Replies count">
                    <MessageSquare size={13} />
                    <span>{ticket.messages.length}</span>
                  </span>
                  <span className={styles.timeAgo}>
                    {formatRelativeTime(ticket.createdAt)}
                  </span>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 3. How Support Works Card ── */}
      <div className={styles.howItWorksCard}>
        <h3 className={styles.howTitle}>How support works</h3>

        <div className={styles.stepsGrid}>
          {/* Step 1 */}
          <div className={styles.stepItem}>
            <div className={styles.stepIconWrap}>
              <Target size={20} strokeWidth={2.2} />
            </div>
            <div className={styles.stepText}>
              <h4 className={styles.stepHeading}>Describe the issue</h4>
              <p className={styles.stepDesc}>
                Pick a category and tell us what happened — the more detail, the
                faster we can help.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className={styles.stepItem}>
            <div className={styles.stepIconWrap}>
              <MessageSquare size={20} strokeWidth={2.2} />
            </div>
            <div className={styles.stepText}>
              <h4 className={styles.stepHeading}>We reply in-thread</h4>
              <p className={styles.stepDesc}>
                You&apos;ll get a notification when support responds. Reply right
                here to keep the conversation going.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className={styles.stepItem}>
            <div className={styles.stepIconWrap}>
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div className={styles.stepText}>
              <h4 className={styles.stepHeading}>Track to resolution</h4>
              <p className={styles.stepDesc}>
                Follow your ticket from open to resolved. Support team will verify
                and close the ticket once your issue is completely solved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Live Channels Helper Bar ── */}
      <div className={styles.liveChannelsBar}>
        <div className={styles.liveLeft}>
          <PhoneCall size={16} color="#6366f1" />
          <span>Need immediate assistance for urgent license activation?</span>
        </div>
        <div className={styles.liveActions}>
          <a
            href="https://wa.me/message/7ZV3N6YFBF5ED1"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.liveBtnWa}
          >
            <span>WhatsApp Live Chat</span>
          </a>
          <a
            href="https://t.me/techsolutionsbd247"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.liveBtnTg}
          >
            <span>Telegram Support</span>
          </a>
        </div>
      </div>

      {/* ── Modal: Open New Ticket ── */}
      {isCreateOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-ticket-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <LifeBuoy size={20} color="#ea580c" />
                <h3 id="new-ticket-title" className={styles.modalTitle}>
                  Open a support ticket
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                {/* Verified user badge */}
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "12.5px",
                    color: "#059669",
                  }}
                >
                  <UserCheck size={18} />
                  <span>
                    Submitting as <strong>{customerName || "Verified User"}</strong> ({customerEmail}{customerPhone ? `, ${customerPhone}` : ""})
                  </span>
                </div>

                {/* Optional phone update if not in profile */}
                {!customerPhone && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Phone / WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 017XXXXXXXX"
                      className={styles.formInput}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select
                      className={styles.formSelect}
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as TicketCategory)
                      }
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority</label>
                    <select
                      className={styles.formSelect}
                      value={priority}
                      onChange={(e) =>
                        setPriority(e.target.value as TicketPriority)
                      }
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Windows 11 activation key error or query"
                    className={styles.formInput}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Order Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TSB-89412 or invoice reference"
                    className={styles.formInput}
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Describe the issue in detail
                  </label>
                  <textarea
                    required
                    placeholder="Provide details about what happened, error codes (e.g. 0xC004C008), or steps to reproduce..."
                    className={styles.formTextarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className={styles.diagnosticBox}>
                  <Info size={16} color="#ea580c" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Connection &amp; Diagnostic Details:</strong> We will
                    automatically attach your client environment (
                    <code>{getClientDiagnosticDetails()}</code>) so we can debug
                    faster without extra back-and-forth.
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Opening...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Ticket Thread Viewer ── */}
      {activeTicket && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setActiveTicket(null)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-thread-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <span className={styles.ticketCode}>
                  #{activeTicket.ticketCode}
                </span>
                <span
                  className={`${styles.tagPill} ${
                    activeTicket.status === "Closed"
                      ? styles.statusClosed
                      : styles.statusOpen
                  }`}
                >
                  {activeTicket.status}
                </span>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setActiveTicket(null)}
                aria-label="Close thread"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <h3 id="ticket-thread-title" className={styles.modalTitle}>
                  {activeTicket.subject}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "var(--account-muted, #64748b)",
                  }}
                >
                  <span>Category: {activeTicket.category}</span>
                  <span>•</span>
                  <span>Priority: {activeTicket.priority}</span>
                  {activeTicket.customerPhone && (
                    <>
                      <span>•</span>
                      <span>Phone: {activeTicket.customerPhone}</span>
                    </>
                  )}
                  {activeTicket.orderNumber && (
                    <>
                      <span>•</span>
                      <span>Order #{activeTicket.orderNumber}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className={styles.threadMessages}>
                {activeTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.messageBubble} ${
                      msg.sender === "customer"
                        ? styles.customerMsg
                        : styles.supportMsg
                    }`}
                  >
                    <div className={styles.msgSender}>
                      {msg.sender === "support" ? "🛡️ Support Team" : `👤 ${msg.senderName}`}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.message}</div>
                    <div className={styles.msgTime}>
                      {formatRelativeTime(msg.createdAt)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form or Closed Notice */}
              {activeTicket.status === "Closed" ? (
                <div
                  style={{
                    background: "rgba(148, 163, 184, 0.08)",
                    border: "1px dashed var(--account-border, #cbd5e1)",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    textAlign: "center",
                    fontSize: "12.5px",
                    color: "var(--account-muted, #64748b)",
                    marginTop: "12px",
                  }}
                >
                  🔒 This ticket has been marked as <strong>Closed</strong> by the support team. If you require further assistance, please open a new ticket.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className={styles.replyBox}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      required
                      placeholder="Reply to this ticket..."
                      className={styles.formInput}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={isSendingReply}
                      className={styles.submitBtn}
                      style={{ flexShrink: 0 }}
                    >
                      <Send size={14} />
                      <span>Send</span>
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--account-muted, #94a3b8)",
                      }}
                    >
                      Support team replies in-thread in ~15 mins
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

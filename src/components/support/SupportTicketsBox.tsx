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
  HelpCircle,
  PhoneCall,
  Info,
} from "lucide-react";
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
  embedded = false,
}: SupportTicketsBoxProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<"All" | "Active" | "Closed">("All");

  // Open modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Bug");
  const [priority, setPriority] = useState<TicketPriority>("Normal");
  const [orderNumber, setOrderNumber] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState(initialUserName);
  const [customerEmail, setCustomerEmail] = useState(initialUserEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thread reply states
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Load tickets on client mount
  useEffect(() => {
    const loaded = getStoredTickets();
    setTickets(loaded);
    setIsLoaded(true);
  }, []);

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
    if (!subject.trim() || !description.trim()) {
      notify.error("Please fill in subject and description");
      return;
    }

    setIsSubmitting(true);
    const diagInfo = getClientDiagnosticDetails();

    try {
      const newTicket = createStoredTicket({
        subject: subject.trim(),
        category,
        priority,
        orderNumber: orderNumber.trim() || undefined,
        customerName: customerName.trim() || "Customer",
        customerEmail: customerEmail.trim() || "guest@techsolutionsbd.com",
        description: description.trim(),
        deviceInfo: diagInfo,
      });

      // Update state
      setTickets(getStoredTickets());

      // Attempt to push to server API (which pings Telegram)
      fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketCode: newTicket.ticketCode,
          category: newTicket.category,
          priority: newTicket.priority,
          subject: newTicket.subject,
          description: description.trim(),
          customerName: customerName.trim() || "Customer",
          customerEmail: customerEmail.trim() || "guest@techsolutionsbd.com",
          orderNumber: orderNumber.trim() || undefined,
          deviceInfo: diagInfo,
        }),
      }).catch(() => {});

      notify.success(`Ticket #${newTicket.ticketCode} Created!`, {
        description: "Our support engineering team will reply in-thread shortly.",
      });

      // Reset form
      setSubject("");
      setDescription("");
      setOrderNumber("");
      setIsCreateOpen(false);
      setActiveTicket(newTicket);
    } catch {
      notify.error("Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle in-thread reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const updated = addMessageToTicket(
        activeTicket.id,
        replyText.trim(),
        "customer",
        customerName.trim() || "Customer"
      );

      if (updated) {
        setActiveTicket(updated);
        setTickets(getStoredTickets());
        setReplyText("");
        notify.success("Reply added to thread");
      }
    } catch {
      notify.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Handle closing or reopening ticket
  const handleToggleStatus = (ticket: SupportTicket) => {
    const nextStatus = ticket.status === "Closed" ? "In Progress" : "Closed";
    const updated = updateTicketStatus(ticket.id, nextStatus);
    if (updated) {
      setActiveTicket(updated);
      setTickets(getStoredTickets());
      notify.info(`Ticket #${ticket.ticketCode} marked as ${nextStatus}`);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ── 1. Top Header Card (Matching User Screenshot) ── */}
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
            onClick={() => setIsCreateOpen(true)}
            title="Open a new support ticket"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Open ticket</span>
          </button>
        </div>

        {/* ── Stats Bar ── */}
        <div className={styles.statsBar}>
          <div className={styles.statCol}>
            <div className={styles.statIconWrap}>
              <MessageSquare size={17} color="#94a3b8" />
            </div>
            <div>
              <div className={styles.statNum}>{isLoaded ? totalCount : 1}</div>
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
              <div className={styles.statNum}>{isLoaded ? resolvedCount : 1}</div>
              <div className={styles.statLabel}>Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Your Tickets Section ── */}
      <div className={styles.ticketsSection}>
        <div className={styles.ticketsHeader}>
          <h2 className={styles.sectionHeading}>Your tickets</h2>
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
        </div>

        <div className={styles.ticketList}>
          {filteredTickets.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                No {filter !== "All" ? filter.toLowerCase() : ""} support tickets
                found.
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
                Follow your ticket from open to resolved. Reopen within 7 days if
                something&apos;s still off.
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
                    placeholder="e.g. Windows 11 activation key error or issue"
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
                      <span>Creating...</span>
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
                    gap: "8px",
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "var(--account-muted, #64748b)",
                  }}
                >
                  <span>Category: {activeTicket.category}</span>
                  <span>•</span>
                  <span>Priority: {activeTicket.priority}</span>
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
                    <div className={styles.msgSender}>{msg.senderName}</div>
                    <div>{msg.message}</div>
                    <div className={styles.msgTime}>
                      {formatRelativeTime(msg.createdAt)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(activeTicket)}
                    className={styles.cancelBtn}
                    style={{ fontSize: "11.5px", padding: "4px 10px" }}
                  >
                    {activeTicket.status === "Closed"
                      ? "🔄 Reopen Ticket"
                      : "✅ Mark as Closed"}
                  </button>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--account-muted, #94a3b8)",
                    }}
                  >
                    We reply in-thread in ~15 mins
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


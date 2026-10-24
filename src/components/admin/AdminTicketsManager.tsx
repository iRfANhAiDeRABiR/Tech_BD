"use client";

import React, { useState, useMemo } from "react";
import {
  LifeBuoy,
  Search,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Filter,
} from "lucide-react";
import { notify } from "@/lib/toast";
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/support-ticket";
import { formatRelativeTime } from "@/lib/support-ticket-storage";
import styles from "./AdminTicketsManager.module.css";

interface AdminTicketsManagerProps {
  initialTickets: SupportTicket[];
}

const CATEGORIES: TicketCategory[] = [
  "License Key Activation",
  "Software Download",
  "Payment & Verification",
  "Bug",
  "General Inquiry",
  "Feedback",
];

export function AdminTicketsManager({ initialTickets }: AdminTicketsManagerProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  // Admin reply states
  const [adminReplyText, setAdminReplyText] = useState("");
  const [markResolvedOnReply, setMarkResolvedOnReply] = useState(true);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Compute live statistics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed"
  ).length;

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter !== "all" && t.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "all" && t.category !== categoryFilter) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          t.ticketCode.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.customerPhone.toLowerCase().includes(q) ||
          t.customerEmail.toLowerCase().includes(q) ||
          (t.orderNumber && t.orderNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tickets, search, statusFilter, categoryFilter]);

  // Refresh tickets from server
  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (data?.tickets) {
        setTickets(data.tickets);
        notify.success("Tickets refreshed");
      }
    } catch {
      notify.error("Failed to refresh tickets");
    }
  };

  // Submit admin reply
  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !adminReplyText.trim()) return;

    setIsSendingReply(true);
    const text = adminReplyText.trim();

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          ticketId: activeTicket.id,
          message: text,
          sender: "support",
          senderName: "Tech Solutions BD Support",
          subject: activeTicket.subject,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ticket) {
        let updatedTicket = data.ticket;

        // Optionally update status to Resolved
        if (markResolvedOnReply && updatedTicket.status !== "Resolved") {
          const patchRes = await fetch("/api/support/tickets", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticketId: updatedTicket.id,
              status: "Resolved",
            }),
          });
          const patchData = await patchRes.json();
          if (patchData.ticket) {
            updatedTicket = patchData.ticket;
          }
        }

        // Update local state
        setActiveTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
        );
        setAdminReplyText("");
        notify.success("Official support reply sent successfully!");
      } else {
        notify.error(data.error || "Failed to send reply");
      }
    } catch {
      notify.error("Network error sending reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Update Status & Priority directly from Admin Modal
  const handleUpdateStatusAndPriority = async (
    newStatus: TicketStatus,
    newPriority?: TicketPriority
  ) => {
    if (!activeTicket) return;
    setIsUpdatingStatus(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          status: newStatus,
          priority: newPriority || activeTicket.priority,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ticket) {
        setActiveTicket(data.ticket);
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? data.ticket : t))
        );
        notify.success(`Status updated to ${newStatus}`);
      }
    } catch {
      notify.error("Failed to update ticket status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── 1. Top Summary Stats ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
            <LifeBuoy size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{totalCount}</div>
            <div className={styles.statLabel}>Total Tickets</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <Clock size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{openCount}</div>
            <div className={styles.statLabel}>Open / Unresolved</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{inProgressCount}</div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{resolvedCount}</div>
            <div className={styles.statLabel}>Resolved / Closed</div>
          </div>
        </div>
      </div>

      {/* ── 2. Filters & Controls ── */}
      <div className={styles.controlsCard}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by ticket #, customer name, phone, email, subject..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.categorySelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className={styles.statusTabs}>
            {(["all", "Open", "In Progress", "Resolved", "Closed"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`${styles.statusTab} ${
                  statusFilter.toLowerCase() === s.toLowerCase()
                    ? styles.statusTabActive
                    : ""
                }`}
              >
                {s === "all" ? "All Status" : s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className={styles.statusTab}
            title="Refresh tickets"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── 3. Tickets Table ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Category &amp; Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Last Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ color: "var(--account-muted, #64748b)", fontSize: "14px" }}>
                      No support tickets found matching current filters.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <span className={styles.ticketCodeBadge}>
                        #{ticket.ticketCode}
                      </span>
                    </td>
                    <td>
                      <div className={styles.customerMeta}>
                        <span className={styles.customerName}>{ticket.customerName}</span>
                        <div className={styles.customerContacts}>
                          {ticket.customerPhone && (
                            <>
                              <a href={`tel:${ticket.customerPhone}`} className={styles.contactLink}>
                                📞 {ticket.customerPhone}
                              </a>
                              <a
                                href={`https://wa.me/${ticket.customerPhone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.waBadge}
                                title="Message on WhatsApp"
                              >
                                WhatsApp
                              </a>
                            </>
                          )}
                          <a href={`mailto:${ticket.customerEmail}`} className={styles.contactLink}>
                            ✉️ {ticket.customerEmail}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.subjectMeta}>
                        <span className={styles.subjectText}>{ticket.subject}</span>
                        <span className={styles.categoryTag}>📂 {ticket.category}</span>
                        {ticket.orderNumber && (
                          <span style={{ fontSize: "11px", color: "#6366f1" }}>
                            📦 Order: #{ticket.orderNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badgePill} ${
                          ticket.priority === "Urgent"
                            ? styles.priorityUrgent
                            : ticket.priority === "High"
                            ? styles.priorityHigh
                            : ticket.priority === "Normal"
                            ? styles.priorityNormal
                            : styles.priorityLow
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badgePill} ${
                          ticket.status === "Open"
                            ? styles.statusOpen
                            : ticket.status === "In Progress"
                            ? styles.statusInProgress
                            : ticket.status === "Resolved"
                            ? styles.statusResolved
                            : styles.statusClosed
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12.5px" }}>
                        <MessageSquare size={13} color="#94a3b8" />
                        <strong>{ticket.messages.length}</strong>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--account-muted, #64748b)" }}>
                        {formatRelativeTime(ticket.updatedAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => setActiveTicket(ticket)}
                        className={styles.actionBtn}
                      >
                        <span>Manage &amp; Reply</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. Ticket Detail & Reply Modal ── */}
      {activeTicket && (
        <div className={styles.modalBackdrop} onClick={() => setActiveTicket(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={styles.ticketCodeBadge}>
                  #{activeTicket.ticketCode}
                </span>
                <span
                  className={`${styles.badgePill} ${
                    activeTicket.status === "Open"
                      ? styles.statusOpen
                      : activeTicket.status === "In Progress"
                      ? styles.statusInProgress
                      : activeTicket.status === "Resolved"
                      ? styles.statusResolved
                      : styles.statusClosed
                  }`}
                >
                  {activeTicket.status}
                </span>
                <span style={{ fontSize: "15px", fontWeight: 700 }}>
                  {activeTicket.subject}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Meta Grid */}
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Customer Name</span>
                  <span className={styles.metaValue}>{activeTicket.customerName}</span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Phone / WhatsApp</span>
                  <span className={styles.metaValue}>
                    {activeTicket.customerPhone ? (
                      <a
                        href={`https://wa.me/${activeTicket.customerPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#25d366", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {activeTicket.customerPhone} (Chat)
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Email Address</span>
                  <span className={styles.metaValue}>
                    <a href={`mailto:${activeTicket.customerEmail}`} style={{ color: "#6366f1" }}>
                      {activeTicket.customerEmail}
                    </a>
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Category</span>
                  <span className={styles.metaValue}>{activeTicket.category}</span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Order Reference</span>
                  <span className={styles.metaValue}>
                    {activeTicket.orderNumber ? (
                      <a
                        href={`/api/orders/${encodeURIComponent(activeTicket.orderNumber)}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0284c7" }}
                      >
                        #{activeTicket.orderNumber} (Invoice)
                      </a>
                    ) : (
                      "None"
                    )}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Diagnostic Context</span>
                  <span className={styles.metaValue} style={{ fontSize: "11px", fontWeight: 400 }}>
                    {activeTicket.deviceInfo || "Browser environment"}
                  </span>
                </div>
              </div>

              {/* Status & Priority Controller */}
              <div className={styles.controlsRow}>
                <div className={styles.controlField}>
                  <span>Change Status:</span>
                  <select
                    className={styles.selectInput}
                    value={activeTicket.status}
                    disabled={isUpdatingStatus}
                    onChange={(e) =>
                      handleUpdateStatusAndPriority(e.target.value as TicketStatus)
                    }
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className={styles.controlField}>
                  <span>Priority:</span>
                  <select
                    className={styles.selectInput}
                    value={activeTicket.priority}
                    disabled={isUpdatingStatus}
                    onChange={(e) =>
                      handleUpdateStatusAndPriority(activeTicket.status, e.target.value as TicketPriority)
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Conversation Messages Thread */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 700 }}>
                  Conversation Thread ({activeTicket.messages.length} messages)
                </h4>

                <div className={styles.threadList}>
                  {activeTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.msgItem} ${
                        msg.sender === "customer"
                          ? styles.customerMsg
                          : styles.supportMsg
                      }`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 750, textTransform: "uppercase" }}>
                          {msg.sender === "support" ? "🛡️ Support Team" : `👤 ${msg.senderName}`}
                        </span>
                        <span style={{ fontSize: "10.5px", opacity: 0.7 }}>
                          {formatRelativeTime(msg.createdAt)}
                        </span>
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.message}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Reply Form */}
              <form onSubmit={handleAdminReply} className={styles.replyForm}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700 }}>
                    Official Support Reply
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={markResolvedOnReply}
                      onChange={(e) => setMarkResolvedOnReply(e.target.checked)}
                    />
                    <span>Automatically mark as Resolved after sending</span>
                  </label>
                </div>

                <textarea
                  required
                  placeholder="Type official reply to the customer (e.g. key details, fix instructions, replacement license)..."
                  className={styles.replyTextarea}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                />

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={isSendingReply || !adminReplyText.trim()}
                    className={styles.actionBtn}
                    style={{ padding: "10px 20px" }}
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Sending Reply...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Send Support Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

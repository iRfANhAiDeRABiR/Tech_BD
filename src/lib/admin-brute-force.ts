import { createBan, checkAccessBan } from "@/lib/bans-store";
import { logAdminEvent } from "@/lib/audit-logs-store";
import { invalidateProxyBanCache } from "@/proxy";
import { sendTelegramSecurityAlert } from "@/lib/telegram";

export const MAX_ADMIN_LOGIN_ATTEMPTS = 5;
export const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  targetEmail?: string;
}

// In-memory tracker for fast rate and brute-force tracking
const attemptsMap = new Map<string, AttemptRecord>();

// Periodically purge stale records
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStale(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, rec] of attemptsMap.entries()) {
    if (now - rec.lastAttemptAt > ADMIN_LOGIN_WINDOW_MS) {
      attemptsMap.delete(ip);
    }
  }
}

/**
 * Record a failed admin login attempt for a specific IP.
 * Sends Telegram alerts on suspicious repeated attempts and automatically bans the IP upon reaching 5 attempts.
 */
export async function recordFailedAdminLogin(
  ip: string,
  email?: string
): Promise<{
  banned: boolean;
  attemptsLeft: number;
  totalAttempts: number;
  banId?: string;
}> {
  const cleanIp = ip.trim();
  const now = Date.now();
  purgeStale(now);

  let record = attemptsMap.get(cleanIp);
  if (!record || now - record.lastAttemptAt > ADMIN_LOGIN_WINDOW_MS) {
    record = {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      targetEmail: email,
    };
  } else {
    record.count += 1;
    record.lastAttemptAt = now;
    if (email) record.targetEmail = email;
  }
  attemptsMap.set(cleanIp, record);

  // Check if threshold reached
  if (record.count >= MAX_ADMIN_LOGIN_ATTEMPTS) {
    const banReason = `Automatic Security Ban: Brute force admin login detected (${record.count} failed attempts)`;
    const banNotes = `Automatically banned by Security System after ${record.count} consecutive failed login attempts on admin panel. Target email: ${
      email || "unknown"
    }. Timestamp: ${new Date().toISOString()}`;

    // Create immediate active IP ban across the whole website
    const ban = await createBan({
      type: "IP",
      target: cleanIp,
      targetEmail: email || null,
      reason: banReason,
      notes: banNotes,
      bannedBy: "System (Auto-BruteForce-Defense)",
    });

    // Invalidate proxy ban cache immediately so edge/proxy blocks next request instantly
    invalidateProxyBanCache();

    // Log high-priority security audit event
    try {
      await logAdminEvent({
        action: "SECURITY_AUTO_BAN",
        category: "SECURITY",
        entityType: "AccessBan",
        entityId: ban.id,
        entityName: `IP: ${cleanIp}`,
        severity: "CRITICAL",
        adminEmail: "System (Auto-Defense)",
        details: {
          ip: cleanIp,
          attempts: record.count,
          targetEmail: email,
          bannedAt: new Date().toISOString(),
          reason: banReason,
        },
        ipAddress: cleanIp,
      });
    } catch (auditErr) {
      console.warn("Failed to write security audit log for auto ban:", auditErr);
    }

    // Send immediate Telegram Bot Security Alert
    sendTelegramSecurityAlert({
      type: "BRUTE_FORCE_BAN",
      ip: cleanIp,
      targetEmail: email || null,
      attempts: record.count,
      banId: ban.id,
    }).catch((tgErr) => {
      console.warn("Failed to send telegram security ban alert:", tgErr);
    });

    // Clean up attempts for this IP since it is now permanently banned
    attemptsMap.delete(cleanIp);

    return {
      banned: true,
      attemptsLeft: 0,
      totalAttempts: record.count,
      banId: ban.id,
    };
  }

  // If suspicious repeated attempts (e.g. 3 attempts), send a Telegram warning alert
  if (record.count === 3) {
    sendTelegramSecurityAlert({
      type: "SUSPICIOUS_LOGIN_ATTEMPTS",
      ip: cleanIp,
      targetEmail: email || null,
      attempts: record.count,
      maxAttempts: MAX_ADMIN_LOGIN_ATTEMPTS,
    }).catch((tgErr) => {
      console.warn("Failed to send telegram suspicious login alert:", tgErr);
    });
  }

  const attemptsLeft = Math.max(0, MAX_ADMIN_LOGIN_ATTEMPTS - record.count);
  return {
    banned: false,
    attemptsLeft,
    totalAttempts: record.count,
  };
}

/**
 * Reset failed attempts upon successful admin login
 */
export function clearAdminLoginAttempts(ip: string): void {
  attemptsMap.delete(ip.trim());
}

/**
 * Get current failed attempt count for an IP
 */
export function getAdminLoginAttempts(ip: string): number {
  const cleanIp = ip.trim();
  const now = Date.now();
  const record = attemptsMap.get(cleanIp);
  if (!record) return 0;
  if (now - record.lastAttemptAt > ADMIN_LOGIN_WINDOW_MS) {
    attemptsMap.delete(cleanIp);
    return 0;
  }
  return record.count;
}

/**
 * Check if an IP is already banned or has active restrictions
 */
export async function isIpBannedOrLocked(
  ip: string
): Promise<{ isBanned: boolean; reason?: string; banId?: string }> {
  const cleanIp = ip.trim();
  const banStatus = await checkAccessBan({ ip: cleanIp });
  if (banStatus.isBanned && banStatus.ban) {
    return {
      isBanned: true,
      reason: banStatus.ban.reason,
      banId: banStatus.ban.id,
    };
  }
  return { isBanned: false };
}

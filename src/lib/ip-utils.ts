/**
 * Utility functions for extracting, normalizing, and formatting IP addresses.
 * Handles IPv6 loopback (::1), IPv4-mapped IPv6 (::ffff:x.x.x.x), and local dev environments.
 */

export function normalizeIp(rawIp: string | null | undefined): string {
  if (!rawIp) return "127.0.0.1";
  let ip = String(rawIp).trim();

  // Strip port if present in IPv4 (e.g. "127.0.0.1:54321")
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(":")[0];
  }

  // Strip IPv4-mapped IPv6 prefix (e.g. "::ffff:127.0.0.1" -> "127.0.0.1")
  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  // Normalize loopback / localhost
  if (
    ip === "::1" ||
    ip === "0:0:0:0:0:0:0:1" ||
    ip.toLowerCase() === "localhost" ||
    ip === "::" ||
    ip.toLowerCase() === "unknown"
  ) {
    return "127.0.0.1";
  }

  return ip;
}

export function isLocalhostIp(rawIp: string | null | undefined): boolean {
  if (!rawIp) return true;
  const ip = normalizeIp(rawIp);
  return (
    ip === "127.0.0.1" ||
    ip.startsWith("127.") ||
    ip === "::1" ||
    ip.toLowerCase() === "localhost"
  );
}

export function formatDisplayIp(rawIp: string | null | undefined): string {
  if (!rawIp) return "Unknown";
  const ip = normalizeIp(rawIp);
  if (isLocalhostIp(ip)) {
    return "127.0.0.1 (Localhost)";
  }
  return ip;
}

export function extractClientIp(
  headers: Headers | { get(name: string): string | null }
): string {
  // 1. CF-Connecting-IP (set by Cloudflare edge proxy)
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return normalizeIp(cf);

  // 2. X-Real-IP (set by reverse proxy)
  const real = headers.get("x-real-ip")?.trim();
  if (real) return normalizeIp(real);

  // 3. X-Forwarded-For (client IP is the leftmost entry in standard proxy chains)
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }

  return "127.0.0.1";
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split("/");
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false;

    const ipParts = ip.split(".").map(Number);
    const rangeParts = range.split(".").map(Number);
    if (ipParts.length !== 4 || rangeParts.length !== 4) return false;

    const ipNum =
      (ipParts[0] << 24) |
      (ipParts[1] << 16) |
      (ipParts[2] << 8) |
      ipParts[3];
    const rangeNum =
      (rangeParts[0] << 24) |
      (rangeParts[1] << 16) |
      (rangeParts[2] << 8) |
      rangeParts[3];

    const mask = bits === 0 ? 0 : ~0 << (32 - bits);
    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}


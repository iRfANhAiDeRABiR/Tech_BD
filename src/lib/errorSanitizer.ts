/**
 * Sanitizes errors and returns user-friendly, safe messages for customer-facing toasts.
 * Prevents raw SQL, Supabase connection details, Prisma internals, and stack traces
 * from leaking to users.
 */
export function getUserFriendlyError(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
): string {
  if (!error) return fallbackMessage;

  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : typeof (error as Record<string, unknown>)?.message === "string"
      ? String((error as Record<string, unknown>).message)
      : "";

  if (!rawMessage) return fallbackMessage;

  const normalized = rawMessage.toLowerCase();

  // Network & Connectivity issues
  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network error") ||
    normalized.includes("networkrequestfailed") ||
    normalized.includes("connection refused") ||
    normalized.includes("econndatabase") ||
    normalized.includes("econnrefused") ||
    normalized.includes("timeout") ||
    normalized.includes("abort")
  ) {
    return "Connection problem. Please check your internet connection and try again.";
  }

  // Auth / Login errors
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_grant") ||
    normalized.includes("invalid email or password")
  ) {
    return "Invalid email or password.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered") ||
    normalized.includes("email already in use")
  ) {
    return "An account with this email already exists.";
  }

  if (
    normalized.includes("otp expired") ||
    normalized.includes("token has expired") ||
    normalized.includes("token is expired")
  ) {
    return "Verification code expired. Please request a new code.";
  }

  if (
    normalized.includes("invalid otp") ||
    normalized.includes("invalid token") ||
    normalized.includes("otp invalid")
  ) {
    return "Invalid verification code. Please check and try again.";
  }

  if (normalized.includes("password should be at least")) {
    return "Password must be at least 10 characters long.";
  }

  // Database / Prisma / Supabase internals - never expose to user
  if (
    normalized.includes("prisma") ||
    normalized.includes("sql") ||
    normalized.includes("supabase") ||
    normalized.includes("foreign key") ||
    normalized.includes("unique constraint") ||
    normalized.includes("column") ||
    normalized.includes("relation") ||
    normalized.includes("table") ||
    normalized.includes("pg_") ||
    normalized.includes("syntax error") ||
    normalized.includes("jwt") ||
    normalized.includes("bearer") ||
    normalized.includes("internal server error") ||
    normalized.includes("violates") ||
    normalized.includes("permission denied") ||
    normalized.includes("stack trace") ||
    normalized.includes("exception")
  ) {
    return fallbackMessage;
  }

  // Length check: Don't show excessively long technical error strings
  if (rawMessage.length > 140) {
    return fallbackMessage;
  }

  return rawMessage;
}


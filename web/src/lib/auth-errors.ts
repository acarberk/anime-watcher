import type { AuthError } from "@supabase/supabase-js";

// Supabase Auth error codes → copy the user can act on
const MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "You haven't confirmed your email yet. Open the confirmation link in your inbox.",
  user_already_exists: "An account with this email already exists. Try signing in.",
  email_exists: "An account with this email already exists. Try signing in.",
  signup_disabled: "Sign-ups are currently closed.",
  weak_password: "That password is too weak. Use at least 8 characters with letters and numbers.",
  same_password: "Your new password must be different from the old one.",
  over_email_send_rate_limit: "Too many emails requested. Try again in a few minutes.",
  over_request_rate_limit: "Too many attempts. Wait a moment and try again.",
  email_address_invalid: "This email address doesn't look valid.",
  otp_expired: "This link has expired or was already used.",
  session_not_found: "Your session has ended. Sign in again.",
};

export function authMessage(error: Pick<AuthError, "code" | "message"> | null | undefined): string {
  if (!error) return "";
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (/fetch|network/i.test(error.message)) return "Couldn't connect. Check your internet connection and try again.";
  return "Something went wrong. Please try again.";
}

/** Errors Supabase puts on redirect URLs (?error_code=… or #error_code=…) */
export function urlAuthError(loc: Pick<Location, "search" | "hash">) {
  for (const raw of [loc.search, loc.hash.replace(/^#/, "?")]) {
    const p = new URLSearchParams(raw);
    const code = p.get("error_code") ?? p.get("error");
    if (code) return { code, message: p.get("error_description") ?? code };
  }
  return null;
}

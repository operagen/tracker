import "server-only";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Only these emails may use OAuth sign-in. The Supabase project is shared with
// another app, so "has an account" is not enough. Empty list = nobody.
export function isAllowedEmail(email: unknown) {
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return typeof email === "string" && allowed.includes(email.toLowerCase());
}

function sameSecret(given: string, want: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Accepts the static MCP_TOKEN (Claude Code) or a Supabase OAuth access token (claude.ai). */
export async function authorizeMcp(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const token = header.slice(7);

  const staticToken = process.env.MCP_TOKEN;
  if (staticToken && sameSecret(token, staticToken)) return true;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data) return false;
    return isAllowedEmail(data.claims.email);
  } catch {
    return false;
  }
}

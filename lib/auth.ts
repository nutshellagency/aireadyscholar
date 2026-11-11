// Owner login for /vault. Username "admin", password from the SITE_PASSWORD environment variable (set in Vercel).
// The session cookie holds an expiry and an HMAC of it, keyed by SITE_PASSWORD: changing the password logs everyone out.
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE = "ars_session";
export const MAX_AGE = 12 * 60 * 60; // 12 hours
const SECRET = () => process.env.SITE_PASSWORD || "";

function sign(exp: string) {
  return createHmac("sha256", SECRET()).update(`ars-admin:${exp}`).digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordSet() {
  return SECRET().length > 0;
}

export function checkLogin(user: string, pass: string) {
  if (!passwordSet()) return false;
  return same(user, "admin") && same(createHmac("sha256", "k").update(pass).digest("hex"), createHmac("sha256", "k").update(SECRET()).digest("hex"));
}

export function newSession() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export function validSession(value: string | undefined) {
  if (!value || !passwordSet()) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return same(sig, sign(exp));
}

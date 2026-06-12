import crypto from "crypto";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex"); // raw token for email
}

export function hashToken(token) {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
}

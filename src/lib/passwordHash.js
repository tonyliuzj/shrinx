import crypto from "crypto";

export function hashPassword(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

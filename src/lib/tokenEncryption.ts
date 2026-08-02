import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM, a dedicated key (INTEGRATION_TOKEN_ENCRYPTION_KEY) - never
// SESSION_SECRET, which signs session cookies for a different purpose
// and shouldn't double as an encryption key for stored OAuth tokens.
// Format: iv (12 bytes) + authTag (16 bytes) + ciphertext, all hex-joined
// with ":" so a single string column can hold everything needed to
// decrypt without a second lookup.
const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!hex) throw new Error("INTEGRATION_TOKEN_ENCRYPTION_KEY is not set.");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("INTEGRATION_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters).");
  return key;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(encoded: string): string {
  const [ivHex, authTagHex, dataHex] = encoded.split(":");
  if (!ivHex || !authTagHex || !dataHex) throw new Error("Malformed encrypted token.");
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

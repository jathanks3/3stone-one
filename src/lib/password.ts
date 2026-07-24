import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// scrypt, not bcrypt/argon2 — it's built into Node (`node:crypto`), so this
// needs no new dependency and no native binding to compile/deploy. It's a
// long-standing, still-recommended password KDF; nothing here is a
// homemade cryptographic scheme, just Node's own documented API for this
// exact purpose.

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const storedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  if (derivedKey.length !== storedKey.length) return false;
  // timingSafeEqual, not ===, so a wrong password can't be distinguished
  // by how long the comparison takes.
  return timingSafeEqual(derivedKey, storedKey);
}

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "brokerage-dashboard-super-secret-key-2026";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(req: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) return payload.userId;
  }

  // Check cookies next
  const tokenCookie = req.cookies.get("token");
  if (tokenCookie) {
    const payload = verifyToken(tokenCookie.value);
    if (payload) return payload.userId;
  }

  return null;
}

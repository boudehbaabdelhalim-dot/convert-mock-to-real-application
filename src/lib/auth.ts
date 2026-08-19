import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "smartstock-secret-2024-change-in-prod";
const COOKIE_NAME = "smartstock_token";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<JwtPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(role: "admin" | "manager"): Promise<JwtPayload> {
  const session = await requireAuth();
  if (role === "admin" && session.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  if (role === "manager" && session.role !== "admin" && session.role !== "manager") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export { COOKIE_NAME };

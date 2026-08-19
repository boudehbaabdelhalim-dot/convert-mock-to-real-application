import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/response";
import { seedDatabase } from "@/db/seed";

export async function POST(req: NextRequest) {
  try {
    // Seed on first login attempt
    await seedDatabase();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);

    if (!user) {
      return unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return unauthorized("Invalid email or password");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return ok({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    return handleApiError(error);
  }
}

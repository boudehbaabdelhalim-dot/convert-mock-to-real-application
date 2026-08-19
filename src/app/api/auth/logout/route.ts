import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return ok({ message: "Logged out" });
}

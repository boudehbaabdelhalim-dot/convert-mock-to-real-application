import { getSession } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/response";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  return ok({ name: session.name, email: session.email, role: session.role });
}

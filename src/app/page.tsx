import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return <AppShell user={{ name: session.name, role: session.role }} />;
}

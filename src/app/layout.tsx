import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartStock AI — Intelligent Business Management",
  description: "AI-powered retail and inventory management system with real-time analytics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-slate-200 antialiased">{children}</body>
    </html>
  );
}

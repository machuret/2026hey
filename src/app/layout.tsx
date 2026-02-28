import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hey More Leads — Ringless Voicemail & AI WhatsApp Lead Generation",
  description: "Done-For-You Lead Generation. No Cold Calls. No Ad Spend. We combine Ringless Voicemail Drops and AI-powered WhatsApp Agents to fill your pipeline with qualified leads.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}

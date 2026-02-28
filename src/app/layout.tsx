import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hey More Leads — More Conversations. More Closings. More Revenue.",
  description: "Done-For-You Lead Generation. No Cold Calls. No Ad Spend. Ringless Voicemail Drops + AI WhatsApp Agents to fill your pipeline with appointment-ready prospects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

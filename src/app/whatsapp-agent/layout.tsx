import type { Metadata } from "next";
import { getSeoMeta } from "@/lib/getSeoMeta";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMeta("whatsapp-agent");
  return { title, description };
}

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

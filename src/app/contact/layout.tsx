import type { Metadata } from "next";
import { getSeoMeta } from "@/lib/getSeoMeta";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMeta("contact");
  return { title, description };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

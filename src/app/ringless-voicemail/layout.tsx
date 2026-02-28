import type { Metadata } from "next";
import { getSeoMeta } from "@/lib/getSeoMeta";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMeta("ringless-voicemail");
  return { title, description };
}

export default function RinglessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

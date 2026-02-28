import type { Metadata } from "next";
import { getSeoMeta } from "@/lib/getSeoMeta";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMeta("packages");
  return { title, description };
}

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { getSeoMeta } from "@/lib/getSeoMeta";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMeta("case-studies");
  return { title, description };
}

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

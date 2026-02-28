import { getSupabaseAdmin } from "./supabase";

export type PageContent = Record<string, Record<string, string>>;
// shape: { section: { field: value } }

export async function getPageContent(page: string): Promise<PageContent> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("page_content")
      .select("section, field, value")
      .eq("page", page);
    if (error || !data) return {};
    const out: PageContent = {};
    for (const row of data) {
      if (!out[row.section]) out[row.section] = {};
      out[row.section][row.field] = row.value;
    }
    return out;
  } catch {
    return {};
  }
}

export function c(content: PageContent, section: string, field: string, fallback: string): string {
  return content?.[section]?.[field] ?? fallback;
}

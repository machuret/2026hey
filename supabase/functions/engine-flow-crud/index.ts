// Edge Function: engine-flow-crud
// CRUD for call_flow_trees and call_flow_nodes

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function verifyAuth(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  // Check cheap string comparison first before making a network call
  const token = auth.replace("Bearer ", "");
  if (token === SERVICE_ROLE_KEY) return true;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return false;
  return !!user;
}

const VALID_NODE_TYPES = ["stage", "objection", "response"];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const ok = await verifyAuth(req);
  if (!ok) return json({ error: "Unauthorized" }, 401);

  const url    = new URL(req.url);
  const target = url.searchParams.get("target"); // "tree" | "node"
  const id     = url.searchParams.get("id");
  const db     = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── Trees ────────────────────────────────────────────────────────
  if (target === "tree") {
    if (req.method === "GET") {
      if (id) {
        const [{ data: tree, error: te }, { data: nodes, error: ne }] = await Promise.all([
          db.from("call_flow_trees").select("*").eq("id", id).single(),
          db.from("call_flow_nodes").select("*").eq("tree_id", id).order("sort_order"),
        ]);
        if (te || !tree) return json({ error: "Tree not found" }, 404);
        if (ne) return json({ error: ne.message }, 500);
        return json({ tree, nodes: nodes ?? [] });
      }
      const { data, error } = await db.from("call_flow_trees").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ trees: data ?? [] });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { data, error } = await db.from("call_flow_trees").insert({
        name:        body.name,
        description: body.description ?? null,
        industry:    body.industry ?? null,
        updated_at:  new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return json({ success: true, tree: data });
    }

    if (req.method === "PATCH" && id) {
      const body = await req.json();
      const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name        !== undefined) fields.name        = body.name;
      if (body.description !== undefined) fields.description = body.description;
      if (body.industry    !== undefined) fields.industry    = body.industry;
      const { data, error } = await db.from("call_flow_trees").update(fields).eq("id", id).select().single();
      if (error) throw error;
      return json({ success: true, tree: data });
    }

    if (req.method === "DELETE" && id) {
      const { error } = await db.from("call_flow_trees").delete().eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }
  }

  // ── Nodes ────────────────────────────────────────────────────────
  if (target === "node") {
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.tree_id) return json({ error: "Missing tree_id" }, 400);
      if (!body.label || typeof body.label !== "string" || !body.label.trim()) return json({ error: "Missing label" }, 400);
      if (!VALID_NODE_TYPES.includes(body.node_type)) return json({ error: "Invalid node_type" }, 400);
      const { data, error } = await db.from("call_flow_nodes").insert({
        tree_id:    body.tree_id,
        parent_id:  body.parent_id ?? null,
        node_type:  body.node_type,
        label:      body.label,
        script:     body.script ?? null,
        sort_order: body.sort_order ?? 0,
        updated_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return json({ success: true, node: data });
    }

    if (req.method === "PATCH" && id) {
      const body = await req.json();
      const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.label      !== undefined) fields.label      = body.label;
      if (body.script     !== undefined) fields.script     = body.script;
      if (body.parent_id  !== undefined) fields.parent_id  = body.parent_id;
      if (body.sort_order !== undefined) fields.sort_order = body.sort_order;
      if (body.node_type  !== undefined && VALID_NODE_TYPES.includes(body.node_type)) fields.node_type = body.node_type;
      const { data, error } = await db.from("call_flow_nodes").update(fields).eq("id", id).select().single();
      if (error) throw error;
      return json({ success: true, node: data });
    }

    if (req.method === "DELETE" && id) {
      const { error } = await db.from("call_flow_nodes").delete().eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }
  }

  return json({ error: "Bad request — use ?target=tree or ?target=node" }, 400);
});

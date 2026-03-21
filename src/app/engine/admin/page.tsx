import { redirect } from "next/navigation";

export default function EngineAdminRoot() {
  redirect("/engine/admin/call-flow");
}

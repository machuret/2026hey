import { AlertCircle } from "lucide-react";

export function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-800 px-3 py-2 text-xs text-red-300">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {msg}
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { CrmLead } from "../page";

type Props = {
  onClose: () => void;
  onCreated: (lead: CrmLead) => void;
};

export default function AddLeadModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", industry: "", website: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/engine/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "manual" }),
      });
      const data = await res.json();
      if (data.success) {
        onCreated(data.lead);
      } else {
        setError(data.error ?? "Failed to create lead");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Add Lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {[
            { key: "name",     label: "Name *",    placeholder: "Full name" },
            { key: "company",  label: "Company",   placeholder: "Company name" },
            { key: "phone",    label: "Phone",      placeholder: "+1 555 000 0000" },
            { key: "email",    label: "Email",      placeholder: "email@example.com" },
            { key: "industry", label: "Industry",   placeholder: "e.g. Real Estate" },
            { key: "website",  label: "Website",    placeholder: "https://..." },
          ].map(({ key, label, placeholder }) => (
            <label key={key} className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">{label}</span>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </label>
          ))}

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Creating…" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { extractErrorMsg } from "@/app/engine/jobs/utils";

export type SmartLeadCampaign = {
  id:         number | string;
  name:       string;
  status?:    string;
  created_at?: string;
};

type State = {
  campaigns: SmartLeadCampaign[];
  loading:   boolean;
  error:     string;
};

/** Fetches SmartLead campaigns via `/api/engine/smartlead?action=campaigns`.
 *  Loads once on mount; call `reload()` to refresh. */
export function useSmartLeadCampaigns() {
  const [state, setState] = useState<State>({ campaigns: [], loading: false, error: "" });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const res  = await fetch("/api/engine/smartlead?action=campaigns", {
        signal: AbortSignal.timeout(15_000),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setState({
          campaigns: [],
          loading:   false,
          error:     data.error ?? `Failed to load campaigns (HTTP ${res.status})`,
        });
        return;
      }
      setState({
        campaigns: (data.campaigns ?? []) as SmartLeadCampaign[],
        loading:   false,
        error:     "",
      });
    } catch (e) {
      setState({ campaigns: [], loading: false, error: extractErrorMsg(e) });
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { ...state, reload };
}

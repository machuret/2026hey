"use client";

import { useEffect, useState, useCallback } from "react";
import { PhoneCall, Loader2 } from "lucide-react";
import type { Training } from "@/types/engine";
import { useTrainingCall } from "@/hooks/useTrainingCall";
import { TrainingSidebar } from "@/components/engine/training/TrainingSidebar";
import { CallArea }        from "@/components/engine/training/CallArea";
import { CoachingPanel }   from "@/components/engine/training/CoachingPanel";

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Training | null>(null);

  const call = useTrainingCall();

  const fetchTrainings = useCallback(async () => {
    try {
      const res  = await fetch("/api/engine/trainings");
      const data = await res.json();
      setTrainings((data.trainings ?? []).filter((t: Training) => t.is_active));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrainings(); }, [fetchTrainings]);

  const handleSelect = (t: Training) => {
    setSelected(t);
    call.resetReport();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading trainings…
      </div>
    );
  }

  return (
    <>
      {call.report && selected && (
        <CoachingPanel
          report={call.report}
          scenarioName={selected.name}
          onClose={call.resetReport}
        />
      )}

      <div className="flex h-full">
        <TrainingSidebar
          trainings={trainings}
          selected={selected}
          inCall={call.inCall}
          onSelect={handleSelect}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <PhoneCall className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a training session to begin</p>
              </div>
            </div>
          ) : (
            <CallArea
              selected={selected}
              messages={call.messages}
              inCall={call.inCall}
              thinking={call.thinking}
              listening={call.listening}
              transcript={call.transcript}
              error={call.error}
              coaching={call.coaching}
              recognitionRef={call.recognitionRef}
              onStartCall={() => call.startCall(selected)}
              onEndCall={() => call.endCall(selected.name)}
              onRestart={() => call.startCall(selected)}
              onStartListening={() => call.startListening(selected)}
              onStopListening={() => call.recognitionRef.current?.stop()}
              onViewDebrief={() => call.refetchDebrief(selected.name)}
            />
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { BookOpen, Mic, Brain, BarChart3, MessageSquare, Lock } from "lucide-react";

const PLANNED = [
  {
    icon: Mic,
    title: "AI Voice Role-play",
    description: "Practice cold calls live with an OpenAI voice agent that plays the prospect. Get real-time objection handling feedback.",
    status: "Planned — Q2 2026",
  },
  {
    icon: Brain,
    title: "Script Library",
    description: "Build a library of proven opening lines, objection responses, and closing scripts. Tag and search by industry.",
    status: "Planned — Q2 2026",
  },
  {
    icon: MessageSquare,
    title: "AI Call Coach",
    description: "Record a call, upload it, and get a scored breakdown: talk/listen ratio, objection handling, energy level, close attempt.",
    status: "Planned — Q3 2026",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description: "Track call outcomes over time. See conversion rates by stage, objection type, day of week, and caller.",
    status: "Planned — Q3 2026",
  },
];

export default function TrainingPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">Training</h1>
        </div>
        <p className="text-xs text-gray-500">AI-powered cold calling training — coming soon</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Coming soon hero */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-gray-900 border border-indigo-800/40 p-8 text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-900/60 border border-indigo-700 mb-4">
            <Brain className="h-7 w-7 text-indigo-300" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Training Module Coming Soon</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            We&apos;re building an AI-powered training system that lets virtual assistants practice and improve cold calling skills using real-time voice AI.
          </p>
        </div>

        {/* Planned features */}
        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">What&apos;s Coming</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANNED.map(({ icon: Icon, title, description, status }) => (
            <div key={title} className="rounded-xl bg-gray-900 border border-gray-800 p-5 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <Lock className="h-3.5 w-3.5 text-gray-700" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-900/40 border border-indigo-800">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <h4 className="text-sm font-semibold text-white">{title}</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{description}</p>
              <span className="text-[10px] font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-800 rounded-full px-2.5 py-1">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

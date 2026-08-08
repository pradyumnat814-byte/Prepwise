"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";
import { Check, Target } from "lucide-react";

export default function ScoreboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const interviewId = localStorage.getItem("interviewId");
    if (!interviewId) {
      router.push("/upload");
      return;
    }

    api.post("/interview/evaluate", { interviewId }).then((res) => {
      setData(res.data);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    });
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex items-center justify-center font-sans">
        <div className="text-center bg-white border border-neutral-200 p-8 rounded">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="font-mono text-xs uppercase text-neutral-500">Generating Analytics Scorecard...</p>
        </div>
      </div>
    );
  }

  const { scores, feedback, difficulty } = data;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-neutral-200 p-8 rounded gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
              EVALUATION REPORT / LEVEL: {difficulty}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#09090B]">
              Performance Scorecard
            </h1>
          </div>

          <div className="text-center md:text-right bg-[#09090B] text-white p-5 rounded min-w-[140px]">
            <div className="text-4xl font-mono font-bold">{scores.overallScore}</div>
            <div className="text-[10px] font-mono uppercase text-neutral-400 mt-1">Weighted Total / 100</div>
          </div>
        </div>

        {/* 5 Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { title: "Technical", score: scores.technicalScore },
            { title: "Problem Solving", score: scores.problemSolvingScore },
            { title: "Communication", score: scores.communicationScore },
            { title: "Confidence", score: scores.confidenceScore },
            { title: "Behavior", score: scores.behaviorScore },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-neutral-200 p-4 rounded text-center"
            >
              <div className="text-xl font-mono font-bold text-[#09090B]">{item.score}</div>
              <div className="text-[10px] font-mono uppercase text-neutral-500 mt-1">{item.title}</div>
            </div>
          ))}
        </div>

        {/* Qualitative Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-neutral-200 p-6 rounded space-y-3">
            <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">DEMONSTRATED STRENGTHS</span>
            <ul className="space-y-2 text-xs font-medium text-neutral-700 list-disc list-inside">
              {feedback.strengths.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-neutral-200 p-6 rounded space-y-3">
            <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">RECOMMENDATIONS</span>
            <ul className="space-y-2 text-xs font-medium text-neutral-700 list-disc list-inside">
              {feedback.recommendations.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <button
            onClick={() => router.push("/upload")}
            className="px-6 py-3 bg-[#09090B] hover:bg-neutral-800 text-white font-medium text-xs rounded transition"
          >
            Start New Practice Session
          </button>
        </div>
      </div>
    </div>
  );
}
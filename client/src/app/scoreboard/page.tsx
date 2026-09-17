"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";

interface Scores {
  overallScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  communicationScore: number;
  confidenceScore: number;
  behaviorScore: number;
}

interface Feedback {
  hiringRecommendation?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

interface EvaluationData {
  scores: Scores;
  feedback: Feedback;
  difficulty?: string;
}

export default function ScoreboardPage() {
  const router = useRouter();

  const [data, setData] =
    useState<EvaluationData | null>(null);

  const [error, setError] =
    useState<string>("");

  useEffect(() => {
    const loadEvaluation = async () => {
      const interviewId =
        localStorage.getItem("interviewId");

      if (!interviewId) {
        router.push("/upload");
        return;
      }

      try {
        const response = await api.post(
          "/interview/evaluate",
          {
            interviewId,
          }
        );

        const evaluation =
          response.data as EvaluationData;

        setData(evaluation);

        if (
          evaluation?.scores?.overallScore >
          50
        ) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: {
              y: 0.6,
            },
          });
        }
      } catch (err) {
        console.error(
          "[Scoreboard Error]:",
          err
        );

        setError(
          "Failed to load interview evaluation. Please try again."
        );
      }
    };

    loadEvaluation();
  }, [router]);

  const handleStartNewSession = () => {
    localStorage.removeItem("interviewId");
    localStorage.removeItem(
      "interviewScorecard"
    );

    router.push("/upload");
  };

  // =========================================================
  // ERROR STATE
  // =========================================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-4">
        <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">

          <div className="mb-4 text-4xl">
            ⚠️
          </div>

          <h1 className="mb-2 text-lg font-semibold text-[#09090B]">
            Evaluation Error
          </h1>

          <p className="mb-6 text-sm leading-6 text-neutral-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="rounded bg-[#09090B] px-5 py-2.5 font-mono text-xs text-white transition hover:bg-neutral-800"
          >
            Return to Upload
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-4">
        <div className="text-center">

          <div className="mb-4 text-4xl">
            ⚙️
          </div>

          <h1 className="text-lg font-semibold text-[#09090B]">
            Generating Analytics Scorecard...
          </h1>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            AI is analyzing your interview
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // DATA
  // =========================================================

  const scores = data.scores;

  const feedback = data.feedback;

  const difficulty =
    data.difficulty ?? "Technical";

  const metricItems = [
    {
      title: "Technical",
      score: scores?.technicalScore ?? 0,
    },
    {
      title: "Problem Solving",
      score:
        scores?.problemSolvingScore ?? 0,
    },
    {
      title: "Communication",
      score:
        scores?.communicationScore ?? 0,
    },
    {
      title: "Confidence",
      score:
        scores?.confidenceScore ?? 0,
    },
    {
      title: "Behavior",
      score:
        scores?.behaviorScore ?? 0,
    },
  ];

  const strengths =
    feedback?.strengths ?? [];

  const weaknesses =
    feedback?.weaknesses ?? [];

  const recommendations =
    feedback?.recommendations ?? [];

  // =========================================================
  // SCORE COLOR
  // =========================================================

  const getScoreLabel = (
    score: number
  ): string => {
    if (score >= 80) {
      return "Excellent";
    }

    if (score >= 60) {
      return "Good";
    }

    if (score >= 40) {
      return "Average";
    }

    return "Needs Improvement";
  };

  // =========================================================
  // MAIN SCOREBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#09090B]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-8 border-b border-neutral-200 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Evaluation Report
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Performance Scorecard
              </h1>
            </div>

            <div className="rounded border border-neutral-200 bg-white px-4 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                Interview Level
              </p>

              <p className="mt-1 text-sm font-semibold">
                {difficulty}
              </p>
            </div>
          </div>
        </header>

        {/* =================================================
            VERDICT
        ================================================= */}

        {feedback?.hiringRecommendation && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              Verdict
            </p>

            <p className="mt-1 text-lg font-semibold">
              {feedback.hiringRecommendation}
            </p>
          </div>
        )}

        {/* =================================================
            OVERALL SCORE
        ================================================= */}

        <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                Overall Performance
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Weighted interview score
              </p>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-6xl font-bold tracking-tighter">
                {scores.overallScore}
              </div>

              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Weighted Total / 100
              </p>

              <p className="mt-2 text-xs font-medium text-neutral-600">
                {getScoreLabel(
                  scores.overallScore
                )}
              </p>
            </div>
          </div>

          {/* Overall progress */}

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-[#09090B] transition-all duration-700"
              style={{
                width: `${Math.min(
                  Math.max(
                    scores.overallScore,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        {feedback?.summary && (
          <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Executive Summary
            </p>

            <p className="text-sm leading-7 text-neutral-700">
              {feedback.summary}
            </p>
          </section>
        )}

        {/* =================================================
            FIVE METRICS
        ================================================= */}

        <section className="mb-8">
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Performance Metrics
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Interview Breakdown
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {metricItems.map(
              (item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-medium text-neutral-500">
                    {item.title}
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {item.score}
                  </p>

                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                    / 100
                  </p>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-[#09090B]"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            item.score,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* =================================================
            QUALITATIVE FEEDBACK
        ================================================= */}

        <section className="grid gap-6 md:grid-cols-2">

          {/* STRENGTHS */}

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Demonstrated Strengths
            </p>

            {strengths.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {strengths.map(
                  (strength, index) => (
                    <li
                      key={`strength-${index}`}
                      className="flex gap-3 text-sm leading-6 text-neutral-700"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#09090B]" />

                      <span>
                        {strength}
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                No specific strengths were provided.
              </p>
            )}
          </div>

          {/* IMPROVEMENTS */}

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Areas For Improvement
            </p>

            {weaknesses.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {weaknesses.map(
                  (weakness, index) => (
                    <li
                      key={`weakness-${index}`}
                      className="flex gap-3 text-sm leading-6 text-neutral-700"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#09090B]" />

                      <span>
                        {weakness}
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                No specific improvement areas were provided.
              </p>
            )}
          </div>
        </section>

        {/* =================================================
            RECOMMENDATIONS
        ================================================= */}

        {recommendations.length > 0 && (
          <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
              Recommended Next Steps
            </p>

            <ul className="mt-4 space-y-3">
              {recommendations.map(
                (recommendation, index) => (
                  <li
                    key={`recommendation-${index}`}
                    className="flex gap-3 text-sm leading-6 text-neutral-700"
                  >
                    <span className="font-mono text-xs font-bold">
                      {index + 1}.
                    </span>

                    <span>
                      {recommendation}
                    </span>
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        {/* =================================================
            ACTION
        ================================================= */}

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleStartNewSession}
            className="rounded bg-[#09090B] px-6 py-3 font-mono text-xs text-white transition hover:bg-neutral-800"
          >
            Start New Practice Session
          </button>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-8 border-t border-neutral-200 pt-5 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
            AI Interview System • Analytics Report
          </p>
        </footer>
      </div>
    </main>
  );
}

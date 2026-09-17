"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, FileText, Code2, Award, ArrowRight, Sun, Moon } from "lucide-react";

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-[#a700cf] selection:text-white transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2.5">
            <div data-brand-mark className="w-7 h-7 bg-[#a700cf] text-white flex items-center justify-center font-mono text-xs font-bold rounded">
              AI
            </div>
            <span className="text-sm font-bold tracking-tight uppercase font-mono">
              Prepwisw
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={toggleTheme}
              data-theme-toggle
              className="flex items-center gap-1.5 rounded bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>
            <Link
              href="/login"
              className="text-xs font-medium text-neutral-500 hover:text-[var(--foreground)] transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-[#a700cf] hover:bg-[#8d00b0] text-white px-4 py-2 rounded transition flex items-center space-x-1.5"
            >
              <span>Get Started</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-16 space-y-16">
        <section className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-neutral-500 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NEXT.JS 16 • BUN ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            Adaptive AI Voice <br />
            Technical Interview Platform.
          </h1>

          <p className="text-neutral-500 text-base leading-relaxed max-w-xl font-normal">
            Automated technical screening with vector resume parsing, GitHub profile scraping, real-time speech interaction, and weighted scorecard evaluation.
          </p>

          <div className="flex items-center space-x-4 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 bg-[#a700cf] hover:bg-[#8d00b0] text-white font-medium text-xs rounded transition flex items-center space-x-2"
            >
              <span>Start Free Session</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[#a700cf] font-medium text-xs rounded transition"
            >
              Candidate Sign In
            </Link>
          </div>
        </section>

        {/* Minimal Feature Grid */}
        <section className="border-t border-[var(--card-border)] pt-16">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-8">
            01 / SYSTEM CAPABILITIES
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[var(--card-border)] border border-[var(--card-border)] rounded overflow-hidden">
            <div className="bg-[var(--card-bg)] p-8 space-y-4">
              <div className="p-2.5 bg-black/10 dark:bg-white/10 rounded w-fit text-[#a700cf]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold uppercase font-mono">01. Resume Parsing</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Extracts technical skill sets, education history, and frameworks from uploaded PDF files.
              </p>
            </div>

            <div className="bg-[var(--card-bg)] p-8 space-y-4">
              <div className="p-2.5 bg-black/10 dark:bg-white/10 rounded w-fit text-[#a700cf]">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold uppercase font-mono">02. GitHub Scraper</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Analyzes repository depth and primary language distribution to calibrate interview difficulty.
              </p>
            </div>

            <div className="bg-[var(--card-bg)] p-8 space-y-4">
              <div className="p-2.5 bg-black/10 dark:bg-white/10 rounded w-fit text-[#a700cf]">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold uppercase font-mono">03. Weighted Matrix</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Evaluates Technical Knowledge (40%), Problem Solving (20%), Communication (20%), Confidence (10%), and Behavior (10%).
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Overview */}
        <section className="border-t border-[var(--card-border)] pt-16">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-8">
            02 / PIPELINE ARCHITECTURE
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Authentication", desc: "JWT & bcrypt protected accounts" },
              { step: "02", title: "PDF Analysis", desc: "Vector text & skill extraction" },
              { step: "03", title: "Speech Room", desc: "Turn-by-turn AI voice synthesis" },
              { step: "04", title: "Evaluation", desc: "Automated candidate scorecard" },
            ].map((item, idx) => (
              <div key={idx} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded space-y-2">
                <span className="font-mono text-xs text-neutral-400">{item.step}</span>
                <h4 className="text-sm font-bold">{item.title}</h4>
                <p className="text-[11px] text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] bg-[var(--card-bg)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-neutral-500 gap-4">
          <span>AI VOICE INTERVIEWER • RCORTIZ MINIMALIST EDITION</span>
          <span>NEXT.JS 15 • EXPRESS • BUN • MONGODB</span>
        </div>
      </footer>
    </div>
  );
}
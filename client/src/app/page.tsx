"use client";

import Link from "next/link";
import { ArrowUpRight, Mic, FileText, Code2, Award, Sparkles, Terminal, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] font-sans selection:bg-[#09090B] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-[#09090B] text-white flex items-center justify-center font-mono text-xs font-bold rounded">
              AI
            </div>
            <span className="text-sm font-bold tracking-tight uppercase font-mono text-[#09090B]">
              Interviewer.dev
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-xs font-medium text-neutral-600 hover:text-black transition"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-[#09090B] hover:bg-neutral-800 text-white px-4 py-2 rounded transition flex items-center space-x-1.5"
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
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-neutral-200 bg-white text-neutral-600 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GEMINI 1.5 FLASH • BUN ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#09090B] leading-[1.1]">
            Adaptive AI Voice <br />
            Technical Interview Platform.
          </h1>

          <p className="text-neutral-600 text-base leading-relaxed max-w-xl font-normal">
            Automated technical screening with vector resume parsing, GitHub profile scraping, real-time speech interaction, and weighted scorecard evaluation.
          </p>

          <div className="flex items-center space-x-4 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 bg-[#09090B] hover:bg-neutral-800 text-white font-medium text-xs rounded transition flex items-center space-x-2"
            >
              <span>Start Free Session</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 font-medium text-xs rounded transition"
            >
              Candidate Sign In
            </Link>
          </div>
        </section>

        {/* Minimal Feature Grid */}
        <section className="border-t border-neutral-200 pt-16">
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 mb-8">
            01 / SYSTEM CAPABILITIES
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 rounded overflow-hidden">
            <div className="bg-white p-8 space-y-4 hover:bg-[#FAFAFA] transition">
              <div className="p-2.5 bg-neutral-100 rounded w-fit text-[#09090B]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#09090B] uppercase font-mono">01. Resume Parsing</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Extracts technical skill sets, education history, and frameworks from uploaded PDF files.
              </p>
            </div>

            <div className="bg-white p-8 space-y-4 hover:bg-[#FAFAFA] transition">
              <div className="p-2.5 bg-neutral-100 rounded w-fit text-[#09090B]">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#09090B] uppercase font-mono">02. GitHub Scraper</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Analyzes repository depth and primary language distribution to calibrate interview difficulty.
              </p>
            </div>

            <div className="bg-white p-8 space-y-4 hover:bg-[#FAFAFA] transition">
              <div className="p-2.5 bg-neutral-100 rounded w-fit text-[#09090B]">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#09090B] uppercase font-mono">03. Weighted Matrix</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Evaluates Technical Knowledge (40%), Problem Solving (20%), Communication (20%), Confidence (10%), and Behavior (10%).
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Overview */}
        <section className="border-t border-neutral-200 pt-16">
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
              <div key={idx} className="bg-white border border-neutral-200 p-6 rounded space-y-2">
                <span className="font-mono text-xs text-neutral-400">{item.step}</span>
                <h4 className="text-sm font-bold text-[#09090B]">{item.title}</h4>
                <p className="text-[11px] text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-neutral-500 gap-4">
          <span>AI VOICE INTERVIEWER • RCORTIZ MINIMALIST EDITION</span>
          <span>NEXT.JS 15 • EXPRESS • BUN • MONGODB</span>
        </div>
      </footer>
    </div>
  );
}
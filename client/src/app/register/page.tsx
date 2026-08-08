"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/register", { email, password, githubUrl });
      localStorage.setItem("token", response.data.token);
      router.push("/upload");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-white border border-neutral-200 p-8 rounded space-y-6 shadow-sm">
        <div className="space-y-1">
          <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">PORTAL / REGISTER</span>
          <h1 className="text-xl font-bold tracking-tight text-[#09090B]">Create Candidate Account</h1>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-medium rounded text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-neutral-200 rounded px-3 py-2 text-xs font-medium text-[#09090B] focus:outline-none focus:border-black"
              placeholder="candidate@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-neutral-200 rounded px-3 py-2 text-xs font-medium text-[#09090B] focus:outline-none focus:border-black"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-600 mb-1">GitHub Profile URL</label>
            <input
              type="url"
              required
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-neutral-200 rounded px-3 py-2 text-xs font-medium text-[#09090B] focus:outline-none focus:border-black"
              placeholder="https://github.com/username"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#09090B] hover:bg-neutral-800 text-white font-medium text-xs rounded transition"
          >
            Create Account & Continue
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500 pt-2 font-mono">
          Already registered?{" "}
          <a href="/login" className="text-black font-bold underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
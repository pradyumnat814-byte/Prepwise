"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FileText, Upload } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF resume file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      await api.post("/candidate/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const startRes = await api.post("/interview/start");
      localStorage.setItem("interviewId", startRes.data.interviewId);

      router.push("/interview");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to analyze candidate profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-neutral-200 p-8 rounded space-y-6 shadow-sm">
        <div className="space-y-1">
          <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">STEP 01 / PROFILE ANALYSIS</span>
          <h2 className="text-xl font-bold tracking-tight text-[#09090B]">
            Upload Candidate Resume
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-medium rounded text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border border-dashed border-neutral-300 hover:border-black rounded p-8 text-center bg-[#FAFAFA] transition cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              id="resumeInput"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="resumeInput" className="cursor-pointer flex flex-col items-center">
              <FileText className="w-8 h-8 text-neutral-400 mb-2" />
              <span className="font-mono text-xs font-bold text-[#09090B] uppercase">
                {file ? file.name : "Select or Drop PDF File"}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono mt-1">
                Vector Text PDF Format (Max 10MB)
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#09090B] hover:bg-neutral-800 text-white font-medium text-xs rounded transition flex items-center justify-center"
          >
            {loading ? "Analyzing Profile & Initializing AI..." : "Start Voice Interview"}
          </button>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface IMessage {
  speaker: "ai" | "candidate";
  text: string;
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const { isRecording, startRecording, stopRecording, speakText } = useAudioRecorder();

  const [interviewId, setInterviewId] = useState<string>("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 1, total: 5 });
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("interviewId");
    if (!id) {
      router.push("/upload");
      return;
    }
    setInterviewId(id);

    const greeting = "Welcome! I am your AI Technical Interviewer. Whenever you are ready, speak your answer or type it below to begin.";
    setMessages([{ speaker: "ai", text: greeting }]);
    speakText(greeting);
  }, []);

  const handleSendResponse = async (textToSend?: string, audioFile?: Blob) => {
    if (isFinished) return; // Prevent sending if interview completed

    const text = textToSend || inputText;
    if (!text && !audioFile) return;

    setLoading(true);
    setInputText("");

    if (text) {
      setMessages((prev) => [...prev, { speaker: "candidate", text }]);
    }

    try {
      let response;
      if (audioFile) {
        const formData = new FormData();
        formData.append("interviewId", interviewId);
        formData.append("audio", audioFile, "recording.webm");

        response = await api.post("/interview/respond", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/interview/respond", {
          interviewId,
          candidateText: text,
        });
      }

      const aiText = response.data.aiResponseText;
      if (response.data.currentQuestionIndex) {
        setProgress({
          current: Math.min(response.data.currentQuestionIndex, response.data.totalQuestions),
          total: response.data.totalQuestions,
        });
      }

      if (response.data.isCompleted) {
        setIsFinished(true);
      }

      setMessages((prev) => [...prev, { speaker: "ai", text: aiText }]);
      speakText(aiText);
    } catch (error) {
      console.error("Failed to send response:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = async () => {
    if (isFinished) return;
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) handleSendResponse(undefined, blob);
    } else {
      startRecording();
    }
  };

  const handleFinishInterview = async () => {
    setLoading(true);
    try {
      await api.post("/interview/evaluate", { interviewId });
      router.push("/scoreboard");
    } catch (error) {
      console.error("Failed to complete interview:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex flex-col justify-between p-6 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center border border-neutral-200 bg-white p-4 rounded max-w-4xl mx-auto w-full">
        <div className="space-y-0.5">
          <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">LIVE INTERVIEW SESSION</span>
          <div className="text-xs font-mono font-bold text-[#09090B]">
            TOPIC QUEUE: {progress.current} / {progress.total}
          </div>
        </div>

        <button
          onClick={handleFinishInterview}
          disabled={loading}
          className={`px-4 py-2 rounded text-xs font-mono font-bold transition border ${
            isFinished
              ? "bg-emerald-600 text-white border-emerald-600 animate-pulse shadow-md"
              : "bg-white text-red-600 border-red-200 hover:border-red-400"
          }`}
        >
          {loading ? "Evaluating..." : isFinished ? "View Scorecard 🎉" : "Finish & Score"}
        </button>
      </header>

      {/* Transcript Log */}
      <main className="flex-1 my-6 overflow-y-auto space-y-4 max-w-4xl mx-auto w-full pr-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.speaker === "candidate" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xl p-5 border rounded text-xs leading-relaxed ${
                msg.speaker === "candidate"
                  ? "bg-[#09090B] text-white border-[#09090B]"
                  : "bg-white text-[#09090B] border-neutral-200"
              }`}
            >
              <div className="font-mono text-[10px] uppercase mb-1 opacity-60">
                {msg.speaker === "candidate" ? "Candidate" : "AI Interviewer"}
              </div>
              {msg.text}
            </div>
          </div>
        ))}
      </main>

      {/* Input Controls */}
      <footer className="max-w-4xl mx-auto w-full space-y-3">
        <div className="flex items-center space-x-3 bg-white border border-neutral-200 p-2 rounded">
          <button
            onClick={toggleMic}
            disabled={isFinished || loading}
            className={`px-4 py-2.5 rounded font-mono text-xs font-bold transition flex items-center justify-center ${
              isFinished
                ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"
                : isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300"
            }`}
          >
            {isRecording ? "Stop Speech" : "Mic Input"}
          </button>

          <input
            type="text"
            disabled={isFinished || loading}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendResponse()}
            placeholder={
              isFinished
                ? "Interview completed! Click 'View Scorecard 🎉' above."
                : "Type your response here or click 'Mic Input'..."
            }
            className="flex-1 bg-transparent px-3 text-xs font-medium text-[#09090B] focus:outline-none disabled:cursor-not-allowed disabled:text-neutral-400"
          />

          <button
            onClick={() => handleSendResponse()}
            disabled={loading || isFinished || !inputText.trim()}
            className="px-5 py-2.5 bg-[#09090B] hover:bg-neutral-800 text-white font-mono text-xs rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
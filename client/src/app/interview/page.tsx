"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  useAudioRecorder,
  speakText,
} from "@/hooks/useAudioRecorder";

interface Message {
  speaker: "ai" | "candidate";
  text: string;
}

interface InterviewResponse {
  candidateSpokenText?: string;
  aiResponseText?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  isCompleted?: boolean;
}

export default function Page() {
  const router = useRouter();

  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const [interviewId, setInterviewId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string>("");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  }>({
    current: 1,
    total: 5,
  });
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasStartedAudio, setHasStartedAudio] =
    useState<boolean>(false);

  const initialGreeting =
    "Welcome! I am your AI Technical Interviewer. Whenever you are ready, speak your answer or type it below to begin.";

  useEffect(() => {
    const initInterview = async () => {
      // If an interview is already running, avoid restarting
      const existingId = localStorage.getItem("interviewId");
      if (existingId) {
        setInterviewId(existingId);
        return;
      }

      // Load the analyzed profile from the upload step
      const storedProfile = localStorage.getItem("candidateProfile");
      const candidateProfile = storedProfile
        ? JSON.parse(storedProfile)
        : null;

      try {
        setStatusNote("Starting interview session...");

        const res = await api.post("/interview/start", {
          candidateProfile,
        });

        if (res.data?.interviewId) {
          localStorage.setItem("interviewId", res.data.interviewId);
          setInterviewId(res.data.interviewId);
          setStatusNote("");
          setMessages([
            {
              speaker: "ai",
              text: res.data.firstQuestion,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to start interview session:", err);
        setStatusNote(
          "Could not start interview session. Please check your server."
        );
      }
    };

    initInterview();
  }, []);

  const handleStartAudio = () => {
    setHasStartedAudio(true);
    speakText(initialGreeting);
  };

  const handleSendResponse = async (
    textToSend?: string,
    audioFile?: Blob
  ) => {
    if (loading || isFinished) {
      return;
    }

    const text =
      textToSend !== undefined
        ? textToSend.trim()
        : inputText.trim();

    if (!text && !audioFile) {
      return;
    }

    if (!interviewId) {
      setStatusNote(
        "Interview session is not ready yet."
      );
      return;
    }

    setLoading(true);
    setInputText("");

    if (text) {
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          speaker: "candidate",
          text: text,
        },
      ]);
    } else {
      setStatusNote(
        "Transcribing audio with Whisper.cpp..."
      );
    }

    try {
      let response;

      if (audioFile) {
        const formData = new FormData();

        formData.append(
          "interviewId",
          interviewId
        );

        formData.append(
          "audio",
          audioFile,
          "recording.webm"
        );

        response = await api.post<InterviewResponse>(
          "/interview/respond",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

        const spokenText =
          response.data.candidateSpokenText;

        if (spokenText) {
          setMessages((previousMessages) => [
            ...previousMessages,
            {
              speaker: "candidate",
              text: spokenText,
            },
          ]);
        }
      } else {
        response = await api.post<InterviewResponse>(
          "/interview/respond",
          {
            interviewId: interviewId,
            candidateText: text,
          }
        );
      }

      const data = response.data;

      setStatusNote("");

      if (data.currentQuestionIndex !== undefined) {
        setProgress({
          current: Math.min(
            data.currentQuestionIndex,
            data.totalQuestions ?? progress.total
          ),
          total:
            data.totalQuestions ?? progress.total,
        });
      }

      if (data.isCompleted) {
        setIsFinished(true);
      }

      if (data.aiResponseText) {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            speaker: "ai",
            text: data.aiResponseText as string,
          },
        ]);

        if (hasStartedAudio) {
          speakText(data.aiResponseText);
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown interview response error";
      const axiosError = error as {
        response?: {
          data?: unknown;
          status?: number;
        };
      };

      console.warn(
        "[Interview Response Error]:",
        axiosError.response?.data || errorMessage
      );

      if (axiosError.response?.status === 404) {
        localStorage.removeItem("interviewId");
        setInterviewId("");
        setStatusNote(
          "Session expired. Please refresh the page to start a new session."
        );
      } else {
        setStatusNote("Unable to process response.");
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          speaker: "ai",
          text: "I had trouble processing the audio. Could you please try repeating your response or typing it below?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = async () => {
    if (loading || isFinished) {
      return;
    }

    if (!interviewId) {
      setStatusNote(
        "Interview session is not ready yet."
      );
      return;
    }

    setHasStartedAudio(true);

    if (isRecording) {
      try {
        const audioBlob = await stopRecording();

        if (audioBlob) {
          await handleSendResponse(
            undefined,
            audioBlob
          );
        }
      } catch (error) {
        console.error(
          "Error stopping recording:",
          error
        );

        setStatusNote(
          "Could not process the recording."
        );
      }
    } else {
      try {
        setStatusNote(
          "Recording... Speak your answer."
        );

        startRecording();
      } catch (error) {
        console.error(
          "Error starting recording:",
          error
        );

        setStatusNote(
          "Could not access your microphone."
        );
      }
    }
  };

  const handleFinishInterview = async () => {
    if (loading || !interviewId) {
      return;
    }

    setLoading(true);
    setStatusNote(
      "Calculating scorecard evaluation..."
    );

    try {
      const response = await api.post(
        "/interview/evaluate",
        {
          interviewId: interviewId,
        }
      );

      if (response.data) {
        localStorage.setItem(
          "interviewScorecard",
          JSON.stringify(response.data)
        );
      }

      router.push("/scoreboard");
    } catch (error) {
      console.error(
        "Failed to complete interview:",
        error
      );

      setStatusNote(
        "Evaluation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (
        !loading &&
        !isFinished &&
        inputText.trim()
      ) {
        handleSendResponse();
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#09090B]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">

        <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Live Interview Session
            </p>

            <h1 className="mt-1 text-xl font-semibold">
              AI Technical Interviewer
            </h1>
          </div>

          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              Topic Queue
            </p>

            <p className="font-mono text-sm font-semibold">
              {progress.current} / {progress.total}
            </p>
          </div>
        </header>

        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-[#09090B] transition-all duration-500"
            style={{
              width: `${
                progress.total > 0
                  ? Math.min(
                      (progress.current /
                        progress.total) *
                        100,
                      100
                    )
                  : 0
              }%`,
            }}
          />
        </div>

        {!hasStartedAudio && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                Enable AI Voice
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Allow the AI interviewer to speak
                questions and responses.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartAudio}
              disabled={loading}
              className="rounded bg-[#09090B] px-4 py-2 font-mono text-xs text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enable Voice
            </button>
          </div>
        )}

        <section className="flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">

          <div className="max-h-[60vh] min-h-[400px] space-y-5 overflow-y-auto p-5 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <p className="font-mono text-xs text-neutral-400">
                  Initializing interview...
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCandidate =
                  message.speaker === "candidate";

                return (
                  <div
                    key={`${message.speaker}-${index}`}
                    className={`flex ${
                      isCandidate
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className="max-w-[85%] sm:max-w-[75%]">

                      <div
                        className={`mb-1.5 flex items-center gap-2 ${
                          isCandidate
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                          {isCandidate
                            ? "Candidate"
                            : "AI Interviewer"}
                        </span>

                        {!isCandidate && (
                          <button
                            type="button"
                            onClick={() =>
                              speakText(
                                message.text
                              )
                            }
                            className="font-mono text-[10px] text-neutral-500 hover:text-black"
                          >
                            🔊 Replay
                          </button>
                        )}
                      </div>

                      <div
                        className={`rounded-lg px-4 py-3 text-sm leading-6 ${
                          isCandidate
                            ? "bg-[#09090B] text-white"
                            : "bg-neutral-100 text-[#09090B]"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {statusNote && (
            <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-2.5">
              <p className="font-mono text-[10px] text-neutral-500">
                {statusNote}
              </p>
            </div>
          )}

          <div className="border-t border-neutral-200 p-4">

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

              <button
                type="button"
                onClick={toggleMic}
                disabled={
                  loading || isFinished
                }
                className={`rounded border px-4 py-2 font-mono text-xs ${
                  isRecording
                    ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-neutral-300 bg-white text-[#09090B] hover:bg-neutral-100"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {isRecording
                  ? "⏹ Stop Recording"
                  : "🎙 Mic Input"}
              </button>

              <button
                type="button"
                onClick={handleFinishInterview}
                disabled={
                  loading || !interviewId
                }
                className="rounded bg-[#09090B] px-4 py-2 font-mono text-xs text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? "Evaluating..."
                  : isFinished
                  ? "View Scorecard 🎉"
                  : "Finish & Score"}
              </button>
            </div>

            <div className="flex items-center rounded-lg border border-neutral-300 bg-white focus-within:border-neutral-500">

              <input
                type="text"
                value={inputText}
                onChange={(event) =>
                  setInputText(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={
                  loading || isFinished
                }
                placeholder={
                  isFinished
                    ? "Interview completed! Click 'View Scorecard 🎉' above."
                    : "Type your response here or click 'Mic Input'..."
                }
                className="flex-1 bg-transparent px-3 py-2.5 text-xs font-medium text-[#09090B] outline-none disabled:cursor-not-allowed disabled:text-neutral-400"
              />

              <button
                type="button"
                onClick={() =>
                  handleSendResponse()
                }
                disabled={
                  loading ||
                  isFinished ||
                  !inputText.trim()
                }
                className="mr-1.5 rounded bg-[#09090B] px-5 py-2.5 font-mono text-xs text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </section>

        <footer className="pt-4 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
            AI Interview System
          </p>
        </footer>
      </div>
    </main>
  );
}

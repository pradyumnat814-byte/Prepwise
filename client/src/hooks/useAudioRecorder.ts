"use client";

import { useState, useRef, useCallback } from "react";

export const speakText = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  // Cancel any prior speech
  window.speechSynthesis.cancel();

  // Resume paused synthesis engine
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const playUtterance = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const voice =
        voices.find((v) => v.lang.startsWith("en") && !v.name.includes("whisper")) ||
        voices[0];
      if (voice) utterance.voice = voice;
    }

    utterance.onerror = (e) => {
      // 'interrupted' and 'canceled' are standard when switching questions; do not treat as fatal
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.warn("[TTS Speech Error]:", e.error);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Chromium voices load asynchronously
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      playUtterance();
    };
  } else {
    playUtterance();
  }
};

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err) {
      console.error("[useAudioRecorder]: Failed to access mic:", err);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve(undefined);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        resolve(audioBlob);
      };

      recorder.stop();
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    speakText,
  };
}
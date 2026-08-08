"use client";

import { useState, useRef } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Start Recording Microphone Input
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const combinedBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(combinedBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access error:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  // 2. Stop Recording Microphone Input
  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const combinedBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(combinedBlob);
          setIsRecording(false);
          resolve(combinedBlob);
        };
        mediaRecorderRef.current.stop();
        // Stop all audio tracks to release microphone hardware indicator
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } else {
        resolve(null);
      }
    });
  };

  // 3. Text-to-Speech Output (AI Voice)
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      if (onEnd) {
        utterance.onend = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } else if (onEnd) {
      onEnd();
    }
  };

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    speakText,
  };
}
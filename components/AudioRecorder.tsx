"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}

export default function AudioRecorder({
  onRecordingComplete,
  disabled,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [analyserData, setAnalyserData] = useState<number[]>(new Array(32).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const MAX_DURATION = 300; // 5 minutes
  const WARN_DURATION = 240; // 4 minutes

  const updateAnalyser = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const normalized = Array.from(data.slice(0, 32)).map((v) => v / 255);
    setAnalyserData(normalized);
    animationRef.current = requestAnimationFrame(updateAnalyser);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        analyserRef.current = null;
      };

      mediaRecorder.start(1000); // collect chunks every second
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return d + 1;
        });
      }, 1000);

      updateAnalyser();
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access to record your timecard.");
    }
  }, [onRecordingComplete, updateAnalyser]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setAnalyserData(new Array(32).fill(0));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform visualization */}
      <div className="flex items-end justify-center gap-[2px] h-16 w-full max-w-xs">
        {analyserData.map((v, i) => (
          <div
            key={i}
            className={`w-2 rounded-full transition-all duration-75 ${
              isRecording ? "bg-red-500" : "bg-slate-300"
            }`}
            style={{ height: `${Math.max(4, v * 64)}px` }}
          />
        ))}
      </div>

      {/* Timer */}
      {isRecording && (
        <div
          className={`text-2xl font-mono font-bold ${
            duration >= WARN_DURATION ? "text-red-500" : "text-slate-700"
          }`}
        >
          {formatTime(duration)}
          {duration >= WARN_DURATION && (
            <span className="block text-sm text-red-500">
              Auto-stop at 5:00
            </span>
          )}
        </div>
      )}

      {/* Record / Stop button */}
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        size="lg"
        className={`rounded-full w-28 h-28 text-lg font-bold shadow-lg transition-all ${
          isRecording
            ? "bg-red-600 hover:bg-red-700 animate-pulse"
            : "bg-[#1F3864] hover:bg-[#2a4a80]"
        }`}
      >
        {disabled ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : isRecording ? (
          <div className="flex flex-col items-center gap-1">
            <Square className="w-8 h-8 fill-white" />
            <span className="text-xs">STOP</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Mic className="w-10 h-10" />
            <span className="text-xs">RECORD</span>
          </div>
        )}
      </Button>

      {!isRecording && !disabled && (
        <p className="text-sm text-slate-500 text-center max-w-xs">
          Tap to record your timecard. Talk about your day — jobs, tasks, hours,
          crew.
        </p>
      )}
    </div>
  );
}

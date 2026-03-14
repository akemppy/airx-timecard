"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Mic, Square } from "lucide-react";
import SubmissionReview from "@/components/SubmissionReview";
import type { ParsedTimeEntry } from "@/types";

type Step = "record" | "editing" | "analyzing" | "review" | "done";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function RecordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("record");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [editableTranscript, setEditableTranscript] = useState("");
  const [entries, setEntries] = useState<ParsedTimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submissionId, setSubmissionId] = useState("");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptSegment + " ";
        } else {
          interim += transcriptSegment;
        }
      }

      if (final) {
        setTranscript((prev) => (prev + final).trim());
      }
      setInterimTranscript(interim);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setError(`Microphone error: ${event.error}`);
      setIsRecording(false);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setError("");
    setTranscript("");
    setInterimTranscript("");
    setIsRecording(true);
    recognitionRef.current.start();
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setIsRecording(false);
    recognitionRef.current.stop();
    setInterimTranscript("");
    // After a brief moment, show the editing view with the final transcript
    setTimeout(() => {
      setEditableTranscript(transcript);
      setStep("editing");
    }, 100);
  }, [transcript]);

  const analyzeTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setError("Please record something before analyzing.");
        return;
      }

      setStep("analyzing");
      setError("");

      try {
        // Create submission record with the text transcript
        const submitRes = await fetch("/api/submissions/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: text,
            workDate: new Date().toISOString().split("T")[0],
          }),
        });

        if (!submitRes.ok) throw new Error("Failed to create submission.");
        const submitData = await submitRes.json();
        setSubmissionId(submitData.submissionId);

        // Analyze the transcript
        const analyzeRes = await fetch("/api/submissions/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: text,
            submissionId: submitData.submissionId,
          }),
        });

        if (!analyzeRes.ok) throw new Error("Analysis failed");
        const analyzeData = await analyzeRes.json();
        setEntries(analyzeData.entries);
        setTotalHours(analyzeData.totalHours);
        setWarnings(analyzeData.warnings || []);
        setStep("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setStep("editing");
      }
    },
    []
  );

  const handleSubmit = async (finalEntries: ParsedTimeEntry[]) => {
    const res = await fetch(`/api/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "submitted", entries: finalEntries }),
    });
    if (!res.ok) throw new Error("Submit failed");
    setStep("done");
  };

  const handleReRecord = () => {
    setStep("record");
    setTranscript("");
    setInterimTranscript("");
    setEditableTranscript("");
    setEntries([]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">AirX Timecard</h1>
        <button
          onClick={() => router.push("/history")}
          className="text-sm text-white/70 hover:text-white"
        >
          History
        </button>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "record" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Record Your Day</h2>
              <p className="text-sm text-slate-600">
                Hold the button and speak about your jobs, tasks, and hours
              </p>
            </div>

            <div className="flex flex-col items-center gap-8">
              {/* Live transcript display */}
              {isListening && (
                <div className="w-full max-w-sm bg-blue-50 rounded-lg p-4 border border-blue-200 min-h-20">
                  <p className="text-xs font-semibold text-blue-600 mb-2">LISTENING...</p>
                  <p className="text-sm text-slate-700">
                    {transcript}
                    {interimTranscript && (
                      <span className="italic text-slate-500 opacity-60">
                        {interimTranscript}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Record button */}
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={!recognitionRef.current}
                className={`rounded-full w-32 h-32 flex items-center justify-center text-white font-bold shadow-lg transition-all active:scale-95 ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700 animate-pulse"
                    : "bg-[#1F3864] hover:bg-[#2a4a80]"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {isRecording ? (
                    <>
                      <Square className="w-10 h-10 fill-white" />
                      <span className="text-xs">RELEASE</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-12 h-12" />
                      <span className="text-xs">HOLD</span>
                    </>
                  )}
                </div>
              </button>

              <p className="text-xs text-slate-500 text-center max-w-xs px-4">
                {isListening
                  ? "Release to finish recording"
                  : "Hold the button and speak. Release when done."}
              </p>
            </div>
          </div>
        )}

        {step === "editing" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Review & Edit</h2>
            <p className="text-sm text-slate-600 mb-4">
              Check your transcript and fix any errors before analyzing
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Your Transcript
              </label>
              <textarea
                value={editableTranscript}
                onChange={(e) => setEditableTranscript(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3864] text-sm"
                rows={6}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleReRecord}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Re-record
              </button>
              <button
                onClick={() => analyzeTranscript(editableTranscript)}
                className="flex-1 px-4 py-3 bg-[#1F3864] text-white rounded-lg text-sm font-semibold hover:bg-[#2a4a80]"
              >
                Analyze
              </button>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1F3864]" />
            <p className="text-lg font-medium text-slate-700">Analyzing...</p>
            <p className="text-sm text-slate-500">Extracting timecard entries</p>
          </div>
        )}

        {step === "review" && (
          <SubmissionReview
            transcript={editableTranscript}
            entries={entries}
            totalHours={totalHours}
            warnings={warnings}
            submissionId={submissionId}
            onSubmit={handleSubmit}
            onReRecord={handleReRecord}
          />
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-xl font-bold text-slate-800">Submitted!</h2>
            <p className="text-sm text-slate-500 text-center">
              Your timecard has been submitted for {totalHours} hours.
            </p>
            <button
              onClick={handleReRecord}
              className="mt-4 text-[#1F3864] underline text-sm"
            >
              Record another
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

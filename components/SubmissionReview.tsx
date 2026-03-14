"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, RotateCcw } from "lucide-react";
import TimeEntryCard from "./TimeEntryCard";
import type { ParsedTimeEntry } from "@/types";

interface SubmissionReviewProps {
  transcript: string;
  entries: ParsedTimeEntry[];
  totalHours: number;
  warnings: string[];
  submissionId: string;
  onSubmit: (entries: ParsedTimeEntry[]) => Promise<void>;
  onReRecord: () => void;
}

export default function SubmissionReview({
  transcript,
  entries: initialEntries,
  totalHours,
  warnings,
  submissionId,
  onSubmit,
  onReRecord,
}: SubmissionReviewProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = (index: number, entry: ParsedTimeEntry) => {
    const updated = [...entries];
    updated[index] = entry;
    setEntries(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(entries);
    } finally {
      setSubmitting(false);
    }
  };

  const currentTotal = entries.reduce((sum, e) => sum + e.hours, 0);
  const flaggedCount = entries.filter((e) => e.confidence < 0.8).length;

  return (
    <div className="space-y-4">
      {/* Transcript */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">
          Your Recording
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">{transcript}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReRecord}
          className="mt-2 text-xs text-slate-500"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Re-record
        </Button>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="p-3 bg-amber-50 border-amber-200">
          <h4 className="text-xs font-semibold text-amber-800 mb-1">
            Heads up
          </h4>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-700">
              {w}
            </p>
          ))}
        </Card>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{currentTotal}h</span>
          <span className="text-sm text-slate-500">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {flaggedCount > 0 && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            {flaggedCount} flagged
          </Badge>
        )}
      </div>

      {/* Time entries */}
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <TimeEntryCard
            key={i}
            entry={entry}
            index={i}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || entries.length === 0}
        className="w-full h-14 text-lg font-bold bg-[#1F3864] hover:bg-[#2a4a80]"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Send className="w-5 h-5 mr-2" />
        )}
        {submitting ? "Submitting..." : "SUBMIT"}
      </Button>
    </div>
  );
}

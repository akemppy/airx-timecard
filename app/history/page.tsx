"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Briefcase,
  Hash,
} from "lucide-react";
import type { Submission, TimeEntry } from "@/types";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  processing: {
    label: "Processing",
    className: "bg-slate-100 text-slate-700",
  },
  review: {
    label: "In Review",
    className: "bg-amber-100 text-amber-800",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-800",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function groupByDate(submissions: Submission[]): Record<string, Submission[]> {
  const groups: Record<string, Submission[]> = {};
  for (const sub of submissions) {
    const date = sub.workDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(sub);
  }
  return groups;
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const [expanded, setExpanded] = useState(false);
  const entries = submission.timeEntries || [];
  const totalHours =
    submission.totalHours ?? entries.reduce((sum, e) => sum + e.hours, 0);
  const statusInfo = STATUS_STYLES[submission.status] || STATUS_STYLES.processing;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="w-full text-left p-4 flex items-center justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-800">
              {formatDate(submission.workDate)}
            </span>
            <Badge className={`text-xs ${statusInfo.className}`}>
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {totalHours}h total
            </span>
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {expanded && entries.length > 0 && (
        <div className="border-t bg-slate-50/50">
          {entries.map((entry: TimeEntry, i: number) => (
            <div
              key={entry.id || i}
              className={`px-4 py-3 ${i < entries.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {entry.job?.name || entry.jobId}
                    </span>
                  </div>
                  {entry.costCode && (
                    <p className="text-xs text-slate-500 ml-5">
                      {entry.costCode.code} - {entry.costCode.description}
                    </p>
                  )}
                  {entry.description && (
                    <p className="text-xs text-slate-500 mt-1 ml-5">
                      {entry.description}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-[#1F3864] shrink-0">
                  {entry.hours}h
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && entries.length === 0 && (
        <div className="border-t px-4 py-6 text-center">
          <p className="text-sm text-slate-400">No time entries recorded</p>
        </div>
      )}
    </Card>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) throw new Error("Failed to load submissions");
        const data: Submission[] = await res.json();
        setSubmissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const grouped = groupByDate(submissions);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="p-1 -ml-1 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">History</h1>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#1F3864]" />
            <p className="text-sm text-slate-500">Loading submissions...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Clock className="w-12 h-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-400">
              No submissions yet
            </p>
            <p className="text-sm text-slate-400 text-center">
              Record your first timecard to see it here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-2 text-sm text-[#1F3864] font-medium underline"
            >
              Record timecard
            </button>
          </div>
        )}

        {!loading && sortedDates.length > 0 && (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <section key={date}>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  {formatFullDate(date)}
                </h2>
                <div className="space-y-2">
                  {grouped[date].map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

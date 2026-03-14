"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import type { TimeEntry } from "@/types";

export default function FlagsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/flags")
      .then((r) => r.json())
      .then((data) => setEntries(data.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const approveEntry = async (id: string) => {
    await fetch(`/api/time-entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFlagged: false, status: "approved" }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F3864]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Flagged Entries</h1>
        <Badge className="bg-white/20 text-white ml-auto">{entries.length}</Badge>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-3">
        {entries.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p>All clear! No flagged entries.</p>
          </div>
        )}

        {entries.map((entry) => (
          <Card key={entry.id} className="p-4 border-amber-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm">
                  {entry.job?.name || "Unknown Job"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {entry.costCode?.code} {entry.costCode?.description}
                  </Badge>
                  <span className="text-xs text-slate-500">{entry.hours}h</span>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-800 text-xs">
                {Math.round((entry.aiConfidence || 0) * 100)}%
              </Badge>
            </div>

            <p className="text-sm text-slate-600 mb-1">{entry.description}</p>

            {entry.flagReason && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded text-xs text-amber-700 mb-3">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                {entry.flagReason}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approveEntry(entry.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/jobs/${entry.jobId}`)
                }
              >
                View Job
              </Button>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}

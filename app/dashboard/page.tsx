"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardCards from "@/components/DashboardCards";
import {
  Loader2,
  AlertTriangle,
  Download,
  Search,
  ChevronRight,
} from "lucide-react";
import type { DashboardSummary, Submission, Employee } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F3864]" />
      </div>
    );
  }

  if (!data) return <div className="p-4">Failed to load dashboard</div>;

  const statusColor: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    review: "bg-amber-100 text-amber-800",
    processing: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => router.push("/query")}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              window.open(`/api/export/csv?from=${today}&to=${today}`, "_blank");
            }}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <DashboardCards
          totalSubmissions={data.totalSubmissions}
          submittedToday={data.submittedToday}
          pendingReview={data.pendingReview}
          flaggedEntries={data.flaggedEntries}
          totalEmployees={data.totalEmployees}
        />

        {/* Missing workers */}
        {data.missingWorkers.length > 0 && (
          <Card className="p-4 border-amber-200 bg-amber-50">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              Haven&apos;t Submitted Today
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.missingWorkers.map((w: Employee) => (
                <Badge key={w.id} variant="outline" className="text-amber-700">
                  {w.name}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Flagged entries link */}
        {data.flaggedEntries > 0 && (
          <Card
            className="p-4 border-red-200 cursor-pointer hover:bg-red-50 transition"
            onClick={() => router.push("/dashboard/flags")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">
                  {data.flaggedEntries} flagged entries need review
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </div>
          </Card>
        )}

        {/* Recent submissions */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            Today&apos;s Submissions
          </h2>
          <div className="space-y-2">
            {data.recentSubmissions.map((sub: Submission & { employee: Employee }) => (
              <Card
                key={sub.id}
                className="p-3 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => router.push(`/dashboard/jobs/${sub.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{sub.employee.name}</p>
                    <p className="text-xs text-slate-500">
                      {sub.totalHours}h &middot;{" "}
                      {sub.timeEntries?.length || 0} entries
                    </p>
                  </div>
                  <Badge className={statusColor[sub.status] || "bg-slate-100"}>
                    {sub.status}
                  </Badge>
                </div>
              </Card>
            ))}
            {data.recentSubmissions.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                No submissions today yet
              </p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/admin")}
          >
            Admin
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/")}
          >
            Record
          </Button>
        </div>
      </main>
    </div>
  );
}

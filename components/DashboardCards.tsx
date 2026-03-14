"use client";

import { Card } from "@/components/ui/card";
import { Users, FileCheck, AlertTriangle, Clock } from "lucide-react";

interface StatsProps {
  totalSubmissions: number;
  submittedToday: number;
  pendingReview: number;
  flaggedEntries: number;
  totalEmployees: number;
}

export default function DashboardCards({
  totalSubmissions,
  submittedToday,
  pendingReview,
  flaggedEntries,
  totalEmployees,
}: StatsProps) {
  const cards = [
    {
      label: "Submitted Today",
      value: `${submittedToday}/${totalEmployees}`,
      icon: FileCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending Review",
      value: pendingReview,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Flagged",
      value: flaggedEntries,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Submissions",
      value: totalSubmissions,
      icon: Users,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className={`p-4 ${c.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <c.icon className={`w-4 h-4 ${c.color}`} />
            <span className="text-xs text-slate-500">{c.label}</span>
          </div>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
        </Card>
      ))}
    </div>
  );
}

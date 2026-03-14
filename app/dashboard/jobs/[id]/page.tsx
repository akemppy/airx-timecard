"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobSummary {
  job: { id: string; name: string; foundationJobId: string; isPrevailingWage: boolean; state: string };
  costCodeBreakdown: { code: string; description: string; totalHours: number; totalQuantity: number; unit: string }[];
  totalHours: number;
  totalEntries: number;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}/summary`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F3864]" />
      </div>
    );
  }

  if (!data) return <div className="p-4">Job not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{data.job.name}</h1>
          <p className="text-xs text-white/70">
            #{data.job.foundationJobId}
            {data.job.isPrevailingWage && " | PW"}
            {data.job.state && ` | ${data.job.state}`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => window.open(`/api/export/csv?jobId=${data.job.id}`, "_blank")}
        >
          <Download className="w-4 h-4" />
        </Button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex gap-4">
          <Card className="flex-1 p-4 text-center">
            <p className="text-2xl font-bold text-[#1F3864]">{data.totalHours}</p>
            <p className="text-xs text-slate-500">Total Hours</p>
          </Card>
          <Card className="flex-1 p-4 text-center">
            <p className="text-2xl font-bold text-[#1F3864]">{data.totalEntries}</p>
            <p className="text-xs text-slate-500">Entries</p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost Code</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.costCodeBreakdown.map((row) => (
                <TableRow key={row.code}>
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {row.code}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {row.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.totalHours}
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-600">
                    {row.totalQuantity ? `${row.totalQuantity} ${row.unit}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}

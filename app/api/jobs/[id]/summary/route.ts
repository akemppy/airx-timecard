import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: { jobId: id },
      include: {
        costCode: {
          select: {
            code: true,
            description: true,
          },
        },
      },
    });

    // Group by cost code
    const codeMap = new Map<
      string,
      { code: string; description: string; totalHours: number; totalQuantity: number; unit: string }
    >();

    for (const e of entries) {
      const key = e.costCode.code;
      const existing = codeMap.get(key) || {
        code: e.costCode.code,
        description: e.costCode.description,
        totalHours: 0,
        totalQuantity: 0,
        unit: e.unit || "",
      };
      existing.totalHours += Number(e.hours);
      existing.totalQuantity += Number(e.quantity || 0);
      if (e.unit && !existing.unit) existing.unit = e.unit;
      codeMap.set(key, existing);
    }

    return NextResponse.json({
      job,
      costCodeBreakdown: Array.from(codeMap.values()).sort(
        (a, b) => b.totalHours - a.totalHours
      ),
      totalHours: entries.reduce((sum, e) => sum + Number(e.hours), 0),
      totalEntries: entries.length,
    });
  } catch (error) {
    console.error("Job summary error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

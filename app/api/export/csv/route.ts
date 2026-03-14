import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { exportTimecardsCsv } from "@/lib/csv-export";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === "field") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const csv = await exportTimecardsCsv({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      jobId: searchParams.get("jobId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      status: searchParams.get("status") || undefined,
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="timecards-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

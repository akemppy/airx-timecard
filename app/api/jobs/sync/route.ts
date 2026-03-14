import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { syncJobs, syncCostCodes } from "@/lib/foundation-sync";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // Seed cost codes first
    const costCodeResult = await syncCostCodes();

    // Try Foundation sync
    const jobResult = await syncJobs();

    // Return current jobs
    const allJobs = await prisma.job.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      jobs: allJobs,
      message: `Cost codes: ${costCodeResult.synced} seeded. Foundation: ${jobResult.synced} synced. ${jobResult.errors.join("; ")}`,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

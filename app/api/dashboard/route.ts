import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role === "field") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total submissions count
    const totalSubmissions = await prisma.submission.count();

    // Get today's submissions with related data
    const todaySubmissions = await prisma.submission.findMany({
      where: {
        workDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Get flagged entries count
    const flaggedEntries = await prisma.timeEntry.count({
      where: {
        isFlagged: true,
        NOT: { status: "approved" },
      },
    });

    // Get active field employees
    const activeEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
        role: "field",
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    // Fetch time entries for each submission
    const todaySubmissionsWithEntries = await Promise.all(
      todaySubmissions.map(async (sub: any) => {
        const entries = await prisma.timeEntry.findMany({
          where: { submissionId: sub.id },
          include: {
            job: {
              select: {
                id: true,
                name: true,
                foundationJobId: true,
              },
            },
            costCode: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
          },
        });

        return {
          ...sub,
          timeEntries: entries,
        };
      })
    );

    const submittedIds = new Set(todaySubmissionsWithEntries.map((s: any) => s.employeeId));
    const missingWorkers = activeEmployees.filter((e) => !submittedIds.has(e.id));

    const pendingReview = todaySubmissionsWithEntries.filter(
      (s: any) => s.status === "review" || s.status === "submitted"
    ).length;

    return NextResponse.json({
      totalSubmissions,
      totalEmployees: activeEmployees.length,
      submittedToday: todaySubmissionsWithEntries.length,
      pendingReview,
      flaggedEntries,
      recentSubmissions: todaySubmissionsWithEntries,
      missingWorkers,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

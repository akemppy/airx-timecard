import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whereCondition: Record<string, any> = {};
    if (user.role === "field") {
      whereCondition.employeeId = user.id;
    }

    const result = await prisma.submission.findMany({
      where: whereCondition,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { workDate: "asc" },
      take: 50,
    });

    // Fetch time entries for each submission
    const submissionsWithEntries = await Promise.all(
      result.map(async (sub: any) => {
        const entries = await prisma.timeEntry.findMany({
          where: { submissionId: sub.id },
          include: {
            job: {
              select: {
                id: true,
                foundationJobId: true,
                name: true,
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

    return NextResponse.json(submissionsWithEntries);
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

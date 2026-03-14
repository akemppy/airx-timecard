import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobsWithCodes = await prisma.job.findMany({
      where: { status: "active" },
      include: {
        costCodes: {
          include: {
            costCode: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ jobs: jobsWithCodes });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

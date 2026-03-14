import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role === "field") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        isFlagged: true,
        NOT: { status: "approved" },
      },
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
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Flags error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

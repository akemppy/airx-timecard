import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncCostCodes } from "@/lib/foundation-sync";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await prisma.costCode.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ costCodes: codes });
  } catch (error) {
    console.error("Get cost codes error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const result = await syncCostCodes();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed cost codes error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

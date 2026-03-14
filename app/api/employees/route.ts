import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hashPin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees: result });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { name, pin, role, email, phone } = await request.json();

    if (!name || !pin || pin.length !== 4) {
      return NextResponse.json(
        { error: "Name and 4-digit PIN required" },
        { status: 400 }
      );
    }

    const pinHash = await hashPin(pin);

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        pinHash,
        role: role || "field",
        email: email || null,
        phone: phone || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ employee: newEmployee }, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

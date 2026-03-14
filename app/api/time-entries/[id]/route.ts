import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const entry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (user.role === "field" && entry.employeeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.hours !== undefined) updateData.hours = body.hours;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isFlagged !== undefined) updateData.isFlagged = body.isFlagged;
    if (body.flagReason !== undefined) updateData.flagReason = body.flagReason;

    await prisma.timeEntry.update({
      where: { id },
      data: updateData,
    });

    // Fetch the full entry with joins
    const result = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            foundationJobId: true,
            status: true,
            address: true,
          },
        },
        costCode: {
          select: {
            id: true,
            code: true,
            description: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update time entry error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

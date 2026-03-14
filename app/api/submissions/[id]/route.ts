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

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (user.role === "field" && submission.employeeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get time entries
    const entries = await prisma.timeEntry.findMany({
      where: { submissionId: id },
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

    return NextResponse.json({
      ...submission,
      timeEntries: entries,
    });
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

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

    // Update submission status
    const updateData: Record<string, unknown> = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "submitted") {
        updateData.submittedAt = new Date();
      }
      if (body.status === "approved") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = user.id;
      }
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData,
    });

    // If submitting, update all time entries too
    if (body.status === "submitted") {
      await prisma.timeEntry.updateMany({
        where: { submissionId: id },
        data: { status: "submitted" },
      });

      // If entries were edited, update them
      if (body.entries && Array.isArray(body.entries)) {
        const existingEntries = await prisma.timeEntry.findMany({
          where: { submissionId: id },
        });

        for (let i = 0; i < body.entries.length && i < existingEntries.length; i++) {
          const entry = body.entries[i];
          await prisma.timeEntry.update({
            where: { id: existingEntries[i].id },
            data: {
              hours: entry.hours,
              description: entry.task,
              quantity: entry.quantity || null,
              unit: entry.unit || null,
              notes: entry.notes || null,
              status: "submitted",
            },
          });
        }
      }
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

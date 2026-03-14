import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { parseTimecard } from "@/lib/parse-timecard";
import { validateEntries } from "@/lib/validate-entries";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcript, submissionId } = await request.json();

    if (!transcript || !submissionId) {
      return NextResponse.json(
        { error: "Missing transcript or submissionId" },
        { status: 400 }
      );
    }

    // Parse with AI
    const aiResult = await parseTimecard(transcript, user.id);

    // Validate
    const validated = validateEntries(aiResult.entries, aiResult.totalHours);

    // Get submission to find work date
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Create time entries in DB
    const timeEntriesList = [];

    for (const entry of validated.entries) {
      if (!entry.jobId) continue;

      const costCode = await prisma.costCode.findUnique({
        where: { code: entry.costCode },
      });

      if (!costCode) continue;

      const te = await prisma.timeEntry.create({
        data: {
          employeeId: user.id,
          workDate: submission.workDate,
          jobId: entry.jobId,
          costCodeId: costCode.id,
          hours: entry.hours,
          description: entry.task,
          quantity: entry.quantity || null,
          unit: entry.unit || null,
          crewMembers: JSON.stringify(entry.crewMembers || []),
          notes: entry.notes || null,
          aiConfidence: entry.confidence,
          isFlagged: entry.confidence < 0.8,
          flagReason: entry.flagReason || null,
          status: "draft",
          submissionId,
        },
      });

      timeEntriesList.push(te);
    }

    // Update submission
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "review",
        aiRawResponse: JSON.stringify(aiResult),
        totalHours: aiResult.totalHours,
      },
    });

    return NextResponse.json({
      entries: validated.entries,
      totalHours: aiResult.totalHours,
      warnings: [
        ...validated.warnings,
        ...(aiResult.warnings || []),
      ],
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

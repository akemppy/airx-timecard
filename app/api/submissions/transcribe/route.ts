import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const transcript = body.transcript as string;
    const workDate = body.workDate as string;

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    // Create submission record with text transcript
    const submission = await prisma.submission.create({
      data: {
        employeeId: user.id,
        workDate: workDate ? new Date(workDate) : new Date(),
        audioUrl: null,
        transcript: transcript.trim(),
        aiRawResponse: null,
        totalHours: null,
        status: "processing",
      },
    });

    return NextResponse.json({
      transcript: submission.transcript,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Submission creation error:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

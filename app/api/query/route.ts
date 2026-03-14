import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === "field") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { question } = await request.json();
    if (!question) {
      return NextResponse.json({ error: "No question" }, { status: 400 });
    }

    // Get schema context for AI
    const jobCount = await prisma.job.count();
    const entryCount = await prisma.timeEntry.count();
    const employeeCount = await prisma.employee.count();

    const systemPrompt = `You are a query generator for a timecard database. Generate a helpful query to answer the user's question using the Prisma API or explain the data structure.

DATABASE SCHEMA:
- TimeEntry: id, employeeId, workDate, jobId, costCodeId, hours, description, quantity, unit, crewMembers, notes, aiConfidence, isFlagged, flagReason, status, submissionId, createdAt
- Submission: id, employeeId, workDate, audioUrl, transcript, aiRawResponse, totalHours, status, submittedAt, approvedAt, approvedBy, createdAt
- Employee: id, name, email, phone, role, hourlyRate, isActive, createdAt
- Job: id, foundationJobId, name, shortName, status, isPrevailingWage, state, address, pmId, createdAt, syncedAt
- CostCode: id, code, description, category, acceptsLabor, acceptsMaterial, acceptsSub, isActive
- JobCostCode: id, jobId, costCodeId, budgetedLabor, budgetedMaterial, budgetedSub, budgetedHours, syncedAt

STATS: ${jobCount} jobs, ${entryCount} time entries, ${employeeCount} employees.

Rules:
1. Generate ONLY SELECT queries. Never UPDATE/DELETE/INSERT.
2. Use proper relationships between models.
3. Return a JSON object: {"description": "...", "query": "..."}
4. Keep queries simple and readable.`;

    const aiResponse = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const content = aiResponse.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ answer: "Could not generate query" });
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ answer: content.text });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // For now, return the parsed suggestion as we can't execute arbitrary Prisma queries safely
    const rows = [];
    let answer = parsed.description || parsed.query || "Query generated. Please implement using Prisma client.";
    answer += "\n\nGenerated query structure: " + (parsed.query || "");

    return NextResponse.json({ answer, rowCount: rows.length });
  } catch (error) {
    console.error("Query error:", error);
    const message = error instanceof Error ? error.message : "Query failed";
    return NextResponse.json({ answer: `Error: ${message}` }, { status: 200 });
  }
}

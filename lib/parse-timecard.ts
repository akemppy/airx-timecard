import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import type { AIParseResult } from "@/types";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function parseTimecard(
  transcript: string,
  employeeId: string
): Promise<AIParseResult> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const activeJobs = await prisma.job.findMany({
    where: { status: "active" },
    select: {
      id: true,
      foundationJobId: true,
      name: true,
      shortName: true,
      state: true,
      isPrevailingWage: true,
      address: true,
    },
  });

  const allCostCodes = await prisma.costCode.findMany({
    where: { isActive: true },
  });

  const allEmployees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  // Get cost codes budgeted for each job
  const jobCostCodeData = await prisma.jobCostCode.findMany({
    include: {
      costCode: {
        select: { code: true, description: true },
      },
    },
  });

  const jobToBudgetedCodes = new Map<string, Array<{ code: string; description: string }>>();
  for (const row of jobCostCodeData) {
    if (!jobToBudgetedCodes.has(row.jobId)) {
      jobToBudgetedCodes.set(row.jobId, []);
    }
    jobToBudgetedCodes.get(row.jobId)?.push({
      code: row.costCode.code,
      description: row.costCode.description,
    });
  }

  const jobsContext = activeJobs
    .map(
      (j) => {
        const budgetedCodes = jobToBudgetedCodes.get(j.id) || [];
        const budgetedCodesStr = budgetedCodes.length > 0
          ? budgetedCodes.map((jc) => `${jc.code} ${jc.description}`).join(", ")
          : "None specified";
        return `- Job #${j.foundationJobId} "${j.name}" (short: ${j.shortName || j.name}) | State: ${j.state || "WA"} | PW: ${j.isPrevailingWage} | Address: ${j.address || "N/A"}\n  Budgeted codes: ${budgetedCodesStr}`;
      }
    )
    .join("\n");

  const costCodesContext = allCostCodes
    .map((c) => `${c.code}: ${c.description} (${c.category})`)
    .join("\n");

  const employeeContext = allEmployees
    .map((e) => `${e.name} (ID: ${e.id})`)
    .join(", ");

  const systemPrompt = `You are a timecard parser for AirX LLC, a commercial HVAC contractor.
Parse the worker's voice memo into structured time entries.

CONTEXT:
- Employee: ${employee.name}
- Active jobs:
${jobsContext}
- Master cost code list:
${costCodesContext}
- Employee roster: ${employeeContext}

PREVAILING WAGE RULES:
- Each job has: state (WA/OR/ID) and is_prevailing_wage (true/false)
- Drive time codes depend on PW status:
    WA + PW = 5500 | OR = 5555 | WA + non-PW = 5599
- On PW jobs, drive time IS paid work time and must be tracked separately
- On PW jobs, lunch breaks must NOT be included in hours
- On PW jobs, overtime rules apply (>8hrs/day or >40hrs/week in WA)
- Flag any PW job entry where total hours seem inconsistent with start/end times mentioned

RULES:
1. Use YOUR judgment to match jobs, cost codes, crew, and tasks. No hardcoded rules.
2. Match the job using whatever info the worker gave (name, address, nickname, etc.)
3. Assign cost codes based on the ACTUAL WORK described. Pick the best match.
4. Select the correct drive time code based on job state + PW status.
5. Split hours proportionally if multiple tasks described.
6. Extract quantities with units when mentioned (LF, EA, etc.).
7. Match crew members to the employee list (fuzzy match on names).
8. Flag anything you're not confident about (confidence < 0.8).
9. Total hours MUST equal the worker's stated day.
10. PREFER cost codes budgeted for this job. If a task doesn't match any budgeted code, flag it.
11. DO NOT use hardcoded keyword-to-code mappings. Use reasoning.

RESPOND with ONLY a JSON object in this exact format:
{
  "entries": [
    {
      "jobFoundationId": "25107",
      "jobName": "Echo Glen",
      "costCode": "2323",
      "costCodeDescription": "Refrigeration Piping",
      "task": "Ran lineset",
      "hours": 4.0,
      "quantity": 50,
      "unit": "LF",
      "crewMembers": ["Jake", "Marcus"],
      "notes": "3/4\\" for 12K Mitsubishi, 2nd floor",
      "confidence": 0.95,
      "flagReason": null
    }
  ],
  "totalHours": 9.0,
  "warnings": []
}`;

  const response = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: transcript }],
    system: systemPrompt,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Map foundation job IDs to actual UUIDs
  const entries = await Promise.all(
    parsed.entries.map(
      async (entry: {
        jobFoundationId: string;
        jobName: string;
        costCode: string;
        costCodeDescription: string;
        task: string;
        hours: number;
        quantity?: number;
        unit?: string;
        crewMembers?: string[];
        notes?: string;
        confidence: number;
        flagReason?: string | null;
      }) => {
        const job = activeJobs.find(
          (j) => j.foundationJobId === entry.jobFoundationId
        );
        const costCode = allCostCodes.find((c) => c.code === entry.costCode);

        return {
          jobId: job?.id || "",
          jobName: entry.jobName,
          costCode: entry.costCode,
          costCodeDescription:
            entry.costCodeDescription || costCode?.description || "",
          task: entry.task,
          hours: entry.hours,
          quantity: entry.quantity,
          unit: entry.unit,
          crewMembers: entry.crewMembers || [],
          notes: entry.notes,
          confidence: entry.confidence,
          flagReason: entry.flagReason || undefined,
        };
      }
    )
  );

  return {
    entries,
    totalHours: parsed.totalHours,
    warnings: parsed.warnings || [],
  };
}

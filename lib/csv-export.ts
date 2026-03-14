import { prisma } from "./db";

interface ExportFilters {
  from?: string;
  to?: string;
  jobId?: string;
  employeeId?: string;
  status?: string;
}

export async function exportTimecardsCsv(filters: ExportFilters): Promise<string> {
  const whereConditions: Record<string, any> = {};

  if (filters.from || filters.to) {
    whereConditions.workDate = {};
    if (filters.from) {
      whereConditions.workDate.gte = new Date(filters.from);
    }
    if (filters.to) {
      whereConditions.workDate.lte = new Date(filters.to);
    }
  }
  if (filters.jobId) {
    whereConditions.jobId = filters.jobId;
  }
  if (filters.employeeId) {
    whereConditions.employeeId = filters.employeeId;
  }
  if (filters.status) {
    whereConditions.status = filters.status;
  }

  const entries = await prisma.timeEntry.findMany({
    where: whereConditions,
    include: {
      employee: true,
      job: true,
      costCode: true,
    },
    orderBy: [{ workDate: 'asc' }, { employee: { name: 'asc' } }],
  });

  const formattedEntries = entries.map((e) => ({
    id: e.id,
    employeeName: e.employee.name,
    workDate: e.workDate,
    foundationJobId: e.job.foundationJobId,
    jobName: e.job.name,
    costCode: e.costCode.code,
    costCodeDesc: e.costCode.description,
    description: e.description,
    hours: e.hours,
    quantity: e.quantity,
    unit: e.unit,
    notes: e.notes,
    status: e.status,
  }));

  const header = "Employee,Date,Job #,Job Name,Cost Code,Description,Hours,Quantity,Unit,Notes,Status";
  const rows = formattedEntries.map((e) =>
    [
      csvEscape(e.employeeName),
      new Date(e.workDate).toISOString().split("T")[0],
      csvEscape(e.foundationJobId),
      csvEscape(e.jobName),
      `${e.costCode} ${e.costCodeDesc}`,
      csvEscape(e.description),
      e.hours.toString(),
      e.quantity?.toString() || "",
      e.unit || "",
      csvEscape(e.notes || ""),
      e.status,
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

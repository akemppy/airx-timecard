export interface Employee {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: "field" | "pm" | "admin";
  hourlyRate?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  foundationJobId: string;
  name: string;
  shortName?: string | null;
  status: "active" | "complete" | "warranty";
  isPrevailingWage: boolean;
  state?: string | null;
  address?: string | null;
  pmId?: string | null;
  createdAt: string;
  syncedAt?: string | null;
}

export interface CostCode {
  id: string;
  code: string;
  description: string;
  category: "hvac" | "general" | "drive_time" | "gl" | "special";
  acceptsLabor: boolean;
  acceptsMaterial: boolean;
  acceptsSub: boolean;
  isActive: boolean;
}

export interface JobCostCode {
  id: string;
  jobId: string;
  costCodeId: string;
  costCode?: CostCode;
  budgetedLabor?: number | null;
  budgetedMaterial?: number | null;
  budgetedSub?: number | null;
  budgetedHours?: number | null;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  workDate: string;
  jobId: string;
  job?: Job;
  costCodeId: string;
  costCode?: CostCode;
  hours: number;
  description: string;
  quantity?: number | null;
  unit?: string | null;
  crewMembers: string[];
  notes?: string | null;
  aiConfidence?: number | null;
  isFlagged: boolean;
  flagReason?: string | null;
  status: "draft" | "submitted" | "approved" | "exported";
  submissionId?: string | null;
  createdAt: string;
}

export interface Submission {
  id: string;
  employeeId: string;
  employee?: Employee;
  workDate: string;
  audioUrl?: string | null;
  transcript?: string | null;
  aiRawResponse?: unknown;
  totalHours?: number | null;
  status: "processing" | "review" | "submitted" | "approved";
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  timeEntries?: TimeEntry[];
}

// AI pipeline types
export interface ParsedTimeEntry {
  jobId: string;
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
  flagReason?: string;
}

export interface AIParseResult {
  entries: ParsedTimeEntry[];
  totalHours: number;
  warnings?: string[];
}

export interface TranscribeResult {
  transcript: string;
  submissionId: string;
  audioUrl: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: "field" | "pm" | "admin";
}

export interface DashboardSummary {
  totalSubmissions: number;
  totalEmployees: number;
  submittedToday: number;
  pendingReview: number;
  flaggedEntries: number;
  recentSubmissions: (Submission & { employee: Employee })[];
  missingWorkers: Employee[];
}

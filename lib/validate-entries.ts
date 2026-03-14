import type { ParsedTimeEntry } from "@/types";

interface ValidationResult {
  entries: ParsedTimeEntry[];
  warnings: string[];
}

export function validateEntries(
  entries: ParsedTimeEntry[],
  totalHours: number
): ValidationResult {
  const warnings: string[] = [];

  // Check total hours are reasonable
  if (totalHours < 4) {
    warnings.push(`Total hours (${totalHours}) seems low. Verify this is correct.`);
  }
  if (totalHours > 14) {
    warnings.push(`Total hours (${totalHours}) seems high. Verify this is correct.`);
  }

  // Check for entries with no job match
  for (const entry of entries) {
    if (!entry.jobId) {
      entry.confidence = Math.min(entry.confidence, 0.5);
      entry.flagReason = entry.flagReason || "Could not match job from transcript";
    }
  }

  // Flag low confidence entries
  for (const entry of entries) {
    if (entry.confidence < 0.8) {
      warnings.push(
        `"${entry.task}" (${entry.costCode}) flagged: ${entry.flagReason || "Low confidence"}`
      );
    }
  }

  // Check for duplicate cost code + task combos
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.jobId}-${entry.costCode}-${entry.task}`;
    if (seen.has(key)) {
      warnings.push(`Possible duplicate entry: ${entry.costCode} - ${entry.task}`);
    }
    seen.add(key);
  }

  // Verify hours sum
  const sum = entries.reduce((acc, e) => acc + e.hours, 0);
  if (Math.abs(sum - totalHours) > 0.25) {
    warnings.push(
      `Entry hours (${sum}) don't match total (${totalHours}). Check split.`
    );
  }

  return { entries, warnings };
}

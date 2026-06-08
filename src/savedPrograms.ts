export type ProgramProfileBucket = "Developmental" | "Capacity-Limited" | "Transfer-Limited" | "Foundational" | "Complete";

export type ProgramWeeklyStructure = "2-Day Split" | "3-Day Split" | "4-Day Split";

export type SavedProgramStatus = "Draft" | "Assigned" | "Completed" | "Archived";

export type SavedProgramCreatedFrom = "Profile Handoff" | "Manual Build" | "Imported JSON" | "Duplicate";

export type SavedProgram = {
  id: string;
  athleteId?: string;
  athleteName: string;
  sourceReportId?: string;
  sourceProfileBucket?: ProgramProfileBucket;
  sourcePrimaryLimiter?: string;
  sourceSecondaryLimiter?: string;
  programName: string;
  weeklyStructure: ProgramWeeklyStructure;
  status: SavedProgramStatus;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  completedAt?: string;
  createdFrom: SavedProgramCreatedFrom;
  programJson: Record<string, unknown>;
  notes?: string;
};

export type CompletedProgramArtifact = {
  id: string;
  savedProgramId: string;
  athleteId?: string;
  week?: number;
  day?: number;
  fileUrl?: string;
  fileName?: string;
  uploadedAt: string;
  extractionStatus?: "Not Started" | "Pending Review" | "Confirmed" | "Rejected";
};

export const savedProgramMessageType = "peaq-build:saved-program";

export type SavedProgramMessage = {
  type: typeof savedProgramMessageType;
  savedProgram: SavedProgram;
};

const profileBuckets: ProgramProfileBucket[] = ["Developmental", "Capacity-Limited", "Transfer-Limited", "Foundational", "Complete"];
const weeklyStructures: ProgramWeeklyStructure[] = ["2-Day Split", "3-Day Split", "4-Day Split"];
const statuses: SavedProgramStatus[] = ["Draft", "Assigned", "Completed", "Archived"];
const createdFromOptions: SavedProgramCreatedFrom[] = ["Profile Handoff", "Manual Build", "Imported JSON", "Duplicate"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalString(value: unknown): string | undefined {
  const cleanValue = stringValue(value).trim();
  return cleanValue || undefined;
}

function normalizedDate(value: unknown, fallback: string): string {
  const cleanValue = stringValue(value).trim();
  return cleanValue || fallback;
}

function normalizeProfileBucket(value: unknown): ProgramProfileBucket | undefined {
  return profileBuckets.includes(value as ProgramProfileBucket) ? value as ProgramProfileBucket : undefined;
}

function normalizeWeeklyStructure(value: unknown): ProgramWeeklyStructure {
  return weeklyStructures.includes(value as ProgramWeeklyStructure) ? value as ProgramWeeklyStructure : "3-Day Split";
}

function normalizeStatus(value: unknown): SavedProgramStatus {
  return statuses.includes(value as SavedProgramStatus) ? value as SavedProgramStatus : "Draft";
}

function normalizeCreatedFrom(value: unknown): SavedProgramCreatedFrom {
  return createdFromOptions.includes(value as SavedProgramCreatedFrom) ? value as SavedProgramCreatedFrom : "Manual Build";
}

function getProgramName(programJson: Record<string, unknown>, fallbackAthleteName: string): string {
  return stringValue(programJson.program).trim()
    || stringValue(programJson.athleteProgram).trim()
    || (fallbackAthleteName ? `${fallbackAthleteName} Program` : "Untitled Program");
}

export function normalizeSavedProgram(value: unknown): SavedProgram | null {
  if (!isRecord(value)) return null;

  const programJson = isRecord(value.programJson) ? value.programJson : null;
  if (!programJson) return null;

  const now = new Date().toISOString();
  const athleteName = stringValue(value.athleteName).trim() || stringValue(programJson.athlete).trim() || "Athlete";
  const id = stringValue(value.id).trim();

  if (!id) return null;

  return {
    id,
    athleteId: optionalString(value.athleteId),
    athleteName,
    sourceReportId: optionalString(value.sourceReportId),
    sourceProfileBucket: normalizeProfileBucket(value.sourceProfileBucket),
    sourcePrimaryLimiter: optionalString(value.sourcePrimaryLimiter),
    sourceSecondaryLimiter: optionalString(value.sourceSecondaryLimiter),
    programName: stringValue(value.programName).trim() || getProgramName(programJson, athleteName),
    weeklyStructure: normalizeWeeklyStructure(value.weeklyStructure || programJson.weeklyStructure),
    status: normalizeStatus(value.status),
    createdAt: normalizedDate(value.createdAt, now),
    updatedAt: normalizedDate(value.updatedAt, now),
    assignedAt: optionalString(value.assignedAt),
    completedAt: optionalString(value.completedAt),
    createdFrom: normalizeCreatedFrom(value.createdFrom),
    programJson,
    notes: optionalString(value.notes),
  };
}

export function normalizeSavedPrograms(value: unknown): SavedProgram[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeSavedProgram)
    .filter((program): program is SavedProgram => Boolean(program))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertSavedProgram(programs: SavedProgram[], savedProgram: SavedProgram): SavedProgram[] {
  const existingIndex = programs.findIndex((program) => program.id === savedProgram.id);
  const nextPrograms = existingIndex >= 0
    ? programs.map((program, index) => index === existingIndex ? savedProgram : program)
    : [savedProgram, ...programs];

  return nextPrograms.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function formatProgramDate(value: string | undefined): string {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

import { supabaseFetch, type SupabaseSession } from "./supabaseClient";
import type { ProgramWeeklyStructure } from "./savedPrograms";

export type ProgramAssignmentStatus = "draft" | "assigned" | "in_progress" | "completed" | "reviewed" | "archived";

export type ProgramCompletionStatus = "completed" | "modified" | "missed" | "partial";

export interface ProgramAssignment {
  id: string;
  coachId: string;
  athleteId: string;
  cloudAthleteId?: string;
  templateId?: string;
  assignmentName: string;
  phaseName?: string;
  weeklyStructure: ProgramWeeklyStructure;
  startDate?: string;
  endDate?: string;
  status: ProgramAssignmentStatus;
  programJson: Record<string, unknown>;
  coachNotes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ProgramCompletionLog {
  id: string;
  assignmentId: string;
  athleteId: string;
  coachId: string;
  sessionIndex: number;
  sessionName?: string;
  exerciseId?: string;
  exerciseName: string;
  plannedJson?: Record<string, unknown>;
  completedJson?: Record<string, unknown>;
  status: ProgramCompletionStatus;
  rpe?: number;
  painFlag: boolean;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateProgramAssignmentInput = {
  athleteId: string;
  templateId?: string;
  assignmentName: string;
  phaseName?: string;
  weeklyStructure: ProgramWeeklyStructure;
  startDate?: string;
  endDate?: string;
  status?: ProgramAssignmentStatus;
  programJson: Record<string, unknown>;
  coachNotes?: string;
};

export type UpdateProgramAssignmentInput = Partial<Omit<CreateProgramAssignmentInput, "athleteId"> & {
  archivedAt: string;
}>;

export type CreateProgramCompletionLogInput = {
  assignmentId: string;
  athleteId: string;
  sessionIndex: number;
  sessionName?: string;
  exerciseId?: string;
  exerciseName: string;
  plannedJson?: Record<string, unknown>;
  completedJson?: Record<string, unknown>;
  status: ProgramCompletionStatus;
  rpe?: number;
  painFlag?: boolean;
  notes?: string;
  completedAt?: string;
};

export type UpdateProgramCompletionLogInput = Partial<Omit<CreateProgramCompletionLogInput, "assignmentId" | "athleteId">>;

type RawAssignmentRow = {
  id?: string | null;
  coach_id?: string | null;
  athlete_id?: string | null;
  template_id?: string | null;
  assignment_name?: string | null;
  phase_name?: string | null;
  weekly_structure?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  program_json?: unknown;
  coach_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  archived_at?: string | null;
};

type RawCompletionLogRow = {
  id?: string | null;
  assignment_id?: string | null;
  athlete_id?: string | null;
  coach_id?: string | null;
  session_index?: number | null;
  session_name?: string | null;
  exercise_id?: string | null;
  exercise_name?: string | null;
  planned_json?: unknown;
  completed_json?: unknown;
  status?: string | null;
  rpe?: number | null;
  pain_flag?: boolean | null;
  notes?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const weeklyStructures: ProgramWeeklyStructure[] = ["2-Day Split", "3-Day Split", "4-Day Split"];
const assignmentStatuses: ProgramAssignmentStatus[] = ["draft", "assigned", "in_progress", "completed", "reviewed", "archived"];
const completionStatuses: ProgramCompletionStatus[] = ["completed", "modified", "missed", "partial"];
const assignmentSelect = "id,coach_id,athlete_id,template_id,assignment_name,phase_name,weekly_structure,start_date,end_date,status,program_json,coach_notes,created_at,updated_at,archived_at";
const completionLogSelect = "id,assignment_id,athlete_id,coach_id,session_index,session_name,exercise_id,exercise_name,planned_json,completed_json,status,rpe,pain_flag,notes,completed_at,created_at,updated_at";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown): string | undefined {
  return stringValue(value) || undefined;
}

function optionalJson(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeWeeklyStructure(value: unknown): ProgramWeeklyStructure {
  return weeklyStructures.includes(value as ProgramWeeklyStructure) ? value as ProgramWeeklyStructure : "3-Day Split";
}

function normalizeAssignmentStatus(value: unknown): ProgramAssignmentStatus {
  return assignmentStatuses.includes(value as ProgramAssignmentStatus) ? value as ProgramAssignmentStatus : "draft";
}

function normalizeCompletionStatus(value: unknown): ProgramCompletionStatus {
  return completionStatuses.includes(value as ProgramCompletionStatus) ? value as ProgramCompletionStatus : "completed";
}

export function normalizeProgramAssignment(value: unknown): ProgramAssignment | null {
  const row = value as RawAssignmentRow;
  const assignment = value as Partial<ProgramAssignment>;
  if (!row || typeof row !== "object") return null;

  const id = stringValue(row.id || assignment.id);
  const coachId = stringValue(row.coach_id || assignment.coachId);
  const athleteId = stringValue(row.athlete_id || assignment.athleteId);
  const assignmentName = stringValue(row.assignment_name || assignment.assignmentName);
  const programJson = optionalJson(row.program_json) || optionalJson(assignment.programJson);

  if (!id || !coachId || !athleteId || !assignmentName || !programJson) return null;

  return {
    id,
    coachId,
    athleteId,
    cloudAthleteId: optionalString(assignment.cloudAthleteId),
    templateId: optionalString(row.template_id || assignment.templateId),
    assignmentName,
    phaseName: optionalString(row.phase_name || assignment.phaseName),
    weeklyStructure: normalizeWeeklyStructure(row.weekly_structure || assignment.weeklyStructure),
    startDate: optionalString(row.start_date || assignment.startDate),
    endDate: optionalString(row.end_date || assignment.endDate),
    status: normalizeAssignmentStatus(row.status || assignment.status),
    programJson,
    coachNotes: optionalString(row.coach_notes || assignment.coachNotes),
    createdAt: stringValue(row.created_at || assignment.createdAt) || new Date().toISOString(),
    updatedAt: stringValue(row.updated_at || assignment.updatedAt) || new Date().toISOString(),
    archivedAt: optionalString(row.archived_at || assignment.archivedAt),
  };
}

export function normalizeProgramAssignments(value: unknown): ProgramAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeProgramAssignment)
    .filter((assignment): assignment is ProgramAssignment => Boolean(assignment))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function normalizeProgramCompletionLog(value: unknown): ProgramCompletionLog | null {
  const row = value as RawCompletionLogRow;
  const completionLog = value as Partial<ProgramCompletionLog>;
  if (!row || typeof row !== "object") return null;

  const id = stringValue(row.id || completionLog.id);
  const assignmentId = stringValue(row.assignment_id || completionLog.assignmentId);
  const athleteId = stringValue(row.athlete_id || completionLog.athleteId);
  const coachId = stringValue(row.coach_id || completionLog.coachId);
  const exerciseName = stringValue(row.exercise_name || completionLog.exerciseName);
  const sessionIndex = optionalNumber(row.session_index ?? completionLog.sessionIndex);

  if (!id || !assignmentId || !athleteId || !coachId || !exerciseName || sessionIndex === undefined) return null;

  return {
    id,
    assignmentId,
    athleteId,
    coachId,
    sessionIndex,
    sessionName: optionalString(row.session_name || completionLog.sessionName),
    exerciseId: optionalString(row.exercise_id || completionLog.exerciseId),
    exerciseName,
    plannedJson: optionalJson(row.planned_json) || optionalJson(completionLog.plannedJson),
    completedJson: optionalJson(row.completed_json) || optionalJson(completionLog.completedJson),
    status: normalizeCompletionStatus(row.status || completionLog.status),
    rpe: optionalNumber(row.rpe ?? completionLog.rpe),
    painFlag: row.pain_flag === true || completionLog.painFlag === true,
    notes: optionalString(row.notes || completionLog.notes),
    completedAt: optionalString(row.completed_at || completionLog.completedAt),
    createdAt: stringValue(row.created_at || completionLog.createdAt) || new Date().toISOString(),
    updatedAt: stringValue(row.updated_at || completionLog.updatedAt) || new Date().toISOString(),
  };
}

export function isMissingProgramAssignmentFoundationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  return (message.includes("program_assignments") || message.includes("program_completion_logs"))
    && (message.includes("does not exist") || message.includes("schema cache"));
}

function toAssignmentRow(session: SupabaseSession, input: CreateProgramAssignmentInput): Record<string, unknown> {
  return {
    athlete_id: input.athleteId,
    coach_id: session.user.id,
    template_id: input.templateId || null,
    assignment_name: input.assignmentName.trim() || "Untitled Assignment",
    phase_name: input.phaseName?.trim() || null,
    weekly_structure: input.weeklyStructure,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    status: input.status || "draft",
    program_json: input.programJson,
    coach_notes: input.coachNotes?.trim() || null,
    archived_at: null,
  };
}

function toAssignmentUpdateRow(updates: UpdateProgramAssignmentInput): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.assignmentName !== undefined) row.assignment_name = updates.assignmentName.trim() || "Untitled Assignment";
  if (updates.phaseName !== undefined) row.phase_name = updates.phaseName.trim() || null;
  if (updates.weeklyStructure !== undefined) row.weekly_structure = updates.weeklyStructure;
  if (updates.startDate !== undefined) row.start_date = updates.startDate || null;
  if (updates.endDate !== undefined) row.end_date = updates.endDate || null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.programJson !== undefined) row.program_json = updates.programJson;
  if (updates.coachNotes !== undefined) row.coach_notes = updates.coachNotes.trim() || null;
  if (updates.archivedAt !== undefined) row.archived_at = updates.archivedAt || null;
  return row;
}

function normalizeAssignmentResponse(rows: RawAssignmentRow[], fallback: string): ProgramAssignment {
  const assignment = normalizeProgramAssignment(rows[0]);
  if (!assignment) throw new Error(fallback);
  return assignment;
}

export async function createProgramAssignment(session: SupabaseSession, input: CreateProgramAssignmentInput): Promise<ProgramAssignment> {
  const rows = await supabaseFetch<RawAssignmentRow[]>(`/rest/v1/program_assignments?select=${assignmentSelect}`, {
    method: "POST",
    accessToken: session.accessToken,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(toAssignmentRow(session, input)),
  });
  return normalizeAssignmentResponse(rows, "Program assignment was saved but could not be loaded.");
}

export async function getProgramAssignmentsForAthlete(session: SupabaseSession, athleteId: string): Promise<ProgramAssignment[]> {
  const params = new URLSearchParams();
  params.set("select", assignmentSelect);
  params.set("coach_id", `eq.${session.user.id}`);
  params.set("athlete_id", `eq.${athleteId}`);
  params.set("order", "updated_at.desc");

  const rows = await supabaseFetch<RawAssignmentRow[]>(`/rest/v1/program_assignments?${params.toString()}`, {
    accessToken: session.accessToken,
  });
  return normalizeProgramAssignments(rows);
}

export async function getProgramAssignmentsForCoach(session: SupabaseSession): Promise<ProgramAssignment[]> {
  const params = new URLSearchParams();
  params.set("select", assignmentSelect);
  params.set("coach_id", `eq.${session.user.id}`);
  params.set("order", "updated_at.desc");

  const rows = await supabaseFetch<RawAssignmentRow[]>(`/rest/v1/program_assignments?${params.toString()}`, {
    accessToken: session.accessToken,
  });
  return normalizeProgramAssignments(rows);
}

export async function getProgramAssignmentById(session: SupabaseSession, assignmentId: string): Promise<ProgramAssignment | null> {
  const rows = await supabaseFetch<RawAssignmentRow[]>(`/rest/v1/program_assignments?select=${assignmentSelect}&id=eq.${assignmentId}&coach_id=eq.${session.user.id}&limit=1`, {
    accessToken: session.accessToken,
  });
  return normalizeProgramAssignment(rows[0]);
}

export async function updateProgramAssignment(session: SupabaseSession, assignmentId: string, updates: UpdateProgramAssignmentInput): Promise<ProgramAssignment> {
  const rows = await supabaseFetch<RawAssignmentRow[]>(`/rest/v1/program_assignments?id=eq.${assignmentId}&coach_id=eq.${session.user.id}&select=${assignmentSelect}`, {
    method: "PATCH",
    accessToken: session.accessToken,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(toAssignmentUpdateRow(updates)),
  });
  return normalizeAssignmentResponse(rows, "Program assignment was updated but could not be loaded.");
}

export async function archiveProgramAssignment(session: SupabaseSession, assignmentId: string): Promise<ProgramAssignment> {
  return updateProgramAssignment(session, assignmentId, {
    status: "archived",
    archivedAt: new Date().toISOString(),
  });
}

export async function duplicateProgramAssignment(session: SupabaseSession, assignmentId: string): Promise<ProgramAssignment> {
  const assignment = await getProgramAssignmentById(session, assignmentId);
  if (!assignment) throw new Error("Program assignment could not be found.");
  return createProgramAssignment(session, {
    athleteId: assignment.athleteId,
    templateId: assignment.templateId,
    assignmentName: `${assignment.assignmentName} Copy`,
    phaseName: assignment.phaseName,
    weeklyStructure: assignment.weeklyStructure,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    status: "draft",
    programJson: assignment.programJson,
    coachNotes: assignment.coachNotes,
  });
}

export function duplicateProgramAssignmentLocal(assignment: ProgramAssignment): ProgramAssignment {
  const now = new Date().toISOString();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `assignment-${Date.now()}`;
  return {
    ...assignment,
    id,
    assignmentName: `${assignment.assignmentName} Copy`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    archivedAt: undefined,
  };
}

export function archiveProgramAssignmentLocal(assignment: ProgramAssignment): ProgramAssignment {
  const now = new Date().toISOString();
  return {
    ...assignment,
    status: "archived",
    archivedAt: now,
    updatedAt: now,
  };
}

export function upsertProgramAssignment(assignments: ProgramAssignment[], assignment: ProgramAssignment): ProgramAssignment[] {
  const existingIndex = assignments.findIndex((item) => item.id === assignment.id);
  const nextAssignments = existingIndex >= 0
    ? assignments.map((item, index) => index === existingIndex ? assignment : item)
    : [assignment, ...assignments];

  return nextAssignments.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createProgramCompletionLog(session: SupabaseSession, input: CreateProgramCompletionLogInput): Promise<ProgramCompletionLog> {
  const rows = await supabaseFetch<RawCompletionLogRow[]>(`/rest/v1/program_completion_logs?select=${completionLogSelect}`, {
    method: "POST",
    accessToken: session.accessToken,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      assignment_id: input.assignmentId,
      athlete_id: input.athleteId,
      coach_id: session.user.id,
      session_index: input.sessionIndex,
      session_name: input.sessionName || null,
      exercise_id: input.exerciseId || null,
      exercise_name: input.exerciseName,
      planned_json: input.plannedJson || null,
      completed_json: input.completedJson || null,
      status: input.status,
      rpe: input.rpe ?? null,
      pain_flag: input.painFlag ?? false,
      notes: input.notes || null,
      completed_at: input.completedAt || null,
    }),
  });
  const log = normalizeProgramCompletionLog(rows[0]);
  if (!log) throw new Error("Completion log was saved but could not be loaded.");
  return log;
}

export async function getCompletionLogsForAssignment(session: SupabaseSession, assignmentId: string): Promise<ProgramCompletionLog[]> {
  const params = new URLSearchParams();
  params.set("select", completionLogSelect);
  params.set("assignment_id", `eq.${assignmentId}`);
  params.set("coach_id", `eq.${session.user.id}`);
  params.set("order", "session_index.asc");

  const rows = await supabaseFetch<RawCompletionLogRow[]>(`/rest/v1/program_completion_logs?${params.toString()}`, {
    accessToken: session.accessToken,
  });
  return rows
    .map(normalizeProgramCompletionLog)
    .filter((log): log is ProgramCompletionLog => Boolean(log));
}

export async function updateProgramCompletionLog(session: SupabaseSession, logId: string, updates: UpdateProgramCompletionLogInput): Promise<ProgramCompletionLog> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.sessionIndex !== undefined) row.session_index = updates.sessionIndex;
  if (updates.sessionName !== undefined) row.session_name = updates.sessionName || null;
  if (updates.exerciseId !== undefined) row.exercise_id = updates.exerciseId || null;
  if (updates.exerciseName !== undefined) row.exercise_name = updates.exerciseName;
  if (updates.plannedJson !== undefined) row.planned_json = updates.plannedJson || null;
  if (updates.completedJson !== undefined) row.completed_json = updates.completedJson || null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.rpe !== undefined) row.rpe = updates.rpe ?? null;
  if (updates.painFlag !== undefined) row.pain_flag = updates.painFlag;
  if (updates.notes !== undefined) row.notes = updates.notes || null;
  if (updates.completedAt !== undefined) row.completed_at = updates.completedAt || null;

  const rows = await supabaseFetch<RawCompletionLogRow[]>(`/rest/v1/program_completion_logs?id=eq.${logId}&coach_id=eq.${session.user.id}&select=${completionLogSelect}`, {
    method: "PATCH",
    accessToken: session.accessToken,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  const log = normalizeProgramCompletionLog(rows[0]);
  if (!log) throw new Error("Completion log was updated but could not be loaded.");
  return log;
}

import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  refreshSupabaseSession,
  sendPasswordReset,
  signInCoach,
  signOutCoach,
  signUpCoach,
  supabaseConfig,
  supabaseFetch,
  type SupabaseSession,
} from "./supabaseClient";

type Sex = "Male" | "Female";
type Direction = "lower" | "higher";
type MetricKey = "sprint10" | "drill505" | "codDeficit" | "cmjHeight" | "mRsi" | "relativeStrength";
type BucketKey = "athleticExpression" | "power" | "strength" | "efficiency";
type ComparisonKey = "overall" | "rating" | MetricKey | BucketKey;
type AthleteDataKey = "name" | "sex" | "date" | "dob" | "sport" | "position" | "height" | "bodyweight" | "sprint10" | "drill505" | "cmjHeight" | "mRsi" | "trapBarE1RM";
type NullableNumber = number | null;
type ViewName = "auth" | "workspace" | "guide" | "print" | "progress-print" | "builder" | "csv" | "athlete" | "saved-report";

type AthleteData = Record<AthleteDataKey, string>;

interface Standard {
  label: string;
  unit: string;
  direction: Direction;
  poor: number;
  elite: number;
}

type StandardsBySex = Record<Sex, Record<MetricKey, Standard>>;
type RawProfileMetrics = Record<MetricKey, NullableNumber>;
type ProfileScores = Record<MetricKey, NullableNumber>;

interface MetricItem {
  key: MetricKey;
  label: string;
  unit: string;
  value: NullableNumber;
  score: NullableNumber;
  display: string;
}

interface BucketItem {
  key: BucketKey;
  label: string;
  score: NullableNumber;
  status: string;
}

interface TrainingFocus {
  primary: string;
  secondary: string;
  maintain: string;
  bullets: string[];
}

interface Profile {
  sex: Sex;
  scores: ProfileScores;
  scoreList: MetricItem[];
  bucketItems: BucketItem[];
  overallScore: NullableNumber;
  archetype: string;
  status: string;
  summary: string;
  trainingDirection: string;
  primaryLimiter: string;
  secondaryLimiter: string;
  greenFlagOne: string;
  greenFlagTwo: string;
  strongestQuality: string;
  summaryStrength: string;
  rating: NullableNumber;
  raw: RawProfileMetrics & {
    bodyweight: NullableNumber;
    trapBarE1RM: NullableNumber;
  };
  trainingFocus: TrainingFocus;
}

type ProfileBase = Omit<Profile, "trainingFocus">;

interface SavedReport {
  id: string;
  savedAt: string;
  createdAt?: string | null;
  correctedAt?: string | null;
  correctionCount?: number;
  correctionHistory?: CorrectionSnapshot[];
  date: string;
  data: AthleteData;
  profile: Profile;
  archetype: string;
  status: string;
  primaryLimiter: string;
  secondaryLimiter: string;
  rating: NullableNumber;
  overall: NullableNumber;
}

interface CorrectionSnapshot {
  id: string;
  archivedAt: string;
  savedAt: string | null;
  correctedAt: string | null;
  correctionCount: number;
  date: string;
  data: AthleteData;
  profile: Profile;
  archetype: string;
  status: string;
  primaryLimiter: string;
  secondaryLimiter: string;
  rating: NullableNumber;
  overall: NullableNumber;
}

interface AthleteProfileRecord {
  id: string;
  name: string;
  dob: string;
  sex: string;
  sport: string;
  position: string;
  height: string;
  bodyweight: string;
  archivedAt: string | null;
  reports: SavedReport[];
}

interface CoachWorkspace {
  id: string;
  name: string;
  email: string;
  organization: string;
  athletes: AthleteProfileRecord[];
}

interface AthleteIdentity {
  name: string;
  dob: string;
  sex: string;
  sport: string;
  position: string;
}

interface AthleteMatchResult {
  status: "matched" | "new" | "ambiguous";
  athlete: AthleteProfileRecord | null;
  message: string;
}

interface ReportEntry {
  data: AthleteData;
  profile: Profile;
  preferredAthleteId: string | null;
}

interface AppHistoryState {
  view: ViewName;
  selectedAthleteId: string | null;
  selectedReportId: string | null;
}

interface ComparisonMetric {
  key: ComparisonKey;
  label: string;
  unit: string;
  direction: Direction;
  decimals: number;
}

interface ComparisonChange {
  label: string;
  tone: string;
  value: string;
}

interface ProgressRow {
  metric: ComparisonMetric;
  valueA: NullableNumber;
  valueB: NullableNumber;
  change: ComparisonChange;
}

interface CsvRow extends Partial<Record<AthleteDataKey, string>> {
  id: string;
  [key: string]: string | undefined;
}

interface ReviewedCsvRow {
  row: CsvRow;
  data: AthleteData;
  profile: Profile;
  upload: string;
  review: {
    status: string;
    message: string;
    canSave: boolean;
  };
  canSave: boolean;
}

interface CorrectionAuditField {
  key: string;
  label: string;
  getValue: (report: SavedReport | CorrectionSnapshot) => string | number | null | undefined;
}

interface CloudProfileRow {
  id: string;
  email: string | null;
  coach_name: string | null;
  organization: string | null;
}

interface CloudAthleteRow {
  id: string;
  client_id: string | null;
  name: string;
  dob: string | null;
  sex: string | null;
  sport: string | null;
  position: string | null;
  height: number | null;
  bodyweight: number | null;
  archived_at: string | null;
}

interface CloudReportRow {
  id: string;
  client_id: string | null;
  athlete_id: string;
  testing_date: string;
  raw_inputs: Partial<AthleteData> | null;
  calculated_profile: Profile | null;
  overall_score: number | null;
  profile_rating: number | null;
  archetype: string | null;
  status: string | null;
  primary_limiter: string | null;
  secondary_limiter: string | null;
  saved_at: string | null;
  corrected_at: string | null;
  correction_count: number | null;
  correction_history: CorrectionSnapshot[] | null;
}

const blankAthlete: AthleteData = {
  name: "",
  sex: "Male",
  date: new Date().toISOString().slice(0, 10),
  dob: "",
  sport: "Basketball",
  position: "",
  height: "",
  bodyweight: "",
  sprint10: "",
  drill505: "",
  cmjHeight: "",
  mRsi: "",
  trapBarE1RM: "",
};

const standards: StandardsBySex = {
  Male: {
    sprint10: { label: "10-Yard Sprint", unit: "sec", direction: "lower", poor: 1.95, elite: 1.5 },
    drill505: { label: "505 Drill", unit: "sec", direction: "lower", poor: 2.5, elite: 1.95 },
    codDeficit: { label: "COD Deficit", unit: "sec", direction: "lower", poor: 1.05, elite: 0.55 },
    cmjHeight: { label: "CMJ Height", unit: "in", direction: "higher", poor: 12, elite: 22 },
    mRsi: { label: "mRSI", unit: "", direction: "higher", poor: 0.4, elite: 0.75 },
    relativeStrength: { label: "Relative Strength", unit: "xBW", direction: "higher", poor: 1.25, elite: 2.25 },
  },
  Female: {
    sprint10: { label: "10-Yard Sprint", unit: "sec", direction: "lower", poor: 2.0, elite: 1.6 },
    drill505: { label: "505 Drill", unit: "sec", direction: "lower", poor: 2.7, elite: 2.1 },
    codDeficit: { label: "COD Deficit", unit: "sec", direction: "lower", poor: 1.05, elite: 0.55 },
    cmjHeight: { label: "CMJ Height", unit: "in", direction: "higher", poor: 8, elite: 16 },
    mRsi: { label: "mRSI", unit: "", direction: "higher", poor: 0.3, elite: 0.65 },
    relativeStrength: { label: "Relative Strength", unit: "xBW", direction: "higher", poor: 1.15, elite: 2.0 },
  },
};

const flagMap: Record<MetricKey, string> = {
  sprint10: "Acceleration",
  drill505: "COD",
  codDeficit: "COD Efficiency",
  cmjHeight: "Jump Output",
  mRsi: "Jump Efficiency",
  relativeStrength: "Strength Capacity",
};

const summaryStrengthMap: Partial<Record<MetricKey, string>> = {
  sprint10: "acceleration ability",
  drill505: "change of direction ability",
  cmjHeight: "jump output",
  mRsi: "jump efficiency",
  relativeStrength: "strength capacity",
};

const templateHeaders: AthleteDataKey[] = [
  "name",
  "sex",
  "date",
  "dob",
  "sport",
  "position",
  "height",
  "bodyweight",
  "sprint10",
  "drill505",
  "cmjHeight",
  "mRsi",
  "trapBarE1RM",
];

const coachStorageKey = "peaq-analytics-coach-workspace";
const supabaseSessionStorageKey = "peaq-analytics-supabase-session";

const brandAssets = {
  wordmark: "/assets/brand/peaq-name.png",
  wordmarkWhite: "/assets/brand/peaq-name-wht.png",
  symbol: "/assets/brand/peaq-symbol.png",
};

const comparisonMetrics: ComparisonMetric[] = [
  { key: "overall", label: "Overall Score", unit: "", direction: "higher", decimals: 0 },
  { key: "rating", label: "Profile Rating", unit: "stars", direction: "higher", decimals: 1 },
  { key: "sprint10", label: "10-Yard Sprint", unit: "sec", direction: "lower", decimals: 2 },
  { key: "drill505", label: "505 Drill", unit: "sec", direction: "lower", decimals: 2 },
  { key: "cmjHeight", label: "CMJ Height", unit: "in", direction: "higher", decimals: 1 },
  { key: "mRsi", label: "mRSI", unit: "", direction: "higher", decimals: 2 },
  { key: "relativeStrength", label: "Relative Strength", unit: "xBW", direction: "higher", decimals: 2 },
  { key: "athleticExpression", label: "Athletic Expression", unit: "", direction: "higher", decimals: 0 },
  { key: "power", label: "Power", unit: "", direction: "higher", decimals: 0 },
  { key: "strength", label: "Strength", unit: "", direction: "higher", decimals: 0 },
  { key: "efficiency", label: "Efficiency", unit: "", direction: "higher", decimals: 0 },
];

const progressMetricKeys: ComparisonKey[] = ["sprint10", "drill505", "cmjHeight", "mRsi", "relativeStrength"];
const progressBucketKeys: ComparisonKey[] = ["athleticExpression", "power", "strength", "efficiency"];

const correctionAuditFields: CorrectionAuditField[] = [
  { key: "name", label: "Athlete Name", getValue: (report) => report.data?.name },
  { key: "dob", label: "DOB", getValue: (report) => report.data?.dob },
  { key: "sex", label: "Sex", getValue: (report) => report.data?.sex },
  { key: "sport", label: "Sport", getValue: (report) => report.data?.sport },
  { key: "position", label: "Position", getValue: (report) => report.data?.position },
  { key: "height", label: "Height", getValue: (report) => report.data?.height ? `${report.data.height} in` : "" },
  { key: "bodyweight", label: "Body Weight", getValue: (report) => report.data?.bodyweight ? `${report.data.bodyweight} lb` : "" },
  { key: "date", label: "Testing Date", getValue: (report) => report.date || report.data?.date },
  { key: "sprint10", label: "10-Yard Sprint", getValue: (report) => report.data?.sprint10 ? `${report.data.sprint10} sec` : "" },
  { key: "drill505", label: "505 Drill", getValue: (report) => report.data?.drill505 ? `${report.data.drill505} sec` : "" },
  { key: "cmjHeight", label: "CMJ Height", getValue: (report) => report.data?.cmjHeight ? `${report.data.cmjHeight} in` : "" },
  { key: "mRsi", label: "mRSI", getValue: (report) => report.data?.mRsi },
  { key: "trapBarE1RM", label: "Trap Bar e1RM", getValue: (report) => report.data?.trapBarE1RM ? `${report.data.trapBarE1RM} lb` : "" },
  { key: "overall", label: "Overall Score", getValue: (report) => isFiniteNumber(report.overall) ? report.overall.toFixed(0) : "" },
  { key: "rating", label: "Profile Rating", getValue: (report) => isFiniteNumber(report.rating) ? `${report.rating.toFixed(1)} stars` : "" },
  { key: "archetype", label: "Archetype", getValue: (report) => report.archetype },
  { key: "status", label: "Status", getValue: (report) => report.status },
  { key: "primaryLimiter", label: "Primary Limiter", getValue: (report) => report.primaryLimiter },
  { key: "secondaryLimiter", label: "Secondary Limiter", getValue: (report) => report.secondaryLimiter },
];

const sortOptions = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "rating-desc", label: "Rating high to low" },
  { value: "rating-asc", label: "Rating low to high" },
  { value: "date-desc", label: "Most recent testing date" },
  { value: "date-asc", label: "Least recent testing date" },
];

const starRatingOptions = [
  { value: "all", label: "All" },
  { value: "4.5", label: "4.5+ Stars" },
  { value: "4.0", label: "4.0+ Stars" },
  { value: "3.5", label: "3.5+ Stars" },
  { value: "under-3.5", label: "Under 3.5 Stars" },
];

const archetypeGuide = [
  { title: "Complete Athlete", copy: "Elite across athletic expression, power, strength, and efficiency with no obvious primary limiter." },
  { title: "Foundational Profile", copy: "Solid foundational base, but needs to improve 1-2 categories to reach Complete Athlete status." },
  { title: "Capacity-Limited", copy: "Overall horsepower and capacity are limiting the ceiling of the rest of the profile." },
  { title: "Transfer-Limited", copy: "Capacity exists, but it is not showing up cleanly in athletic expression or efficiency." },
  { title: "Developmental", copy: "Multiple buckets need development, requiring a broad training emphasis." },
  { title: "Profile Pending", copy: "Not enough key testing numbers have been entered yet." },
];

function loadStoredCoach(): CoachWorkspace | null {
  if (typeof window === "undefined") return null;

  try {
    const storedCoach = window.localStorage.getItem(coachStorageKey);
    if (!storedCoach) return null;

    const parsedCoach = JSON.parse(storedCoach);
    return parsedCoach && Array.isArray(parsedCoach.athletes) ? normalizeCoachWorkspace(parsedCoach) : null;
  } catch {
    return null;
  }
}

function saveStoredCoach(coach: CoachWorkspace | null): void {
  if (typeof window === "undefined") return;

  try {
    if (coach) {
      window.localStorage.setItem(coachStorageKey, JSON.stringify(coach));
    } else {
      window.localStorage.removeItem(coachStorageKey);
    }
  } catch {
    // Keep the app usable if browser storage is unavailable.
  }
}

function loadStoredSupabaseSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;

  try {
    const storedSession = window.localStorage.getItem(supabaseSessionStorageKey);
    if (!storedSession) return null;
    const parsed = JSON.parse(storedSession) as Partial<SupabaseSession>;
    return parsed.accessToken && parsed.refreshToken && parsed.user?.id
      ? parsed as SupabaseSession
      : null;
  } catch {
    return null;
  }
}

function saveStoredSupabaseSession(session: SupabaseSession | null): void {
  if (typeof window === "undefined") return;

  try {
    if (session) {
      window.localStorage.setItem(supabaseSessionStorageKey, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(supabaseSessionStorageKey);
    }
  } catch {
    // Local session storage is best-effort; the app remains usable without it.
  }
}

function slugify(value: string | number | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeIdentity(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function getAthleteDob(athlete: Partial<AthleteProfileRecord> | null | undefined): string {
  const reportWithDob = athlete?.reports?.find((report) => report?.data?.dob);
  return String(athlete?.dob || reportWithDob?.data?.dob || "").trim();
}

function createUniqueAthleteIdFromParts(parts: Array<string | number | null | undefined>, usedIds: Set<string>): string {
  const base = `athlete-${slugify(parts.filter(Boolean).join("-")) || "profile"}`;
  let id = base;
  let count = 2;
  while (usedIds.has(id)) {
    id = `${base}-${count}`;
    count += 1;
  }
  usedIds.add(id);
  return id;
}

function createUniqueAthleteId(data: AthleteData, athletes: AthleteProfileRecord[]): string {
  const usedIds = new Set(athletes.map((athlete) => athlete.id));
  const dob = String(data.dob || "").trim();
  const parts = dob ? [data.name, dob] : [data.name, data.sex, data.sport, data.position];
  return createUniqueAthleteIdFromParts(parts, usedIds);
}

function normalizeAthleteProfile(athlete: Partial<AthleteProfileRecord>, index: number, usedIds: Set<string>): AthleteProfileRecord {
  const reports: SavedReport[] = Array.isArray(athlete.reports) ? athlete.reports : [];
  const latestData = reports[0]?.data || blankAthlete;
  const dob = getAthleteDob({ ...athlete, reports });
  const hasStableId = athlete.id && String(athlete.id).startsWith("athlete-") && !usedIds.has(athlete.id);
  const id = hasStableId
    ? String(athlete.id)
    : createUniqueAthleteIdFromParts(dob ? [athlete.name || latestData.name, dob] : [athlete.name || latestData.name, athlete.sex || latestData.sex, athlete.sport || latestData.sport, athlete.position || latestData.position, index + 1], usedIds);

  if (hasStableId) usedIds.add(id);

  return {
    ...athlete,
    id,
    name: athlete.name || latestData.name || "Unnamed Athlete",
    dob,
    sex: athlete.sex || latestData.sex || "Male",
    sport: athlete.sport || latestData.sport || "Basketball",
    position: athlete.position || latestData.position || "",
    height: athlete.height || latestData.height || "",
    bodyweight: athlete.bodyweight || latestData.bodyweight || "",
    archivedAt: athlete.archivedAt || null,
    reports,
  };
}

function normalizeCoachWorkspace(coach: CoachWorkspace | null): CoachWorkspace | null {
  if (!coach || !Array.isArray(coach.athletes)) return coach;
  const usedIds = new Set<string>();
  return { ...coach, athletes: coach.athletes.map((athlete, index) => normalizeAthleteProfile(athlete, index, usedIds)) };
}

function isArchivedAthlete(athlete: Pick<AthleteProfileRecord, "archivedAt">): boolean {
  return Boolean(athlete.archivedAt);
}

function getActiveAthletes(athletes: AthleteProfileRecord[]): AthleteProfileRecord[] {
  return athletes.filter((athlete) => !isArchivedAthlete(athlete));
}

function getAthleteIdentity(athlete: Partial<AthleteProfileRecord> | null | undefined): AthleteIdentity {
  return {
    name: normalizeIdentity(athlete?.name),
    dob: normalizeIdentity(getAthleteDob(athlete)),
    sex: normalizeIdentity(athlete?.sex),
    sport: normalizeIdentity(athlete?.sport),
    position: normalizeIdentity(athlete?.position),
  };
}

function getReportIdentity(data: Partial<AthleteData> | null | undefined): AthleteIdentity {
  return {
    name: normalizeIdentity(data?.name),
    dob: normalizeIdentity(data?.dob),
    sex: normalizeIdentity(data?.sex),
    sport: normalizeIdentity(data?.sport),
    position: normalizeIdentity(data?.position),
  };
}

function getAthleteMatchResult(athletes: AthleteProfileRecord[], data: AthleteData, preferredAthleteId: string | null): AthleteMatchResult {
  if (preferredAthleteId) {
    const preferredAthlete = athletes.find((athlete) => athlete.id === preferredAthleteId);
    if (preferredAthlete) return { status: "matched", athlete: preferredAthlete, message: "Existing athlete profile selected." };
  }

  const activeAthletes = getActiveAthletes(athletes);
  const reportIdentity = getReportIdentity(data);
  if (!reportIdentity.name) return { status: "new", athlete: null, message: "New athlete profile." };

  if (reportIdentity.dob) {
    const matches = activeAthletes.filter((athlete) => {
      const athleteIdentity = getAthleteIdentity(athlete);
      return athleteIdentity.name === reportIdentity.name && athleteIdentity.dob === reportIdentity.dob;
    });
    if (matches.length === 1) return { status: "matched", athlete: matches[0], message: "Matched existing athlete by name + DOB." };
    if (matches.length > 1) return { status: "ambiguous", athlete: null, message: "Needs review: multiple profiles share this name + DOB." };
    return { status: "new", athlete: null, message: "New athlete profile." };
  }

  const sameNameAthletes = activeAthletes.filter((athlete) => getAthleteIdentity(athlete).name === reportIdentity.name);
  if (!reportIdentity.sex || !reportIdentity.sport || !reportIdentity.position) {
    return sameNameAthletes.length
      ? { status: "ambiguous", athlete: null, message: "Needs review: same name exists and DOB is missing." }
      : { status: "new", athlete: null, message: "New athlete profile." };
  }

  const matches = sameNameAthletes.filter((athlete) => {
    const athleteIdentity = getAthleteIdentity(athlete);
    return athleteIdentity.name === reportIdentity.name
      && athleteIdentity.sex === reportIdentity.sex
      && athleteIdentity.sport === reportIdentity.sport
      && athleteIdentity.position === reportIdentity.position;
  });
  if (matches.length === 1) return { status: "matched", athlete: matches[0], message: "Matched existing athlete by name + details." };
  if (sameNameAthletes.length > 0) return { status: "ambiguous", athlete: null, message: "Needs review: same name exists, DOB missing." };
  return { status: "new", athlete: null, message: "New athlete profile." };
}

function findAthleteMatch(athletes: AthleteProfileRecord[], data: AthleteData, preferredAthleteId: string | null): AthleteProfileRecord | null {
  return getAthleteMatchResult(athletes, data, preferredAthleteId).athlete;
}

function findExactNameDobAthlete(athletes: AthleteProfileRecord[], data: AthleteData, excludedAthleteId: string | null = null): AthleteProfileRecord | null {
  const reportIdentity = getReportIdentity(data);
  if (!reportIdentity.name || !reportIdentity.dob) return null;

  const matches = getActiveAthletes(athletes).filter((athlete) => {
    const athleteIdentity = getAthleteIdentity(athlete);
    return athlete.id !== excludedAthleteId
      && athleteIdentity.name === reportIdentity.name
      && athleteIdentity.dob === reportIdentity.dob;
  });

  return matches.length === 1 ? matches[0] : null;
}

function buildAthleteBase(data: AthleteData, athleteId: string, existingAthlete: AthleteProfileRecord | null | undefined): AthleteProfileRecord {
  return {
    id: athleteId,
    name: data.name || existingAthlete?.name || "Unnamed Athlete",
    dob: data.dob || getAthleteDob(existingAthlete),
    sex: data.sex || existingAthlete?.sex || "Male",
    sport: data.sport || existingAthlete?.sport || "Basketball",
    position: data.position || existingAthlete?.position || "",
    height: data.height || existingAthlete?.height || "",
    bodyweight: data.bodyweight || existingAthlete?.bodyweight || "",
    archivedAt: existingAthlete?.archivedAt || null,
    reports: [],
  };
}

function buildAthleteReportDraft(athlete: AthleteProfileRecord): AthleteData {
  return {
    ...blankAthlete,
    name: athlete.name,
    sex: athlete.sex || "Male",
    date: new Date().toISOString().slice(0, 10),
    dob: getAthleteDob(athlete),
    sport: athlete.sport || "Basketball",
    position: athlete.position || "",
  };
}

function getAthleteIdentityLine(athlete: AthleteProfileRecord): string {
  const dob = getAthleteDob(athlete);
  const reportCount = athlete.reports?.length || 0;
  return [
    dob ? `DOB: ${dob}` : null,
    athlete.sex,
    athlete.sport,
    athlete.position,
    `${reportCount} ${reportCount === 1 ? "report" : "reports"}`,
  ].filter(Boolean).join(" · ");
}

function formatDate(value: string | null | undefined): string {
  return String(value || "").slice(0, 10);
}

function isIsoDate(value: string | null | undefined): boolean {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

function getCorrectionHistory(report: SavedReport | null | undefined): CorrectionSnapshot[] {
  return Array.isArray(report?.correctionHistory) ? report.correctionHistory : [];
}

function getCorrectionNote(report: SavedReport | null | undefined): string | null {
  if (!report?.correctedAt) return null;
  const correctionCount = report.correctionCount || getCorrectionHistory(report).length;
  const countText = correctionCount ? ` · ${correctionCount} ${correctionCount === 1 ? "correction" : "corrections"}` : "";
  return `Corrected on ${formatDate(report.correctedAt)}${countText}`;
}

function normalizeAuditValue(value: string | number | null | undefined): string {
  return String(value ?? "").trim();
}

function formatAuditValue(value: string | number | null | undefined): string {
  const text = normalizeAuditValue(value);
  return text || "—";
}

function getCorrectionChanges(previousReport: SavedReport | CorrectionSnapshot, nextReport: SavedReport | CorrectionSnapshot) {
  return correctionAuditFields.map((field) => {
    const previousValue = field.getValue(previousReport);
    const nextValue = field.getValue(nextReport);
    return {
      key: field.key,
      label: field.label,
      previousValue,
      nextValue,
      changed: normalizeAuditValue(previousValue) !== normalizeAuditValue(nextValue),
    };
  }).filter((item) => item.changed);
}

function buildCorrectionSnapshot(report: SavedReport, archivedAt: string): CorrectionSnapshot {
  return {
    id: `${report.id}-audit-${Date.now()}`,
    archivedAt,
    savedAt: report.savedAt || report.createdAt || null,
    correctedAt: report.correctedAt || null,
    correctionCount: report.correctionCount || 0,
    date: report.date,
    data: { ...report.data },
    profile: report.profile,
    archetype: report.archetype,
    status: report.status,
    primaryLimiter: report.primaryLimiter,
    secondaryLimiter: report.secondaryLimiter,
    rating: report.rating,
    overall: report.overall,
  };
}

function getPossessivePronoun(sex: string): string {
  if (sex === "Female") return "her";
  if (sex === "Male") return "his";
  return "their";
}

function capitalize(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function getCoachSummaryText(data: AthleteData, profile: Profile): string {
  const athleteName = data.name || "This athlete";
  const possessive = getPossessivePronoun(profile.sex);
  const archetype = profile.archetype.includes("Athlete") ? profile.archetype : `${profile.archetype} athlete`;
  return `${athleteName} currently profiles as a ${archetype}. ${capitalize(possessive)} primary limiter is ${profile.primaryLimiter}, and ${possessive} secondary limiter is ${profile.secondaryLimiter}. Currently, ${possessive} primary strength is ${profile.summaryStrength}. ${capitalize(possessive)} primary training priority should be ${profile.trainingFocus.primary}, with ${profile.trainingFocus.secondary} layered in as a secondary focus, while maintaining ${profile.trainingFocus.maintain}.`;
}

function importStatusTone(status: string): string {
  if (status === "Ready") return "bg-emerald-100 text-emerald-800";
  if (status === "Needs Review") return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-700";
}

function toNumber(value: string | number | null | undefined): NullableNumber {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === "") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isFiniteNumber(value: unknown): value is number {
  return Number.isFinite(value);
}

function average(values: NullableNumber[]): NullableNumber {
  const clean = values.filter(isFiniteNumber);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function scoreMetric(value: NullableNumber, standard: Standard): NullableNumber {
  if (!isFiniteNumber(value)) return null;
  if (standard.direction === "lower") {
    return clamp(((standard.poor - value) / (standard.poor - standard.elite)) * 100, 0, 100);
  }
  return clamp(((value - standard.poor) / (standard.elite - standard.poor)) * 100, 0, 100);
}

function scoreLabel(score: NullableNumber | undefined): string {
  if (!isFiniteNumber(score)) return "Missing";
  if (score >= 80) return "Standout";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Solid";
  if (score >= 20) return "Needs Work";
  return "Limiter";
}

function scoreColor(score: NullableNumber | undefined): string {
  if (!isFiniteNumber(score)) return "bg-slate-200";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 40) return "bg-yellow-300";
  return "bg-rose-500";
}

function getProfileRating(score: NullableNumber, status: string): NullableNumber {
  if (!isFiniteNumber(score)) return null;
  const complete = status && status.includes("Complete");
  if (score >= 85 && complete) return 5;
  if (score >= 75) return 4.5;
  if (score >= 65) return 4;
  if (score >= 55) return 3.5;
  if (score >= 45) return 3;
  if (score >= 35) return 2.5;
  if (score >= 25) return 2;
  if (score >= 15) return 1.5;
  if (score > 0) return 1;
  return 0.5;
}

function getTrainingFocus(profile: Pick<ProfileBase, "archetype" | "primaryLimiter" | "secondaryLimiter" | "summaryStrength">): TrainingFocus {
  const focusByLimiter: Record<string, TrainingFocus> = {
    Acceleration: {
      primary: "Acceleration / first-step speed",
      secondary: "Force application and sprint mechanics",
      maintain: "COD, power, and strength qualities",
      bullets: [
        "Prioritize speed work with high intent and full recovery.",
        "Use resisted sprints and projection-focused technical work.",
        "Emphasize power in the weight room that translates to speed.",
      ],
    },
    COD: {
      primary: "Change of direction execution",
      secondary: "Deceleration and re-acceleration mechanics",
      maintain: "Linear speed, power and strength qualities",
      bullets: [
        "Prioritize deceleration control, plant positions, and re-acceleration quality.",
        "Use planned COD progressions before layering in reactive complexity.",
        "Maintain sprint and strength qualities while improving turn efficiency.",
      ],
    },
    "COD Efficiency": {
      primary: "COD efficiency",
      secondary: "Braking, turning, and re-acceleration relative to speed",
      maintain: "Raw athletic expression outputs",
      bullets: [
        "Reduce the time lost when transitioning from sprinting into the cut and re-accelerating out.",
        "Use deceleration-to-re-acceleration progressions and side-specific COD work.",
        "Track left/right 505 performance when available to identify side-specific priorities.",
      ],
    },
    "Jump Output": {
      primary: "Vertical power output",
      secondary: "High-intent jump expression",
      maintain: "Strength and athletic expression qualities",
      bullets: [
        "Prioritize unloaded and lightly loaded jumps performed with maximal intent.",
        "Use loaded jumps, medicine ball work, and explosive lift variations when appropriate.",
        "Maintain strength and COD qualities without letting training volume suppress jump output.",
      ],
    },
    "Jump Efficiency": {
      primary: "Jump efficiency / mRSI",
      secondary: "Faster force expression in the CMJ",
      maintain: "Jump height, strength, and athletic expression",
      bullets: [
        "Improve how quickly the athlete converts the countermovement into takeoff output.",
        "Use pogos, drop-catch reps, low-amplitude plyometrics, and depth jump progressions.",
        "Keep jump quality high and avoid excessive fatigue during power sessions.",
      ],
    },
    "Strength Capacity": {
      primary: "Relative strength capacity",
      secondary: "Force production and tissue capacity",
      maintain: "Jump and COD qualities",
      bullets: [
        "Prioritize progressive strength development relative to body weight.",
        "Use trap bar, split squat, hinge, and single-leg strength progressions.",
        "Maintain sprint, jump, and COD exposure so new strength can transfer over time.",
      ],
    },
  };

  if (profile.archetype === "Developmental") {
    return {
      primary: "Broad athletic development",
      secondary: "Build the base across multiple buckets",
      maintain: "Movement quality and consistency",
      bullets: [
        "Build strength, coordination, sprint exposure, landing/braking skill, and basic power.",
        "Keep the program simple and repeatable while the base develops.",
        "Use re-testing to identify which bucket becomes the next specific priority.",
      ],
    };
  }

  if (profile.archetype === "Transfer-Limited") {
    return {
      primary: "Transfer to athletic expression",
      secondary: "Acceleration, deceleration, re-acceleration, and intent",
      maintain: "Strength and power qualities",
      bullets: [
        "Bridge capacity to the court with sprinting, deceleration, CoD, rhythm, stiffness, and intent.",
        "Prioritize acceleration, deceleration, re-acceleration, rhythm, stiffness, and intent.",
        "Maintain strength and power with enough exposure, but avoid chasing capacity that does not express.",
      ],
    };
  }

  return focusByLimiter[profile.primaryLimiter] || {
    primary: profile.primaryLimiter || "Primary training priority",
    secondary: profile.secondaryLimiter || "Secondary training priority",
    maintain: profile.summaryStrength || "Strongest current quality",
    bullets: [
      "Use the primary limiter to guide the next training block.",
      "Maintain the athlete’s strongest qualities with low-dose exposure.",
      "Re-test after the next training phase to confirm the profile is moving in the right direction.",
    ],
  };
}

function buildProfile(data: AthleteData): Profile {
  const sex = data.sex === "Female" ? "Female" : "Male";
  const norms = standards[sex];
  const bodyweight = toNumber(data.bodyweight);
  const sprint10 = toNumber(data.sprint10);
  const drill505 = toNumber(data.drill505);
  const codDeficit = isFiniteNumber(sprint10) && isFiniteNumber(drill505) ? drill505 - sprint10 : null;
  const cmjHeight = toNumber(data.cmjHeight);
  const mRsi = toNumber(data.mRsi);
  const trapBarE1RM = toNumber(data.trapBarE1RM);
  const relativeStrength = isFiniteNumber(bodyweight) && bodyweight > 0 && isFiniteNumber(trapBarE1RM) ? trapBarE1RM / bodyweight : null;

  const rawMetrics: RawProfileMetrics = { sprint10, drill505, codDeficit, cmjHeight, mRsi, relativeStrength };
  const sprint10Score = scoreMetric(sprint10, norms.sprint10);
  const rawCodDeficitScore = scoreMetric(codDeficit, norms.codDeficit);
  const codDeficitScore = isFiniteNumber(rawCodDeficitScore) && isFiniteNumber(sprint10Score)
    ? Math.min(rawCodDeficitScore, sprint10Score + 30)
    : rawCodDeficitScore;

  const scores: ProfileScores = {
    sprint10: sprint10Score,
    drill505: scoreMetric(drill505, norms.drill505),
    codDeficit: codDeficitScore,
    cmjHeight: scoreMetric(cmjHeight, norms.cmjHeight),
    mRsi: scoreMetric(mRsi, norms.mRsi),
    relativeStrength: scoreMetric(relativeStrength, norms.relativeStrength),
  };

  const scoreList: MetricItem[] = (Object.keys(rawMetrics) as MetricKey[]).map((key) => {
    const rawValue = rawMetrics[key];
    const standard = norms[key];
    return {
      key,
      label: standard.label,
      unit: standard.unit,
      value: rawValue,
      score: scores[key],
      display: isFiniteNumber(rawValue) ? `${rawValue.toFixed(key === "mRsi" || key === "relativeStrength" ? 2 : 2)}${standard.unit ? ` ${standard.unit}` : ""}` : "Missing",
    };
  });

  const athleticExpression = average([scores.sprint10, scores.drill505]);
  const power = scores.cmjHeight;
  const strength = scores.relativeStrength;
  const efficiency = average([scores.mRsi, scores.codDeficit]);
  const overall = average([athleticExpression, power, strength, efficiency]);

  const bucketItems: BucketItem[] = [
    { key: "athleticExpression", label: "Athletic Expression", score: athleticExpression, status: "Transfer-Limited" },
    { key: "power", label: "Power", score: power, status: "Power-Limited" },
    { key: "strength", label: "Strength", score: strength, status: "Strength-Limited" },
    { key: "efficiency", label: "Efficiency", score: efficiency, status: "Efficiency-Limited" },
  ];

  const scoredBucketItems = bucketItems.filter((item): item is BucketItem & { score: number } => isFiniteNumber(item.score));
  const lowestBucket = [...scoredBucketItems].sort((a, b) => a.score - b.score)[0];
  const availableScores = scoreList.filter((item): item is MetricItem & { score: number } => isFiniteNumber(item.score));
  const sortedLowestMetrics = [...availableScores].sort((a, b) => a.score - b.score);
  let lowestMetric = sortedLowestMetrics[0];
  let secondLowestMetric = sortedLowestMetrics[1];

  const jumpOutputMetric = availableScores.find((item) => item.key === "cmjHeight");
  const jumpEfficiencyMetric = availableScores.find((item) => item.key === "mRsi");
  const jumpOutputScore = jumpOutputMetric?.score;
  const jumpEfficiencyScore = jumpEfficiencyMetric?.score;
  const jumpOutputAndEfficiencyAreClose = isFiniteNumber(jumpOutputScore) && isFiniteNumber(jumpEfficiencyScore) && Math.abs(jumpOutputScore - jumpEfficiencyScore) <= 5;
  if (jumpOutputAndEfficiencyAreClose && jumpOutputMetric && jumpEfficiencyMetric && lowestMetric?.key === "mRsi" && jumpOutputMetric.score <= lowestMetric.score + 5) {
    lowestMetric = jumpOutputMetric;
    secondLowestMetric = jumpEfficiencyMetric;
  }

  const sortedHighest = [...availableScores].sort((a, b) => b.score - a.score);
  const highest = sortedHighest[0];
  const secondHighest = sortedHighest[1];
  const highestTestedMetric = sortedHighest.find((item) => item.key !== "codDeficit");
  const mainScores = Object.values(scores).filter(isFiniteNumber);
  const majorLimiters = mainScores.filter((score) => score < 40).length;
  const noScoreBelow60 = mainScores.length >= 5 && mainScores.every((score) => score >= 60);
  const noScoreBelow40 = mainScores.every((score) => score >= 40);

  const completeAthlete = isFiniteNumber(overall) && isFiniteNumber(athleticExpression) && isFiniteNumber(power) && isFiniteNumber(strength) && isFiniteNumber(efficiency) && overall >= 75 && athleticExpression >= 70 && power >= 70 && strength >= 70 && efficiency >= 70 && noScoreBelow60;
  const developmental = isFiniteNumber(overall) && (overall < 40 || scoredBucketItems.filter((item) => item.score < 35).length >= 2 || scoredBucketItems.filter((item) => item.score < 45).length >= 3 || majorLimiters >= 4);
  const capacityLimited = isFiniteNumber(strength) && strength < 50 && lowestBucket?.key === "strength";
  const bestCapacity = Math.max(isFiniteNumber(strength) ? strength : 0, isFiniteNumber(power) ? power : 0);
  const lowestExpression = Math.min(isFiniteNumber(athleticExpression) ? athleticExpression : 100, isFiniteNumber(efficiency) ? efficiency : 100);
  const transferLimited = bestCapacity >= 65 && lowestExpression < 55 && bestCapacity - lowestExpression >= 10;

  let archetype = "Profile Pending";
  let status = "Incomplete Profile";
  let summary = "Enter key testing numbers to generate an athlete profile.";
  let trainingDirection = "Collect more data.";

  if (mainScores.length >= 4 && isFiniteNumber(overall)) {
    if (completeAthlete) {
      archetype = "Complete Athlete";
      status = "Definitive Complete Athlete";
      summary = "Elite across athletic expression, power, strength, and efficiency with no obvious primary limiter.";
      trainingDirection = "Advance training based on sport demands while maintaining balance across the profile.";
    } else if (developmental) {
      archetype = "Developmental";
      status = "Broad Development Priority";
      summary = "Multiple buckets need development, requiring a broad training emphasis.";
      trainingDirection = "Build the base across strength, athletic expression, power, and efficiency.";
    } else if (capacityLimited) {
      archetype = "Capacity-Limited";
      status = "Strength-Limited";
      summary = "Overall horsepower and capacity is limiting the ceiling of the rest of the profile.";
      trainingDirection = "Prioritize strength capacity, force production, tissue capacity, and progressive power development.";
    } else if (transferLimited) {
      archetype = "Transfer-Limited";
      status = "Transfer-Limited";
      summary = "Capacity exists, but it is not showing up cleanly in athletic expression or efficiency.";
      trainingDirection = "Bridge capacity to the court with sprinting, deceleration, CoD, rhythm, stiffness, and intent.";
    } else {
      archetype = "Foundational Profile";
      const nearComplete = overall >= 68 && scoredBucketItems.length >= 4 && scoredBucketItems.every((item) => item.score >= 50) && scoredBucketItems.filter((item) => item.score >= 70).length >= 2 && noScoreBelow40;
      status = nearComplete ? "Near Complete Athlete" : lowestBucket?.score < 50 ? lowestBucket.status : "Foundational Profile";
      summary = "Solid foundational base, but needs to improve 1–2 categories to reach Complete Athlete status.";
      trainingDirection = "Use the primary limiter to drive the next training block while maintaining the strongest qualities.";
    }
  }

  const primaryLimiter = lowestMetric ? flagMap[lowestMetric.key] : "Need more data";
  const secondaryLimiter = secondLowestMetric ? flagMap[secondLowestMetric.key] : "Need more data";
  const rating = getProfileRating(overall, status);
  const summaryStrength = highestTestedMetric ? summaryStrengthMap[highestTestedMetric.key] || highestTestedMetric.label.toLowerCase() : "strongest tested quality";

  const profile: ProfileBase = {
    sex,
    scores,
    scoreList,
    bucketItems,
    overallScore: overall,
    archetype,
    status,
    summary,
    trainingDirection,
    primaryLimiter,
    secondaryLimiter,
    greenFlagOne: highest ? highest.label : "Need more data",
    greenFlagTwo: secondHighest ? secondHighest.label : "Need more data",
    strongestQuality: highest?.label || "Need more data",
    summaryStrength,
    rating,
    raw: {
      bodyweight,
      sprint10,
      drill505,
      codDeficit,
      cmjHeight,
      mRsi,
      trapBarE1RM,
      relativeStrength,
    },
  };

  return { ...profile, trainingFocus: getTrainingFocus(profile) };
}

function Field({ label, value, onChange, suffix, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; suffix?: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}{required ? <span className="text-rose-500"> *</span> : null}</span>
      <div className="mt-2 flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-[#1e94d2]">
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent px-4 py-3 text-slate-950 outline-none" />
        {suffix ? <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#1e94d2]">
        {children}
      </select>
    </label>
  );
}

function BrandMark({ variant = "wordmark", tone = "dark", className = "" }: { variant?: "wordmark" | "symbol"; tone?: "dark" | "light"; className?: string }) {
  const isSymbol = variant === "symbol";
  const src = isSymbol ? brandAssets.symbol : tone === "light" ? brandAssets.wordmarkWhite : brandAssets.wordmark;
  const sizeClass = isSymbol ? "h-11 w-11" : "h-11 w-auto";

  return <img src={src} alt="PEAQ Analytics" className={`${sizeClass} object-contain ${className}`} />;
}

function BrandedPageHeader({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy?: string; children?: ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-[#231f20] p-6 text-white shadow-sm md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <BrandMark variant="wordmark" tone="light" className="h-9 max-w-[168px]" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white/70">{eyebrow}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
          {copy ? <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">{copy}</p> : null}
        </div>
        {children ? <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">{children}</div> : null}
      </div>
    </section>
  );
}

function StarRating({ value }: { value: NullableNumber | undefined }) {
  const rating = isFiniteNumber(value) ? value : 0;
  return (
    <div>
      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fillAmount = Math.max(0, Math.min(1, rating - index)) * 100;
          return (
            <span key={index} className="relative inline-block text-2xl leading-none text-slate-300">
              ★
              <span className="absolute left-0 top-0 overflow-hidden text-yellow-400" style={{ width: `${fillAmount}%` }}>★</span>
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{isFiniteNumber(value) ? value.toFixed(1) : "—"} / 5 Stars</p>
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: ReactNode; helper: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function ScoreBar({ score }: { score: NullableNumber | undefined }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: isFiniteNumber(score) ? `${Math.round(score)}%` : "0%" }} />
    </div>
  );
}

function LimiterPill({ value }: { value: string }) {
  return <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">{value}</span>;
}

function StatusPill({ value }: { value: string | undefined }) {
  const label = value || "No Status";
  const tone = label.includes("Near") ? "bg-emerald-100 text-emerald-800" : label.includes("Limited") || label.includes("Broad") ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${tone}`}>{label}</span>;
}

function MetricCard({ item }: { item: MetricItem }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{item.label}</p>
          <p className="text-sm text-slate-500">{item.display}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-slate-950">{isFiniteNumber(item.score) ? Math.round(item.score) : "—"}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{scoreLabel(item.score)}</p>
        </div>
      </div>
      <ScoreBar score={item.score} />
    </div>
  );
}

function BucketCard({ bucket }: { bucket: BucketItem }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">{bucket.label}</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">{isFiniteNumber(bucket.score) ? bucket.score.toFixed(0) : "—"}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{scoreLabel(bucket.score)}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">/100</div>
      </div>
      <ScoreBar score={bucket.score} />
    </div>
  );
}

function SnapshotCard({ profile }: { profile: Profile }) {
  return (
    <div className="rounded-3xl bg-white/10 p-5 print:bg-slate-100">
      <p className="text-xs font-black uppercase tracking-wide text-white/50 print:text-slate-500">Profile Snapshot</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="min-h-[132px] rounded-3xl bg-slate-900/40 p-5 print:bg-white print:border print:border-slate-200">
          <p className="text-xs font-black uppercase tracking-wide text-white/50 print:text-slate-500">Athlete Archetype</p>
          <span className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm">{profile.archetype}</span>
        </div>
        <div className="min-h-[132px] rounded-3xl bg-slate-900/40 p-5 print:bg-white print:border print:border-slate-200">
          <p className="text-xs font-black uppercase tracking-wide text-white/50 print:text-slate-500">Profile Rating</p>
          <div className="mt-4"><StarRating value={profile.rating} /></div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Primary Limiter</p><p className="mt-1 font-black">{profile.primaryLimiter}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Secondary Limiter</p><p className="mt-1 font-black">{profile.secondaryLimiter}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Current Strength</p><p className="mt-1 font-black">{profile.greenFlagOne}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Current Strength</p><p className="mt-1 font-black">{profile.greenFlagTwo}</p></div>
      </div>
    </div>
  );
}

function OnePageReport({ data, profile, onBack }: { data: AthleteData; profile: Profile; onBack: () => void }) {
  const athleteMeta = [data.sex, data.sport, data.position, data.height ? `${data.height} in` : null, data.bodyweight ? `${data.bodyweight} lb` : null, data.date].filter(Boolean).join(" • ");

  return (
    <main className="min-h-screen bg-white p-3 text-slate-950 print:p-0">
      <style>{`
        @page { size: letter landscape; margin: 0.2in; }
        @media screen {
          .report-preview-frame { overflow-x: auto; padding-bottom: 1rem; }
          .report-page { width: 10.6in; max-width: none; }
        }
        @media print {
          html, body { background: #ffffff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .report-preview-frame { overflow: visible; padding: 0; }
          .report-page { width: 10.6in; page-break-inside: avoid; page-break-after: avoid; }
          .report-page .report-card { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-7xl flex-wrap gap-3">
        <button onClick={onBack} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">Back</button>
        <button onClick={() => window.print()} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Print / Save PDF</button>
      </div>

      <div className="report-preview-frame">
      <section className="report-page mx-auto bg-white text-slate-950">
        <div className="rounded-[1.25rem] bg-[#231f20] p-3 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BrandMark variant="wordmark" tone="light" className="h-4 max-w-[78px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">PEAQ Profile</p>
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{data.name || "Athlete Name"}</h1>
              <p className="mt-1 text-sm font-semibold text-white/60">{athleteMeta || "Enter athlete details"}</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-2 text-center text-slate-950 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Overall Score</p>
              <p className="text-3xl font-black tracking-tight">{isFiniteNumber(profile.overallScore) ? profile.overallScore.toFixed(0) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[0.95fr_1.05fr] gap-2">
          <div className="space-y-2">
            <div className="report-card rounded-[1.2rem] bg-[#231f20] p-3 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Profile Snapshot</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-900/50 p-2.5 text-white">
                  <p className="text-[9px] font-black uppercase tracking-wide text-white/50">Athlete Archetype</p>
                  <p className="mt-1 text-sm font-black leading-tight">{profile.archetype}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 p-2.5 text-white">
                  <p className="text-[9px] font-black uppercase tracking-wide text-white/50">Profile Rating</p>
                  <div className="mt-1 scale-90 origin-left"><StarRating value={profile.rating} /></div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-950"><p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Primary Limiter</p><p className="mt-0.5 text-xs font-black">{profile.primaryLimiter}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-950"><p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Secondary Limiter</p><p className="mt-0.5 text-xs font-black">{profile.secondaryLimiter}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-950"><p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Current Strength</p><p className="mt-0.5 text-xs font-black">{profile.greenFlagOne}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-950"><p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Current Strength</p><p className="mt-0.5 text-xs font-black">{profile.greenFlagTwo}</p></div>
              </div>
            </div>

            <div className="report-card rounded-[1.2rem] border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Coach Summary</p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-700">{getCoachSummaryText(data, profile)}</p>
            </div>

            <div className="report-card rounded-[1.2rem] border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Training Focus</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[10px] leading-4 text-slate-700">
                <div className="rounded-xl bg-slate-100 p-2"><span className="font-black text-slate-950">Primary:</span><br />{profile.trainingFocus.primary}</div>
                <div className="rounded-xl bg-slate-100 p-2"><span className="font-black text-slate-950">Secondary:</span><br />{profile.trainingFocus.secondary}</div>
                <div className="rounded-xl bg-slate-100 p-2"><span className="font-black text-slate-950">Maintain:</span><br />{profile.trainingFocus.maintain}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="report-card rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-end justify-between gap-2">
                <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Category Scores</p><h2 className="text-lg font-black tracking-tight">Profile Buckets</h2></div>
                <p className="text-[9px] font-bold text-slate-500">Each bucket contributes 25%.</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {profile.bucketItems.map((bucket) => <div key={bucket.key} className="rounded-xl border border-slate-200 bg-white p-2"><p className="text-[9px] font-black uppercase tracking-wide text-slate-500">{bucket.label}</p><p className="mt-0.5 text-xl font-black tracking-tight text-slate-950">{isFiniteNumber(bucket.score) ? bucket.score.toFixed(0) : "—"}</p><ScoreBar score={bucket.score} /></div>)}
              </div>
            </div>
            <div className="report-card rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-end justify-between gap-2">
                <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Tested Metrics</p><h2 className="text-lg font-black tracking-tight">Metric Snapshot</h2></div>
                <StatusPill value={profile.status} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {profile.scoreList.map((item) => <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-2"><div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-black leading-tight text-slate-950">{item.label}</p><p className="mt-0.5 text-[10px] font-bold text-slate-500">{item.display}</p></div><p className="text-base font-black text-slate-950">{isFiniteNumber(item.score) ? Math.round(item.score) : "—"}</p></div><ScoreBar score={item.score} /></div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
          <span>Powered by</span>
          <span className="text-[#1e94d2]">PEAQ Analytics</span>
        </div>
      </section>
      </div>
    </main>
  );
}

function ProgressReport({ athlete, reportA, reportB, onBack }: { athlete: AthleteProfileRecord; reportA: SavedReport; reportB: SavedReport; onBack: () => void }) {
  const metricRows = getProgressRows(progressMetricKeys, reportA, reportB);
  const bucketRows = getProgressRows(progressBucketKeys, reportA, reportB);
  const ratingMetric = getComparisonMetric("rating");
  const overallMetric = getComparisonMetric("overall");
  const ratingChange = getComparisonChange(ratingMetric, reportA, reportB);
  const overallChange = getComparisonChange(overallMetric, reportA, reportB);
  const summaryRows = [
    { label: "Archetype", from: reportA.archetype, to: reportB.archetype },
    { label: "Status", from: reportA.status, to: reportB.status },
  ];

  return (
    <main className="min-h-screen bg-white p-3 text-slate-950 print:p-0">
      <style>{`
        @page { size: letter landscape; margin: 0.25in; }
        @media screen {
          .report-preview-frame { overflow-x: auto; padding-bottom: 1rem; }
          .progress-report-page { width: 10.4in; max-width: none; }
        }
        @media print {
          html, body { background: #ffffff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .report-preview-frame { overflow: visible; padding: 0; }
          .progress-report-page { width: 10.4in; page-break-inside: avoid; page-break-after: avoid; }
          .progress-report-card { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-7xl flex-wrap gap-3">
        <button onClick={onBack} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">Back</button>
        <button onClick={() => window.print()} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Print / Save PDF</button>
      </div>

      <div className="report-preview-frame">
      <section className="progress-report-page mx-auto bg-white text-slate-950">
        <div className="rounded-[1.25rem] bg-[#231f20] p-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BrandMark variant="wordmark" tone="light" className="h-5 max-w-[96px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">PEAQ Progress Report</p>
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{athlete.name}</h1>
              <p className="mt-1 text-sm font-semibold text-white/60">Report A ({formatDate(reportA.date)}) -&gt; Report B ({formatDate(reportB.date)})</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-2 text-right text-slate-950 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Direction</p>
              <p className="text-base font-black">Old to New</p>
            </div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[0.78fr_1.22fr] gap-2">
          <div className="space-y-2">
            <div className="progress-report-card rounded-[1.1rem] border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Athlete</p>
              <p className="mt-1 text-xl font-black tracking-tight">{athlete.name}</p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{getAthleteIdentityLine(athlete)}</p>
            </div>

            <div className="progress-report-card rounded-[1.1rem] border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Profile Changes</p>
              <div className="mt-2 space-y-2">
                {summaryRows.map((row) => {
                  const changed = row.from !== row.to;
                  return (
                    <div key={row.label} className="rounded-xl bg-slate-50 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{row.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${changed ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{changed ? "Changed" : "No Change"}</span>
                      </div>
                      <p className="mt-1 text-xs font-black text-slate-950">{row.from || "—"} -&gt; {row.to || "—"}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="progress-report-card rounded-[1.1rem] border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Score Changes</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-[10px] font-black text-slate-500">Rating</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{formatComparisonValue(getComparisonValue(reportA, "rating"), ratingMetric)} -&gt; {formatComparisonValue(getComparisonValue(reportB, "rating"), ratingMetric)}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black ${ratingChange.tone}`}>{ratingChange.label} {ratingChange.value}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-[10px] font-black text-slate-500">Overall</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{formatComparisonValue(getComparisonValue(reportA, "overall"), overallMetric)} -&gt; {formatComparisonValue(getComparisonValue(reportB, "overall"), overallMetric)}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black ${overallChange.tone}`}>{overallChange.label} {overallChange.value}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="progress-report-card rounded-[1.1rem] border border-slate-200 bg-white p-3">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Metric Changes</p>
                  <h2 className="text-lg font-black tracking-tight">Testing Outputs</h2>
                </div>
                <p className="text-[9px] font-bold text-slate-500">Sprint and 505: lower is better.</p>
              </div>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] bg-slate-950 px-3 py-2 text-[9px] font-black uppercase tracking-wide text-white/60">
                  <div>Metric</div><div>Report A</div><div>Report B</div><div>Change</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {metricRows.map((row) => (
                    <div key={row.metric.key} className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] items-center gap-2 px-3 py-2 text-[11px]">
                      <div>
                        <p className="font-black text-slate-950">{row.metric.label}</p>
                        <p className="text-[9px] font-semibold text-slate-500">{row.metric.direction === "lower" ? "Lower is better" : "Higher is better"}</p>
                      </div>
                      <div className="font-black text-slate-700">{formatComparisonValue(row.valueA, row.metric)}</div>
                      <div className="font-black text-slate-700">{formatComparisonValue(row.valueB, row.metric)}</div>
                      <div>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${row.change.tone}`}>{row.change.label}</span>
                        <p className="mt-0.5 font-black text-slate-700">{row.change.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="progress-report-card rounded-[1.1rem] border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Bucket Changes</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {bucketRows.map((row) => (
                  <div key={row.metric.key} className="rounded-xl bg-slate-50 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black leading-tight text-slate-950">{row.metric.label}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{formatComparisonValue(row.valueA, row.metric)} -&gt; {formatComparisonValue(row.valueB, row.metric)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${row.change.tone}`}>{row.change.label}</span>
                    </div>
                    <p className="mt-1 text-xs font-black text-slate-700">{row.change.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
          <span>Powered by</span>
          <span className="text-[#1e94d2]">PEAQ Analytics</span>
        </div>
      </section>
      </div>
    </main>
  );
}

function ScoringGuide({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandedPageHeader eyebrow="Scoring Guide" title="Scoring Guide" copy="PEAQ standards, score tiers, bucket definitions, and model logic.">
          <button onClick={onBack} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Back to Workspace</button>
        </BrandedPageHeader>

        <section className="grid gap-6 lg:grid-cols-2">
          {(["Male", "Female"] as Sex[]).map((sex) => (
            <div key={sex} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-950 px-5 py-4 text-white"><p className="text-lg font-black">{sex} Standards</p></div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500"><tr><th className="p-3 font-black">Metric</th><th className="p-3 font-black">0 Score</th><th className="p-3 font-black">100 Score</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(standards[sex]).map(([key, standard]) => <tr key={`${sex}-${key}`}><td className="p-3 font-bold">{standard.label}</td><td className="p-3">{standard.poor} {standard.unit}</td><td className="p-3">{standard.elite} {standard.unit}</td></tr>)}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Score Tiers</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-700"><p><span className="font-black text-slate-950">Standout:</span> 80–100</p><p><span className="font-black text-slate-950">Strong:</span> 60–79</p><p><span className="font-black text-slate-950">Solid:</span> 40–59</p><p><span className="font-black text-slate-950">Needs Work:</span> 20–39</p><p><span className="font-black text-slate-950">Limiter:</span> 0–19</p></div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Scoring Structure</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-700"><p><span className="font-black text-slate-950">Athletic Expression:</span> 10-yard sprint + 505.</p><p><span className="font-black text-slate-950">Power:</span> CMJ height.</p><p><span className="font-black text-slate-950">Strength:</span> trap bar relative strength.</p><p><span className="font-black text-slate-950">Efficiency:</span> mRSI + speed-adjusted COD Deficit.</p><p><span className="font-black text-slate-950">Overall:</span> average of the four buckets.</p></div></div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">Archetype Guide</p>
          <h2 className="text-2xl font-black tracking-tight">What PEAQ Profiles Mean</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {archetypeGuide.map((item) => (
              <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-black text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardReport({
  data,
  profile,
  onSave,
  onBack,
  onPrintReport,
  saveLabel = "Save Report",
  extraActions = null,
  auditNote = null,
}: {
  data: AthleteData;
  profile: Profile;
  onSave: (() => void) | null;
  onBack: () => void;
  onPrintReport: () => void;
  saveLabel?: string;
  extraActions?: ReactNode;
  auditNote?: string | null;
}) {
  const athleteMeta = [data.sex, data.sport, data.position, data.height ? `${data.height} in` : null, data.bodyweight ? `${data.bodyweight} lb` : null, data.date].filter(Boolean).join(" • ");
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-[#231f20] text-white shadow-sm">
        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <BrandMark variant="wordmark" tone="light" className="h-8 max-w-[144px]" />
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/60">PEAQ Profile</span>
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{data.name || "Athlete Name"}</h2>
            <p className="mt-2 text-sm font-semibold text-white/60">{athleteMeta || "Enter athlete details"}</p>
            {auditNote ? <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/60">{auditNote}</p> : null}
            <div className="mt-6 rounded-3xl bg-white p-6 text-slate-950 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Primary Archetype</p>
                  <p className="mt-2 text-3xl font-black tracking-tight">{profile.archetype}</p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{profile.summary}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 px-5 py-4 text-center text-white">
                  <p className="text-xs font-black uppercase tracking-wide text-white/50">Overall</p>
                  <p className="mt-1 text-3xl font-black">{isFiniteNumber(profile.overallScore) ? profile.overallScore.toFixed(0) : "—"}</p>
                </div>
              </div>
            </div>
          </div>
          <SnapshotCard profile={profile} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {profile.bucketItems.map((bucket) => <BucketCard key={bucket.key} bucket={bucket} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div><p className="text-sm font-black uppercase tracking-wide text-slate-500">Tested Metrics</p><h3 className="text-2xl font-black">Metric Snapshot</h3></div>
            <StatusPill value={profile.status} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {profile.scoreList.map((item) => <MetricCard key={item.key} item={item} />)}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Coach Summary</p>
            <p className="mt-3 text-base leading-8 text-slate-700">{getCoachSummaryText(data, profile)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Training Focus</p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
              <div className="rounded-2xl bg-slate-100 p-4"><span className="font-black text-slate-950">Primary:</span> {profile.trainingFocus.primary}</div>
              <div className="rounded-2xl bg-slate-100 p-4"><span className="font-black text-slate-950">Secondary:</span> {profile.trainingFocus.secondary}</div>
              <div className="rounded-2xl bg-slate-100 p-4"><span className="font-black text-slate-950">Maintain:</span> {profile.trainingFocus.maintain}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onBack} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">Back</button>
        <button onClick={onPrintReport} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">Print Report / PDF</button>
        {extraActions}
        {onSave ? <button onClick={onSave} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">{saveLabel}</button> : null}
      </div>
    </section>
  );
}

function ReportBuilder({
  data,
  setData,
  onSave,
  onBack,
  onPrintReport,
  mode = "new",
}: {
  data: AthleteData;
  setData: Dispatch<SetStateAction<AthleteData>>;
  onSave: (data: AthleteData, profile: Profile) => void;
  onBack: () => void;
  onPrintReport: (data: AthleteData, profile: Profile) => void;
  mode?: "new" | "correction";
}) {
  const profile = useMemo(() => buildProfile(data), [data]);
  const update = (key: AthleteDataKey, value: string) => setData((previous) => ({ ...previous, [key]: value }));
  const isCorrection = mode === "correction";
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandedPageHeader eyebrow={isCorrection ? "Correct Report" : "Run New Report"} title="PEAQ Profile" copy={isCorrection ? "Fix a saved report mistake without creating a new testing session." : "Enter athlete data, review the profile, print the report, or save it to the athlete library."}>
          <button onClick={onBack} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Back to Workspace</button>
        </BrandedPageHeader>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Athlete Info</h2>
            <div className="mt-6 grid gap-4">
              <Field label="Athlete Name" value={data.name} onChange={(value) => update("name", value)} required />
              <SelectField label="Sex" value={data.sex} onChange={(value) => update("sex", value)}><option>Male</option><option>Female</option></SelectField>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Testing Date" type="date" value={data.date} onChange={(value) => update("date", value)} /><Field label="Date of Birth" type="date" value={data.dob} onChange={(value) => update("dob", value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Sport" value={data.sport} onChange={(value) => update("sport", value)} /><Field label="Position" value={data.position} onChange={(value) => update("position", value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Height" value={data.height} onChange={(value) => update("height", value)} suffix="in" /><Field label="Body Weight" value={data.bodyweight} onChange={(value) => update("bodyweight", value)} suffix="lb" required /></div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Testing Inputs</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">COD Deficit and relative strength are calculated automatically.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="10-Yard Sprint" value={data.sprint10} onChange={(value) => update("sprint10", value)} suffix="sec" />
              <Field label="505 Drill" value={data.drill505} onChange={(value) => update("drill505", value)} suffix="sec" />
              <Field label="CMJ Height" value={data.cmjHeight} onChange={(value) => update("cmjHeight", value)} suffix="in" />
              <Field label="mRSI" value={data.mRsi} onChange={(value) => update("mRsi", value)} />
              <Field label="Trap Bar e1RM" value={data.trapBarE1RM} onChange={(value) => update("trapBarE1RM", value)} suffix="lb" />
            </div>
            <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-600"><span className="font-black text-slate-950">Auto-calculated:</span> COD Deficit = {isFiniteNumber(profile.raw.codDeficit) ? `${profile.raw.codDeficit.toFixed(2)} sec` : "missing"}; Relative strength = {isFiniteNumber(profile.raw.relativeStrength) ? `${profile.raw.relativeStrength.toFixed(2)} xBW` : "missing"}.</div>
          </div>
        </section>

        <DashboardReport data={data} profile={profile} onSave={() => onSave(data, profile)} onBack={onBack} onPrintReport={() => onPrintReport(data, profile)} saveLabel={isCorrection ? "Save Correction" : "Save Report"} />
      </div>
    </main>
  );
}

function buildSavedReport(data: AthleteData, profile: Profile): SavedReport {
  return {
    id: `${slugify(data.name)}-${data.date || new Date().toISOString().slice(0, 10)}-${Date.now()}`,
    savedAt: new Date().toISOString(),
    date: data.date || new Date().toISOString().slice(0, 10),
    data: { ...data },
    profile,
    archetype: profile.archetype,
    status: profile.status,
    primaryLimiter: profile.primaryLimiter,
    secondaryLimiter: profile.secondaryLimiter,
    rating: profile.rating,
    overall: profile.overallScore,
  };
}

function buildCorrectedReport(existingReport: SavedReport, data: AthleteData, profile: Profile): SavedReport {
  const correctedAt = new Date().toISOString();
  const correctionHistory = [...getCorrectionHistory(existingReport), buildCorrectionSnapshot(existingReport, correctedAt)];
  return {
    ...buildSavedReport(data, profile),
    id: existingReport.id,
    savedAt: existingReport.savedAt || existingReport.createdAt || new Date().toISOString(),
    correctedAt,
    correctionCount: (existingReport.correctionCount || 0) + 1,
    correctionHistory,
  };
}

function buildReportEntry(data: AthleteData, profile: Profile, preferredAthleteId: string | null = null): ReportEntry {
  return { data, profile, preferredAthleteId };
}

function addReportEntries(current: CoachWorkspace | null, entries: ReportEntry[]): CoachWorkspace | null {
  if (!current) return current;
  const normalizedCoach = normalizeCoachWorkspace(current);
  if (!normalizedCoach) return current;
  let athletes = normalizedCoach.athletes;
  entries.forEach(({ data, profile, preferredAthleteId }) => {
    const report = buildSavedReport(data, profile);
    const existingAthlete = findAthleteMatch(athletes, data, preferredAthleteId);
    const athleteId = existingAthlete?.id || createUniqueAthleteId(data, athletes);
    const athleteBase = buildAthleteBase(data, athleteId, existingAthlete);
    athletes = existingAthlete
      ? athletes.map((athlete) => athlete.id === athleteId ? { ...athlete, ...athleteBase, reports: [report, ...athlete.reports].sort((a, b) => b.date.localeCompare(a.date)) } : athlete)
      : [{ ...athleteBase, reports: [report] }, ...athletes];
  });
  return { ...normalizedCoach, athletes };
}

function correctSavedReport(current: CoachWorkspace | null, athleteId: string, reportId: string, data: AthleteData, profile: Profile, targetAthleteId = athleteId): CoachWorkspace | null {
  if (!current) return current;
  const normalizedCoach = normalizeCoachWorkspace(current);
  if (!normalizedCoach) return current;
  const sourceAthlete = normalizedCoach.athletes.find((athlete) => athlete.id === athleteId);
  const existingReport = sourceAthlete?.reports.find((report) => report.id === reportId);
  if (!sourceAthlete || !existingReport) return normalizedCoach;

  const correctedReport = buildCorrectedReport(existingReport, data, profile);

  if (targetAthleteId && targetAthleteId !== athleteId) {
    const targetAthlete = normalizedCoach.athletes.find((athlete) => athlete.id === targetAthleteId);
    if (!targetAthlete) return normalizedCoach;

    const targetAthleteBase = buildAthleteBase(data, targetAthlete.id, targetAthlete);
    const athletes: AthleteProfileRecord[] = [];
    normalizedCoach.athletes.forEach((athlete) => {
      if (athlete.id === athleteId) {
        const remainingReports = athlete.reports.filter((report) => report.id !== reportId);
        if (remainingReports.length > 0) {
          athletes.push({ ...athlete, reports: remainingReports.sort((a, b) => b.date.localeCompare(a.date)) });
        }
        return;
      }

      if (athlete.id === targetAthleteId) {
        athletes.push({
          ...athlete,
          ...targetAthleteBase,
          reports: [correctedReport, ...athlete.reports].sort((a, b) => b.date.localeCompare(a.date)),
        });
        return;
      }

      athletes.push(athlete);
    });

    return { ...normalizedCoach, athletes };
  }

  return {
    ...normalizedCoach,
    athletes: normalizedCoach.athletes.map((athlete) => {
      if (athlete.id !== athleteId) return athlete;
      const athleteBase = buildAthleteBase(data, athlete.id, athlete);
      return {
        ...athlete,
        ...athleteBase,
        reports: athlete.reports.map((report) => report.id === reportId ? correctedReport : report).sort((a, b) => b.date.localeCompare(a.date)),
      };
    }),
  };
}

function isProfile(value: unknown): value is Profile {
  return Boolean(value && typeof value === "object" && "bucketItems" in value && "scoreList" in value);
}

function getCloudDate(value: string | null | undefined): string | null {
  const date = String(value || "").trim();
  return date || null;
}

function getCloudNumber(value: string | number | null | undefined): number | null {
  return toNumber(value);
}

function normalizeCloudAthleteData(rawInputs: Partial<AthleteData> | null | undefined): AthleteData {
  const source = rawInputs || {};
  return templateHeaders.reduce((data, key) => {
    data[key] = String(source[key] ?? blankAthlete[key] ?? "");
    return data;
  }, { ...blankAthlete });
}

function buildReportFromCloud(row: CloudReportRow): SavedReport {
  const data = normalizeCloudAthleteData(row.raw_inputs);
  const profile = isProfile(row.calculated_profile) ? row.calculated_profile : buildProfile(data);
  return {
    id: row.client_id || row.id,
    savedAt: row.saved_at || new Date().toISOString(),
    correctedAt: row.corrected_at || null,
    correctionCount: row.correction_count || 0,
    correctionHistory: Array.isArray(row.correction_history) ? row.correction_history : [],
    date: row.testing_date || data.date,
    data,
    profile,
    archetype: row.archetype || profile.archetype,
    status: row.status || profile.status,
    primaryLimiter: row.primary_limiter || profile.primaryLimiter,
    secondaryLimiter: row.secondary_limiter || profile.secondaryLimiter,
    rating: isFiniteNumber(row.profile_rating) ? row.profile_rating : profile.rating,
    overall: isFiniteNumber(row.overall_score) ? row.overall_score : profile.overallScore,
  };
}

async function loadCoachFromSupabase(session: SupabaseSession): Promise<CoachWorkspace> {
  const [profileRows, athleteRows, reportRows] = await Promise.all([
    supabaseFetch<CloudProfileRow[]>("/rest/v1/profiles?select=id,email,coach_name,organization&limit=1", {
      accessToken: session.accessToken,
    }),
    supabaseFetch<CloudAthleteRow[]>("/rest/v1/athletes?select=id,client_id,name,dob,sex,sport,position,height,bodyweight,archived_at&order=updated_at.desc", {
      accessToken: session.accessToken,
    }),
    supabaseFetch<CloudReportRow[]>("/rest/v1/reports?select=id,client_id,athlete_id,testing_date,raw_inputs,calculated_profile,overall_score,profile_rating,archetype,status,primary_limiter,secondary_limiter,saved_at,corrected_at,correction_count,correction_history&order=testing_date.desc", {
      accessToken: session.accessToken,
    }),
  ]);
  const profile = profileRows[0];
  const reportsByAthleteId = new Map<string, SavedReport[]>();

  reportRows.forEach((row) => {
    const reports = reportsByAthleteId.get(row.athlete_id) || [];
    reports.push(buildReportFromCloud(row));
    reportsByAthleteId.set(row.athlete_id, reports);
  });

  const athletes: AthleteProfileRecord[] = athleteRows.map((row) => ({
    id: row.client_id || `athlete-${row.id}`,
    name: row.name,
    dob: row.dob || "",
    sex: row.sex || "Male",
    sport: row.sport || "Basketball",
    position: row.position || "",
    height: row.height === null || row.height === undefined ? "" : String(row.height),
    bodyweight: row.bodyweight === null || row.bodyweight === undefined ? "" : String(row.bodyweight),
    archivedAt: row.archived_at || null,
    reports: (reportsByAthleteId.get(row.id) || []).sort((a, b) => b.date.localeCompare(a.date)),
  }));

  return normalizeCoachWorkspace({
    id: session.user.id,
    name: profile?.coach_name || "Coach",
    email: profile?.email || session.user.email || "",
    organization: profile?.organization || "PEAQ Analytics",
    athletes,
  }) || {
    id: session.user.id,
    name: profile?.coach_name || "Coach",
    email: profile?.email || session.user.email || "",
    organization: profile?.organization || "PEAQ Analytics",
    athletes,
  };
}

async function saveCoachToSupabase(coach: CoachWorkspace, session: SupabaseSession): Promise<void> {
  const normalizedCoach = normalizeCoachWorkspace(coach);
  if (!normalizedCoach) return;

  await supabaseFetch("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    accessToken: session.accessToken,
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{
      id: session.user.id,
      email: normalizedCoach.email || session.user.email || null,
      coach_name: normalizedCoach.name || "Coach",
      organization: normalizedCoach.organization || null,
    }]),
  });

  if (!normalizedCoach.athletes.length) return;

  const athleteRows = normalizedCoach.athletes.map((athlete) => ({
    client_id: athlete.id,
    coach_id: session.user.id,
    name: athlete.name || "Unnamed Athlete",
    dob: getCloudDate(getAthleteDob(athlete)),
    sex: athlete.sex || null,
    sport: athlete.sport || null,
    position: athlete.position || null,
    height: getCloudNumber(athlete.height),
    bodyweight: getCloudNumber(athlete.bodyweight),
    archived_at: athlete.archivedAt || null,
  }));

  const savedAthletes = await supabaseFetch<Array<{ id: string; client_id: string }>>("/rest/v1/athletes?on_conflict=coach_id,client_id&select=id,client_id", {
    method: "POST",
    accessToken: session.accessToken,
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(athleteRows),
  });
  const athleteIdByClientId = new Map(savedAthletes.map((athlete) => [athlete.client_id, athlete.id]));

  const reportRows = normalizedCoach.athletes.flatMap((athlete) => {
    const cloudAthleteId = athleteIdByClientId.get(athlete.id);
    if (!cloudAthleteId) return [];

    return athlete.reports.map((report) => ({
      client_id: report.id,
      coach_id: session.user.id,
      athlete_id: cloudAthleteId,
      testing_date: getCloudDate(report.date || report.data.date) || new Date().toISOString().slice(0, 10),
      raw_inputs: report.data,
      calculated_profile: report.profile,
      metric_scores: report.profile.scores,
      bucket_scores: Object.fromEntries(report.profile.bucketItems.map((bucket) => [bucket.key, bucket.score])),
      overall_score: report.overall,
      profile_rating: report.rating,
      archetype: report.archetype,
      status: report.status,
      primary_limiter: report.primaryLimiter,
      secondary_limiter: report.secondaryLimiter,
      green_flag_one: report.profile.greenFlagOne,
      green_flag_two: report.profile.greenFlagTwo,
      training_focus: report.profile.trainingFocus,
      coach_summary: getCoachSummaryText(report.data, report.profile),
      saved_at: report.savedAt,
      corrected_at: report.correctedAt || null,
      correction_count: report.correctionCount || 0,
      correction_history: getCorrectionHistory(report),
    }));
  });

  if (!reportRows.length) return;

  await supabaseFetch("/rest/v1/reports?on_conflict=coach_id,client_id", {
    method: "POST",
    accessToken: session.accessToken,
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(reportRows),
  });
}

function getLatestReport(athlete: AthleteProfileRecord): SavedReport | undefined {
  return athlete.reports?.[0];
}

function getReportBucketScore(report: SavedReport | null | undefined, key: BucketKey): NullableNumber {
  const bucket = report?.profile?.bucketItems?.find((item) => item.key === key);
  return bucket?.score ?? null;
}

function getComparisonValue(report: SavedReport | null | undefined, key: ComparisonKey): NullableNumber {
  if (!report) return null;
  if (key === "overall") return report.overall;
  if (key === "rating") return report.rating;
  if (key === "athleticExpression" || key === "power" || key === "strength" || key === "efficiency") return getReportBucketScore(report, key);
  return report.profile.raw[key as MetricKey];
}

function formatComparisonValue(value: NullableNumber, metric: ComparisonMetric): string {
  if (!isFiniteNumber(value)) return "—";
  const display = value.toFixed(metric.decimals);
  return metric.unit ? `${display} ${metric.unit}` : display;
}

function getComparisonChange(metric: ComparisonMetric, reportA: SavedReport, reportB: SavedReport): ComparisonChange {
  const valueA = getComparisonValue(reportA, metric.key);
  const valueB = getComparisonValue(reportB, metric.key);
  if (!isFiniteNumber(valueA) || !isFiniteNumber(valueB)) {
    return { label: "Missing", tone: "bg-slate-100 text-slate-500", value: "—" };
  }

  const delta = valueB - valueA;
  const tolerance = Math.pow(10, -metric.decimals) / 2;
  if (Math.abs(delta) < tolerance) {
    return { label: "No Change", tone: "bg-slate-100 text-slate-600", value: "0" };
  }

  const improved = metric.direction === "lower" ? delta < 0 : delta > 0;
  const prefix = delta > 0 ? "+" : "";
  const value = `${prefix}${delta.toFixed(metric.decimals)}${metric.unit ? ` ${metric.unit}` : ""}`;
  return improved
    ? { label: "Improved", tone: "bg-emerald-100 text-emerald-800", value }
    : { label: "Declined", tone: "bg-rose-100 text-rose-700", value };
}

function getComparisonMetric(key: ComparisonKey): ComparisonMetric {
  const metric = comparisonMetrics.find((item) => item.key === key);
  if (!metric) return { key: "overall", label: "Overall Score", unit: "", direction: "higher", decimals: 0 };
  return metric;
}

function getProgressRows(keys: ComparisonKey[], reportA: SavedReport, reportB: SavedReport): ProgressRow[] {
  return keys.map((key) => {
    const metric = getComparisonMetric(key);
    return {
      metric,
      valueA: getComparisonValue(reportA, key),
      valueB: getComparisonValue(reportB, key),
      change: getComparisonChange(metric, reportA, reportB),
    };
  });
}

function reportOptionLabel(report: SavedReport, index: number): string {
  const label = [report.date, report.archetype].filter(Boolean).join(" · ");
  return `${label || "Saved Report"}${index === 0 ? " (Latest)" : ""}`;
}

function uniqueOptions(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

function starRatingMatches(rating: NullableNumber | undefined, range: string): boolean {
  if (range === "all") return true;
  if (!isFiniteNumber(rating)) return false;
  if (range === "under-3.5") return rating < 3.5;
  return rating >= Number(range);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && inQuotes && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

function normalizeCsvHeader(header: string): string {
  const key = String(header || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases: Record<string, AthleteDataKey> = {
    athletename: "name",
    testdate: "date",
    testingdate: "date",
    dateoftest: "date",
    dateofbirth: "dob",
    birthdate: "dob",
    birthday: "dob",
    positiongroup: "position",
    bodyweightlbs: "bodyweight",
    bodyweightlb: "bodyweight",
    bodyweightpounds: "bodyweight",
    bodywt: "bodyweight",
    weight: "bodyweight",
    heightin: "height",
    heightinches: "height",
    tenyardsprint: "sprint10",
    yardsprint10: "sprint10",
    sprint10yard: "sprint10",
    sprint10: "sprint10",
    drill505: "drill505",
    fivezerofive: "drill505",
    cod505: "drill505",
    cmj: "cmjHeight",
    cmjheight: "cmjHeight",
    countermovementjump: "cmjHeight",
    mrsi: "mRsi",
    modifiedreactivestrengthindex: "mRsi",
    trapbare1rm: "trapBarE1RM",
    trapbarerm: "trapBarE1RM",
    trapbar: "trapBarE1RM",
    e1rm: "trapBarE1RM",
  };
  return aliases[key] || templateHeaders.find((headerName) => headerName.toLowerCase() === key) || String(header || "").trim();
}

function normalizeDateValue(value: string | null | undefined): string {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  const slashDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashDate) {
    const month = Number(slashDate[1]);
    const day = Number(slashDate[2]);
    const rawYear = Number(slashDate[3]);
    const year = rawYear < 100 ? rawYear + (rawYear >= 50 ? 1900 : 2000) : rawYear;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  return text;
}

function normalizeCsvCell(header: string, value: string | undefined): string {
  const text = String(value || "").trim();
  if (header === "sex") {
    const sex = text.toLowerCase();
    if (sex === "m" || sex === "male" || sex === "boy") return "Male";
    if (sex === "f" || sex === "female" || sex === "girl") return "Female";
    return text;
  }
  if (header === "date" || header === "dob") return normalizeDateValue(text);
  if (["height", "bodyweight", "sprint10", "drill505", "cmjHeight", "mRsi", "trapBarE1RM"].includes(header)) {
    const numeric = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return numeric ? numeric[0] : text;
  }
  return text;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeCsvHeader);
  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row: CsvRow = { id: `row-${rowIndex + 1}` };
    headers.forEach((header, index) => { row[header] = normalizeCsvCell(header, values[index]); });
    return row;
  });
}

function escapeCsvValue(value: string | undefined): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsvText(rows: CsvRow[]): string {
  const headerRow = templateHeaders.join(",");
  const dataRows = rows.map((row) => templateHeaders.map((header) => escapeCsvValue(row[header])).join(","));
  return [headerRow, ...dataRows].join("\n");
}

function validateImportRow(row: CsvRow): string {
  if (!row.name) return "Missing athlete name";
  if (!row.sex || !["Male", "Female"].includes(row.sex)) return "Sex must be Male or Female";
  if (!isIsoDate(row.date)) return "Use YYYY-MM-DD or MM/DD/YYYY for test date";
  if (!isIsoDate(row.dob)) return "Use YYYY-MM-DD or MM/DD/YYYY for DOB";
  if (!row.bodyweight) return "Body weight is required";
  return "Complete";
}

function csvRowToAthlete(row: CsvRow): AthleteData {
  return {
    name: row.name || blankAthlete.name,
    sex: row.sex || blankAthlete.sex,
    date: row.date || new Date().toISOString().slice(0, 10),
    dob: row.dob || blankAthlete.dob,
    sport: row.sport || "Basketball",
    position: row.position || blankAthlete.position,
    height: row.height || blankAthlete.height,
    bodyweight: row.bodyweight || blankAthlete.bodyweight,
    sprint10: row.sprint10 || blankAthlete.sprint10,
    drill505: row.drill505 || blankAthlete.drill505,
    cmjHeight: row.cmjHeight || blankAthlete.cmjHeight,
    mRsi: row.mRsi || blankAthlete.mRsi,
    trapBarE1RM: row.trapBarE1RM || blankAthlete.trapBarE1RM,
  };
}

function getImportReview(athletes: AthleteProfileRecord[], data: AthleteData, uploadStatus: string): ReviewedCsvRow["review"] {
  if (uploadStatus !== "Complete") {
    return { status: uploadStatus, message: "Fix this row before saving.", canSave: false };
  }

  const matchResult = getAthleteMatchResult(athletes, data, null);
  if (matchResult.status === "ambiguous") {
    return { status: "Needs Review", message: matchResult.message, canSave: false };
  }
  return { status: "Ready", message: matchResult.message, canSave: true };
}

function CsvImport({
  coach,
  onBack,
  onView,
  onSaveRows,
}: {
  coach: CoachWorkspace;
  onBack: () => void;
  onView: (data: AthleteData) => void;
  onSaveRows: (items: ReviewedCsvRow[]) => void;
}) {
  const [csvText, setCsvText] = useState(templateHeaders.join(",") + "\n");
  const [activeFixRowId, setActiveFixRowId] = useState<string | null>(null);
  const rows = useMemo(() => parseCsv(csvText), [csvText]);
  const activeAthletes = useMemo(() => getActiveAthletes(coach.athletes), [coach.athletes]);
  const reviewedRows = useMemo(() => {
    const preparedRows = rows.map((row) => {
      const data = csvRowToAthlete(row);
      return { row, data, profile: buildProfile(data), upload: validateImportRow(row) };
    });

    return preparedRows.map((item) => {
      let review = getImportReview(activeAthletes, item.data, item.upload);
      const identity = getReportIdentity(item.data);
      const duplicateMissingDobRows = preparedRows.filter((otherItem) => {
        const otherIdentity = getReportIdentity(otherItem.data);
        return identity.name && !identity.dob && otherIdentity.name === identity.name && !otherIdentity.dob;
      });
      if (review.canSave && duplicateMissingDobRows.length > 1) {
        review = { status: "Needs Review", message: "Needs review: duplicate CSV rows share this name and DOB is missing.", canSave: false };
      }
      return { ...item, review, canSave: review.canSave };
    });
  }, [activeAthletes, rows]);

  const readyRows = reviewedRows.filter((item) => item.canSave);
  const issueCount = reviewedRows.filter((item) => !item.canSave).length;

  function updateRowField(rowId: string, field: AthleteDataKey, value: string): void {
    setActiveFixRowId(rowId);
    const updatedRows = rows.map((row) => row.id === rowId ? { ...row, [field]: value } : row);
    setCsvText(rowsToCsvText(updatedRows));
  }

  function downloadTemplate(): void {
    const example = `${templateHeaders.join(",")}\nExample Athlete,Male,2026-05-10,2008-04-15,Basketball,Guard,72,179,1.68,2.07,14.6,0.49,350`;
    const blob = new Blob([example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "athlete-profile-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setActiveFixRowId(null);
      setCsvText(String(reader.result || ""));
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandedPageHeader eyebrow="CSV Import" title="Import PEAQ Reports" copy="Use the template CSV to import one or multiple athletes into your workspace.">
          <button onClick={downloadTemplate} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Download Template</button>
          <button onClick={onBack} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90">Back</button>
        </BrandedPageHeader>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Upload or Paste CSV</h2>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="mt-5 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" />
            <textarea value={csvText} onChange={(event) => { setActiveFixRowId(null); setCsvText(event.target.value); }} className="mt-5 h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs outline-none focus:border-slate-500" />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"><button onClick={() => onSaveRows(readyRows)} disabled={readyRows.length === 0} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-40">Save Ready Rows</button><p className="text-sm font-bold text-slate-500">{readyRows.length} ready · {issueCount} need attention</p></div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Import Review</p>
            <h2 className="text-2xl font-black">Athlete Rows</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_0.8fr_1fr_1fr_0.7fr_1fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 lg:grid"><div>Name</div><div>Upload</div><div>Profile</div><div>Limiter</div><div>Rating</div><div>Actions</div></div>
              <div className="divide-y divide-slate-100">
                {reviewedRows.map((item) => {
                  const showFixPanel = !item.canSave || activeFixRowId === item.row.id;
                  return (
                    <div key={item.row.id} className="grid gap-3 bg-white px-4 py-4 lg:grid-cols-[1fr_0.8fr_1fr_1fr_0.7fr_1fr] lg:items-center">
                      <div><p className="font-black text-slate-950">{item.data.name || "Missing Name"}</p><p className="text-xs font-semibold text-slate-500">{[item.data.dob ? `DOB: ${item.data.dob}` : null, item.data.sex, item.data.sport, item.data.position].filter(Boolean).join(" · ")}</p></div>
                      <div><span className={`rounded-full px-3 py-1 text-xs font-black ${importStatusTone(item.review.status)}`}>{item.review.status}</span><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.review.message}</p></div>
                      <div className="text-sm font-black text-slate-800">{item.profile.archetype}</div>
                      <div><LimiterPill value={item.profile.primaryLimiter} /></div>
                      <div><span className="text-sm font-black text-slate-700">{isFiniteNumber(item.profile.rating) ? item.profile.rating.toFixed(1) : "—"}</span></div>
                      <div className="flex flex-wrap gap-2"><button onClick={() => onView(item.data)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">View</button><button onClick={() => onSaveRows([item])} disabled={!item.canSave} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-40">Save</button></div>
                      {showFixPanel ? (
                      <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-6">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-black text-slate-950">Fix this row</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold text-slate-500">Edits update the CSV text and re-check automatically.</p>
                            {item.canSave ? <button onClick={() => setActiveFixRowId(null)} className="rounded-xl bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-100">Done</button> : null}
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <CsvQuickFixField label="Name" value={item.row.name} onChange={(value) => updateRowField(item.row.id, "name", value)} />
                          <CsvQuickFixSelect label="Sex" value={item.row.sex} onChange={(value) => updateRowField(item.row.id, "sex", value)}>
                            <option value="">Select sex</option>
                            <option>Male</option>
                            <option>Female</option>
                          </CsvQuickFixSelect>
                          <CsvQuickFixField label="Test Date" type="date" value={item.row.date} onChange={(value) => updateRowField(item.row.id, "date", value)} />
                          <CsvQuickFixField label="DOB" type="date" value={item.row.dob} onChange={(value) => updateRowField(item.row.id, "dob", value)} />
                          <CsvQuickFixField label="Sport" value={item.row.sport} onChange={(value) => updateRowField(item.row.id, "sport", value)} />
                          <CsvQuickFixField label="Position" value={item.row.position} onChange={(value) => updateRowField(item.row.id, "position", value)} />
                          <CsvQuickFixField label="Height" value={item.row.height} onChange={(value) => updateRowField(item.row.id, "height", value)} />
                          <CsvQuickFixField label="Body Weight" value={item.row.bodyweight} onChange={(value) => updateRowField(item.row.id, "bodyweight", value)} />
                        </div>
                      </div>
                      ) : null}
                    </div>
                  );
                })}
                {reviewedRows.length === 0 && <div className="p-10 text-center"><p className="text-lg font-black text-slate-950">No rows found.</p><p className="text-sm text-slate-500">Paste CSV data or upload a CSV file.</p></div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CsvQuickFixField({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#1e94d2]" />
    </label>
  );
}

function CsvQuickFixSelect({ label, value, onChange, children }: { label: string; value?: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value || ""} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#1e94d2]">
        {children}
      </select>
    </label>
  );
}

function ReportComparison({ reports, onPrintComparison }: { reports: SavedReport[]; onPrintComparison?: (reportA: SavedReport, reportB: SavedReport) => void }) {
  const [reportAId, setReportAId] = useState(reports[1]?.id || reports[0]?.id || "");
  const [reportBId, setReportBId] = useState(reports[0]?.id || "");

  useEffect(() => {
    setReportAId(reports[1]?.id || reports[0]?.id || "");
    setReportBId(reports[0]?.id || "");
  }, [reports]);

  if (reports.length < 2) return null;

  const reportA = reports.find((report) => report.id === reportAId) || reports[0];
  const reportB = reports.find((report) => report.id === reportBId) || reports[1] || reports[0];
  if (!reportA || !reportB) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">Report Comparison</p>
          <h2 className="text-2xl font-black">Compare Reports</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[640px] lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <SelectField label="Report A (From)" value={reportA.id} onChange={setReportAId}>
            {reports.map((report, index) => <option key={report.id} value={report.id}>{reportOptionLabel(report, index)}</option>)}
          </SelectField>
          <SelectField label="Report B (To)" value={reportB.id} onChange={setReportBId}>
            {reports.map((report, index) => <option key={report.id} value={report.id}>{reportOptionLabel(report, index)}</option>)}
          </SelectField>
          {onPrintComparison ? <button onClick={() => onPrintComparison(reportA, reportB)} className="rounded-2xl bg-[#1e94d2] px-5 py-3 text-sm font-black text-white hover:bg-[#167bb0]">Print Progress Report</button> : null}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[1.25fr_0.85fr_0.85fr_0.9fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 md:grid">
          <div>Metric</div><div>Report A</div><div>Report B</div><div>Change A -&gt; B</div>
        </div>
        <div className="divide-y divide-slate-100">
          {comparisonMetrics.map((metric) => {
            const valueA = getComparisonValue(reportA, metric.key);
            const valueB = getComparisonValue(reportB, metric.key);
            const change = getComparisonChange(metric, reportA, reportB);
            return (
              <div key={metric.key} className="grid gap-3 px-4 py-3 md:grid-cols-[1.25fr_0.85fr_0.85fr_0.9fr] md:items-center">
                <div>
                  <p className="font-black text-slate-950">{metric.label}</p>
                  <p className="text-xs font-semibold text-slate-500">{metric.direction === "lower" ? "Lower is better" : "Higher is better"}</p>
                </div>
                <div className="text-sm font-black text-slate-800">{formatComparisonValue(valueA, metric)}</div>
                <div className="text-sm font-black text-slate-800">{formatComparisonValue(valueB, metric)}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${change.tone}`}>{change.label}</span>
                  <span className="text-sm font-black text-slate-700">{change.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AthleteProfile({
  athlete,
  onBack,
  onRunReport,
  onArchive,
  onRestore,
  onOpenReport,
  onPrintComparison,
}: {
  athlete: AthleteProfileRecord;
  onBack: () => void;
  onRunReport: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onOpenReport: (report: SavedReport) => void;
  onPrintComparison: (reportA: SavedReport, reportB: SavedReport) => void;
}) {
  const archived = isArchivedAthlete(athlete);
  const latest = athlete.reports[0];
  if (!latest) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <BrandedPageHeader eyebrow="Athlete Profile" title={athlete.name} copy={getAthleteIdentityLine(athlete)}>
            {archived ? <button onClick={onRestore} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90">Restore Athlete</button> : <button onClick={onRunReport} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90">Run New Report</button>}
            {!archived ? <button onClick={onArchive} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Archive Athlete</button> : null}
            <button onClick={onBack} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Back to Athlete Library</button>
          </BrandedPageHeader>
          {archived ? <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">This athlete is archived and hidden from the active Athlete Library. Restore the profile to run new reports.</section> : null}
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-950">No saved reports yet.</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">Run a new report or import a complete CSV row for this athlete before reviewing scores, limiters, or report history.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandedPageHeader eyebrow="Athlete Profile" title={athlete.name} copy={getAthleteIdentityLine(athlete)}>
          {archived ? <button onClick={onRestore} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90">Restore Athlete</button> : <button onClick={onRunReport} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90">Run New Report</button>}
          {!archived ? <button onClick={onArchive} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Archive Athlete</button> : null}
          <button onClick={onBack} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Back to Athlete Library</button>
        </BrandedPageHeader>
        {archived ? <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">This athlete is archived and hidden from the active Athlete Library. Restore the profile to run new reports.</section> : null}
        <section className="grid gap-4 md:grid-cols-4"><SummaryCard label="Reports" value={athlete.reports.length} helper="Saved testing dates" /><SummaryCard label="Latest Overall" value={isFiniteNumber(latest.overall) ? latest.overall.toFixed(0) : "—"} helper="Current score" /><SummaryCard label="Latest Rating" value={isFiniteNumber(latest.rating) ? latest.rating.toFixed(1) : "—"} helper="Profile stars" /><SummaryCard label="Current Limiter" value={latest.primaryLimiter} helper="Primary priority" /></section>
        <ReportComparison reports={athlete.reports} onPrintComparison={onPrintComparison} />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-slate-500">Report History</p><h2 className="text-2xl font-black">Saved Reports</h2><div className="mt-5 grid gap-3">{athlete.reports.map((report) => <button key={report.id} onClick={() => onOpenReport(report)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-slate-950">{report.date}</p><p className="text-sm font-semibold text-slate-500">{[report.archetype, report.status, getCorrectionNote(report)].filter(Boolean).join(" · ")}</p></div><div className="flex flex-wrap gap-2"><StatusPill value={report.status} /><LimiterPill value={report.primaryLimiter} /></div></div></button>)}</div></section>
      </div>
    </main>
  );
}

function CorrectionAuditTrail({ report }: { report: SavedReport }) {
  const history = getCorrectionHistory(report);
  if (!history.length) return null;

  const auditItems = history.map((revision, index) => {
    const nextVersion = history[index + 1] || report;
    return {
      revision,
      changes: getCorrectionChanges(revision, nextVersion),
    };
  }).reverse();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">Correction Audit Trail</p>
          <h2 className="text-2xl font-black tracking-tight">Previous Versions</h2>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">{history.length} stored {history.length === 1 ? "version" : "versions"}</span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">Corrections update the active PEAQ Profile, but the prior version is kept here so a coach can see what changed.</p>

      <div className="mt-5 grid gap-4">
        {auditItems.map(({ revision, changes }, index) => (
          <div key={revision.id || `${revision.archivedAt}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-950">Correction {auditItems.length - index}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">Previous version archived on {formatDate(revision.archivedAt)} · Testing date {formatDate(revision.date)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill value={revision.status || "Previous Version"} />
                <LimiterPill value={revision.primaryLimiter || "Previous Limiter"} />
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="hidden grid-cols-[0.9fr_1fr_1fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 md:grid">
                <div>Field</div><div>Before</div><div>After</div>
              </div>
              <div className="divide-y divide-slate-100">
                {changes.length ? changes.map((change) => (
                  <div key={change.key} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[0.9fr_1fr_1fr] md:items-center">
                    <div className="font-black text-slate-950">{change.label}</div>
                    <div className="font-semibold text-slate-500">{formatAuditValue(change.previousValue)}</div>
                    <div className="font-black text-slate-800">{formatAuditValue(change.nextValue)}</div>
                  </div>
                )) : (
                  <div className="px-4 py-4 text-sm font-semibold text-slate-500">No field-level changes were detected.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SavedReportView({
  athlete,
  report,
  onBack,
  onCorrect,
  onPrintReport,
}: {
  athlete: AthleteProfileRecord;
  report: SavedReport;
  onBack: () => void;
  onCorrect: () => void;
  onPrintReport: (data: AthleteData, profile: Profile) => void;
}) {
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandedPageHeader eyebrow="Saved PEAQ Profile" title={athlete.name} copy={[report.date, getCorrectionNote(report)].filter(Boolean).join(" · ")}>
          <button onClick={onBack} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Back to Athlete Profile</button>
        </BrandedPageHeader>
        <DashboardReport
          data={report.data}
          profile={report.profile}
          onSave={null}
          onBack={onBack}
          onPrintReport={() => onPrintReport(report.data, report.profile)}
          auditNote={getCorrectionNote(report)}
          extraActions={<button onClick={onCorrect} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Correct Report</button>}
        />
        <CorrectionAuditTrail report={report} />
      </div>
    </main>
  );
}

function AuthCard({
  onCreateCoach,
  cloudEnabled,
  authMessage,
  onSignIn,
  onSignUp,
  onPasswordReset,
}: {
  onCreateCoach: (coach: CoachWorkspace) => void;
  cloudEnabled: boolean;
  authMessage: string;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, organization: string, password: string) => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", email: "", organization: "", password: "" });
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [submitting, setSubmitting] = useState(false);
  const valueCards = [
    { title: "Import", copy: "Enter testing data manually or upload it from CSV." },
    { title: "Profile", copy: "Archetype athletes from speed, COD, jump, strength, and efficiency." },
    { title: "Track", copy: "Save report history and compare progress over time." },
  ];
  function update(key: "name" | "email" | "organization" | "password", value: string): void { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(): Promise<void> {
    if (!cloudEnabled) {
      if (!form.name.trim() || !form.email.trim() || !form.organization.trim()) return;
      onCreateCoach({ id: slugify(`${form.name}-${form.organization}`), name: form.name, email: form.email, organization: form.organization, athletes: [] });
      return;
    }
    if (!form.email.trim() || !form.password.trim()) return;
    if (mode === "sign-up" && (!form.name.trim() || !form.organization.trim())) return;

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await onSignIn(form.email, form.password);
      } else {
        await onSignUp(form.name, form.email, form.organization, form.password);
      }
    } finally {
      setSubmitting(false);
    }
  }
  async function resetPassword(): Promise<void> {
    if (!cloudEnabled || !form.email.trim()) return;
    setSubmitting(true);
    try {
      await onPasswordReset(form.email);
    } finally {
      setSubmitting(false);
    }
  }
  function submitLocalWorkspace(): void {
    if (!form.name.trim() || !form.email.trim() || !form.organization.trim()) return;
    onCreateCoach({ id: slugify(`${form.name}-${form.organization}`), name: form.name, email: form.email, organization: form.organization, athletes: [] });
  }
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#231f20] p-8 text-white shadow-sm md:p-10">
          <div className="relative">
            <div className="flex items-center gap-3">
              <BrandMark variant="wordmark" tone="light" className="h-10 max-w-[180px]" />
            </div>
            <h1 className="mt-8 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Turn <span className="text-[#1e94d2]">data</span> into <span className="text-[#1e94d2]">decisions</span> with coach-ready profiling and reporting.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">Create your PEAQ workspace to build athlete profiles, import testing data, and generate clean performance reports.</p>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {valueCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="mb-4 h-1.5 w-10 rounded-full bg-[#1e94d2]" aria-hidden="true" />
                  <p className="text-sm font-black text-white">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{card.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex justify-center py-4">
            <BrandMark variant="symbol" className="h-24 w-24 md:h-32 md:w-32" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight">{cloudEnabled ? (mode === "sign-in" ? "Sign In to PEAQ" : "Create Your PEAQ Workspace") : "Create Your PEAQ Workspace"}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{cloudEnabled ? "Use your coach account to access protected athlete profiles, saved reports, and cloud report history." : "Start by setting up your coach workspace. You can add athletes after your account is created."}</p>
          {authMessage ? <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700">{authMessage}</div> : null}
          <div className="mt-6 space-y-4">
            {(!cloudEnabled || mode === "sign-up") ? <Field label="Coach Name" value={form.name} onChange={(value) => update("name", value)} /> : null}
            <Field label="Email" value={form.email} onChange={(value) => update("email", value)} />
            {cloudEnabled ? <Field label="Password" type="password" value={form.password} onChange={(value) => update("password", value)} /> : null}
            {(!cloudEnabled || mode === "sign-up") ? <Field label="Organization" value={form.organization} onChange={(value) => update("organization", value)} /> : null}
            <button onClick={cloudEnabled ? submit : submitLocalWorkspace} disabled={submitting} className="w-full rounded-2xl bg-[#1e94d2] px-5 py-4 text-sm font-black text-white hover:bg-[#167bb0] disabled:opacity-50">{submitting ? "Working..." : cloudEnabled ? (mode === "sign-in" ? "Sign In" : "Create Workspace") : "Create Workspace"}</button>
            {cloudEnabled ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-black">
                <button onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} className="text-[#1e94d2] hover:text-[#167bb0]">{mode === "sign-in" ? "Create an account" : "Already have an account?"}</button>
                <button onClick={resetPassword} disabled={submitting || !form.email.trim()} className="text-slate-500 hover:text-slate-800 disabled:opacity-40">Reset password</button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Workspace({
  coach,
  onLogout,
  onRunReport,
  onCsvImport,
  onOpenAthlete,
  onRestoreAthlete,
  onGuide,
  onPrintReport,
  syncStatus,
}: {
  coach: CoachWorkspace;
  onLogout: () => void;
  onRunReport: () => void;
  onCsvImport: () => void;
  onOpenAthlete: (id: string) => void;
  onRestoreAthlete: (id: string) => void;
  onGuide: () => void;
  onPrintReport: (data: AthleteData, profile: Profile) => void;
  syncStatus?: string;
}) {
  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySort, setLibrarySort] = useState("name-asc");
  const [sexFilter, setSexFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [archetypeFilter, setArchetypeFilter] = useState("all");
  const [limiterFilter, setLimiterFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const activeAthletes = useMemo(() => getActiveAthletes(coach.athletes), [coach.athletes]);
  const archivedAthletes = useMemo(() => coach.athletes.filter(isArchivedAthlete), [coach.athletes]);
  const libraryAthletes = showArchived ? coach.athletes : activeAthletes;
  const totalReports = activeAthletes.reduce((sum, athlete) => sum + athlete.reports.length, 0);
  const latestReports = activeAthletes.map((athlete) => getLatestReport(athlete)).filter((report): report is SavedReport => Boolean(report));
  const avgRating = latestReports.length ? latestReports.reduce((sum, report) => sum + (report.rating || 0), 0) / latestReports.length : null;
  const filterOptions = useMemo(() => ({
    sex: uniqueOptions(libraryAthletes.map((athlete) => athlete.sex)),
    sport: uniqueOptions(libraryAthletes.map((athlete) => athlete.sport)),
    archetype: uniqueOptions(libraryAthletes.map((athlete) => getLatestReport(athlete)?.archetype)),
    limiter: uniqueOptions(libraryAthletes.map((athlete) => getLatestReport(athlete)?.primaryLimiter)),
  }), [libraryAthletes]);
  const filteredAthletes = useMemo(() => {
    const search = librarySearch.trim().toLowerCase();
    const visible = libraryAthletes.filter((athlete) => {
      const latest = getLatestReport(athlete);
      const matchesSearch = !search || athlete.name.toLowerCase().includes(search);
      const matchesSex = sexFilter === "all" || athlete.sex === sexFilter;
      const matchesSport = sportFilter === "all" || athlete.sport === sportFilter;
      const matchesArchetype = archetypeFilter === "all" || latest?.archetype === archetypeFilter;
      const matchesLimiter = limiterFilter === "all" || latest?.primaryLimiter === limiterFilter;
      const matchesRating = starRatingMatches(latest?.rating, ratingFilter);
      return matchesSearch && matchesSex && matchesSport && matchesArchetype && matchesLimiter && matchesRating;
    });

    return [...visible].sort((a, b) => {
      const latestA = getLatestReport(a);
      const latestB = getLatestReport(b);
      if (librarySort === "name-desc") return b.name.localeCompare(a.name);
      if (librarySort === "rating-desc") return (isFiniteNumber(latestB?.rating) ? latestB.rating : -1) - (isFiniteNumber(latestA?.rating) ? latestA.rating : -1);
      if (librarySort === "rating-asc") return (isFiniteNumber(latestA?.rating) ? latestA.rating : 999) - (isFiniteNumber(latestB?.rating) ? latestB.rating : 999);
      if (librarySort === "date-desc") return String(latestB?.date || "").localeCompare(String(latestA?.date || ""));
      if (librarySort === "date-asc") return String(latestA?.date || "").localeCompare(String(latestB?.date || ""));
      return a.name.localeCompare(b.name);
    });
  }, [archetypeFilter, libraryAthletes, librarySearch, librarySort, limiterFilter, ratingFilter, sexFilter, sportFilter]);
  const filtersActive = librarySearch || sexFilter !== "all" || sportFilter !== "all" || archetypeFilter !== "all" || limiterFilter !== "all" || ratingFilter !== "all" || librarySort !== "name-asc" || showArchived;

  function clearLibraryFilters() {
    setLibrarySearch("");
    setLibrarySort("name-asc");
    setSexFilter("all");
    setSportFilter("all");
    setArchetypeFilter("all");
    setLimiterFilter("all");
    setRatingFilter("all");
    setShowArchived(false);
  }

  function exportWorkspaceData() {
    const exportedAt = new Date().toISOString();
    const workspaceExport = {
      exportVersion: 1,
      exportedAt,
      source: "PEAQ Analytics localStorage beta",
      coach: normalizeCoachWorkspace(coach),
    };
    const blob = new Blob([JSON.stringify(workspaceExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `peaq-workspace-${slugify(coach.organization || coach.name || "backup")}-${formatDate(exportedAt)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-[#231f20] p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <BrandMark variant="wordmark" tone="light" className="h-9 max-w-[168px]" />
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white/70">Logged in as {coach.name}</span>
                {syncStatus ? <span className="rounded-full bg-[#1e94d2]/20 px-3 py-1 text-sm font-bold text-[#8ed5f5]">{syncStatus}</span> : null}
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">{coach.organization}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">PEAQ Analytics workspace.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={onRunReport} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90">Run New Report</button>
              <button onClick={onCsvImport} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Import CSV</button>
              <button onClick={onGuide} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Scoring Guide</button>
              <button onClick={onLogout} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Log Out</button>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-5"><SummaryCard label="Athletes" value={activeAthletes.length} helper={archivedAthletes.length ? `${archivedAthletes.length} archived` : "Active profiles"} /><SummaryCard label="All Reports" value={totalReports} helper="Active testing dates" /><SummaryCard label="Recent Reports" value={latestReports.length} helper="Current snapshots" /><SummaryCard label="Avg Rating" value={avgRating ? avgRating.toFixed(1) : "—"} helper="Latest reports only" /><button onClick={onRunReport} className="rounded-3xl bg-[#1e94d2] p-5 text-left text-white shadow-sm hover:bg-[#167bb0]"><p className="text-xs font-black uppercase tracking-wide text-white/70">New Report</p><p className="mt-2 text-2xl font-black tracking-tight">Run Report</p><p className="mt-1 text-sm font-semibold text-white/75">Start a fresh athlete profile</p></button></section>
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Workspace Backup</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Export beta data</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Download a JSON backup of this coach workspace, including athletes, saved reports, and correction history.</p>
          </div>
          <button onClick={exportWorkspaceData} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Export Workspace Data</button>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="text-sm font-black uppercase tracking-wide text-slate-500">Athlete Library</p><h2 className="text-2xl font-black tracking-tight">Profiles</h2></div>
            <p className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">Account Data Is Isolated</p>
          </div>

          {coach.athletes.length > 0 ? (
            <div className="mt-5 rounded-[2rem] bg-slate-50 p-4">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Search Athlete</span>
                  <input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-500" placeholder="Search by athlete name" />
                </label>
                <SelectField label="Sort" value={librarySort} onChange={setLibrarySort}>
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </SelectField>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <SelectField label="Sex" value={sexFilter} onChange={setSexFilter}><option value="all">All</option>{filterOptions.sex.map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
                <SelectField label="Sport" value={sportFilter} onChange={setSportFilter}><option value="all">All</option>{filterOptions.sport.map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
                <SelectField label="Archetype" value={archetypeFilter} onChange={setArchetypeFilter}><option value="all">All</option>{filterOptions.archetype.map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
                <SelectField label="Primary Limiter" value={limiterFilter} onChange={setLimiterFilter}><option value="all">All</option>{filterOptions.limiter.map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
                <SelectField label="Star Rating" value={ratingFilter} onChange={setRatingFilter}>{starRatingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-black text-slate-600">Showing {filteredAthletes.length} of {libraryAthletes.length} {showArchived ? "total" : "active"} athletes</p>
                  {archivedAthletes.length ? (
                    <label className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
                      <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="h-4 w-4 accent-[#1e94d2]" />
                      Show archived
                    </label>
                  ) : null}
                </div>
                <button onClick={clearLibraryFilters} disabled={!filtersActive} className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-40">Clear Filters</button>
              </div>
            </div>
          ) : null}

          {coach.athletes.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-2xl font-black text-slate-950">No athletes yet.</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">Run a new report or import a CSV to start building your athlete library.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                <button onClick={onRunReport} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Run New Report</button>
                <button onClick={onCsvImport} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-100">Import CSV</button>
              </div>
            </div>
          ) : filteredAthletes.length === 0 ? (
            <div className="mt-5 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-2xl font-black text-slate-950">{activeAthletes.length === 0 && archivedAthletes.length > 0 && !showArchived ? "No active athletes." : "No matches found."}</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{activeAthletes.length === 0 && archivedAthletes.length > 0 && !showArchived ? "Turn on Show archived to view or restore hidden athlete profiles." : "Adjust the search or filters to show more athletes."}</p>
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1.2fr_1.15fr_1.15fr_1fr_0.8fr_1fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 lg:grid">
                <div>Name</div><div>Latest Archetype</div><div>Latest Status</div><div>Primary Limiter</div><div>Rating</div><div>Actions</div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredAthletes.map((athlete) => {
                  const latest = getLatestReport(athlete);
                  return (
                    <div key={athlete.id} className="grid gap-3 bg-white px-4 py-4 lg:grid-cols-[1.2fr_1.15fr_1.15fr_1fr_0.8fr_1fr] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">{athlete.name}</p>
                          {isArchivedAthlete(athlete) ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-900">Archived</span> : null}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{getAthleteIdentityLine(athlete)}</p>
                      </div>
                      <div className="text-sm font-black text-slate-800">{latest?.archetype || "No reports yet"}</div>
                      <div><StatusPill value={latest?.status} /></div>
                      <div><LimiterPill value={latest?.primaryLimiter || "No limiter yet"} /></div>
                      <div><StarRating value={latest?.rating} /></div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button onClick={() => onOpenAthlete(athlete.id)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">Open Profile</button>
                        {isArchivedAthlete(athlete) ? <button onClick={() => onRestoreAthlete(athlete.id)} className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-900 hover:bg-amber-200">Restore</button> : null}
                        <button onClick={() => latest && onPrintReport(latest.data, latest.profile)} disabled={!latest} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-40">Print Latest</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AthleteProfilingMVP() {
  const [coach, setCoach] = useState<CoachWorkspace | null>(() => supabaseConfig.isConfigured ? null : loadStoredCoach());
  const [authSession, setAuthSession] = useState<SupabaseSession | null>(() => supabaseConfig.isConfigured ? loadStoredSupabaseSession() : null);
  const [cloudStatus, setCloudStatus] = useState(supabaseConfig.isConfigured ? "Cloud accounts enabled." : "");
  const [authMessage, setAuthMessage] = useState(supabaseConfig.isConfigured ? "Sign in or create an account to use your protected beta workspace." : "");
  const [cloudLoadedForUser, setCloudLoadedForUser] = useState<string | null>(null);
  const [view, setView] = useState<ViewName>("auth");
  const [builderData, setBuilderData] = useState<AthleteData>(blankAthlete);
  const [builderAthleteId, setBuilderAthleteId] = useState<string | null>(null);
  const [builderReportId, setBuilderReportId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<AthleteData | null>(null);
  const [printProfile, setPrintProfile] = useState<Profile | null>(null);
  const [progressPrint, setProgressPrint] = useState<{ athlete: AthleteProfileRecord; reportA: SavedReport; reportB: SavedReport } | null>(null);

  function navigate(nextView: ViewName, options: { athleteId?: string | null; reportId?: string | null; replace?: boolean } = {}): void {
    const hasAthleteId = Object.prototype.hasOwnProperty.call(options, "athleteId");
    const hasReportId = Object.prototype.hasOwnProperty.call(options, "reportId");
    const nextAthleteId = hasAthleteId ? options.athleteId ?? null : selectedAthleteId;
    const nextReportId = hasReportId ? options.reportId ?? null : selectedReportId;
    const nextState: AppHistoryState = { view: nextView, selectedAthleteId: nextAthleteId, selectedReportId: nextReportId };

    setSelectedAthleteId(nextAthleteId);
    setSelectedReportId(nextReportId);
    setView(nextView);

    if (typeof window === "undefined") return;
    if (options.replace) {
      window.history.replaceState(nextState, "", window.location.pathname);
      return;
    }
    window.history.pushState(nextState, "", window.location.pathname);
  }

  useEffect(() => {
    saveStoredCoach(coach);
  }, [coach]);

  useEffect(() => {
    saveStoredSupabaseSession(authSession);
  }, [authSession]);

  useEffect(() => {
    if (!supabaseConfig.isConfigured || !authSession || cloudLoadedForUser === authSession.user.id) return;
    if (authSession.expiresAt && authSession.expiresAt < Date.now() + 60_000) {
      void refreshSupabaseSession(authSession.refreshToken)
        .then((session) => setAuthSession(session))
        .catch(() => {
          setAuthSession(null);
          setAuthMessage("Session expired. Please sign in again.");
        });
      return;
    }
    void loadCloudWorkspace(authSession, "Loaded cloud workspace.");
  }, [authSession, cloudLoadedForUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialState = window.history.state as Partial<AppHistoryState> | null;
    if (!initialState?.view) {
      const initialView: ViewName = coach ? "workspace" : "auth";
      window.history.replaceState({ view: initialView, selectedAthleteId: null, selectedReportId: null }, "", window.location.pathname);
      if (coach && view === "auth") setView("workspace");
    }

    function handlePopState(event: PopStateEvent): void {
      const state = event.state as AppHistoryState | null;
      if (!state?.view) {
        setSelectedAthleteId(null);
        setSelectedReportId(null);
        setView(coach ? "workspace" : "auth");
        return;
      }
      setSelectedAthleteId(state.selectedAthleteId ?? null);
      setSelectedReportId(state.selectedReportId ?? null);
      setView(state.view);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [coach, view]);

  async function loadCloudWorkspace(session: SupabaseSession, successMessage: string): Promise<void> {
    setCloudStatus("Loading cloud workspace...");
    try {
      const cloudCoach = await loadCoachFromSupabase(session);
      const localCoach = loadStoredCoach();
      if (cloudCoach.athletes.length === 0 && localCoach?.athletes.length) {
        const migratedCoach = normalizeCoachWorkspace({
          ...localCoach,
          id: session.user.id,
          email: session.user.email || localCoach.email,
        }) || localCoach;
        await saveCoachToSupabase(migratedCoach, session);
        setCoach(migratedCoach);
        setCloudStatus("Local workspace migrated and synced to Supabase.");
      } else {
        setCoach(cloudCoach);
        setCloudStatus(successMessage);
      }
      setCloudLoadedForUser(session.user.id);
      navigate("workspace", { athleteId: null, reportId: null, replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load cloud workspace.";
      setCloudStatus(`Cloud load failed: ${message}`);
      setAuthMessage(`Cloud load failed: ${message}`);
      setAuthSession(null);
      setCoach(null);
    }
  }

  function persistCoachToCloud(nextCoach: CoachWorkspace | null): void {
    if (!nextCoach || !authSession || !supabaseConfig.isConfigured) return;
    setCloudStatus("Saving to Supabase...");
    void saveCoachToSupabase(nextCoach, authSession)
      .then(() => setCloudStatus("Saved to Supabase."))
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Cloud save failed.";
        setCloudStatus(`Cloud save failed: ${message}`);
      });
  }

  function updateCoach(updater: (current: CoachWorkspace | null) => CoachWorkspace | null): void {
    setCoach((current) => {
      const nextCoach = updater(current);
      persistCoachToCloud(nextCoach);
      return nextCoach;
    });
  }

  async function handleCloudSignIn(email: string, password: string): Promise<void> {
    setAuthMessage("Signing in...");
    try {
      const session = await signInCoach(email.trim(), password);
      setAuthSession(session);
      setAuthMessage("Signed in.");
      await loadCloudWorkspace(session, "Loaded cloud workspace.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed.";
      setAuthMessage(`Sign in failed: ${message}`);
    }
  }

  async function handleCloudSignUp(name: string, email: string, organization: string, password: string): Promise<void> {
    setAuthMessage("Creating your PEAQ workspace...");
    try {
      const session = await signUpCoach(email.trim(), password, name.trim(), organization.trim());
      if (!session) {
        setAuthMessage("Account created. Check your email to confirm the account, then sign in.");
        return;
      }
      const localCoach = loadStoredCoach();
      const newCoach: CoachWorkspace = normalizeCoachWorkspace({
        ...(localCoach?.athletes.length ? localCoach : { athletes: [] }),
        id: session.user.id,
        name: name.trim(),
        email: email.trim(),
        organization: organization.trim(),
      }) || { id: session.user.id, name: name.trim(), email: email.trim(), organization: organization.trim(), athletes: [] };
      await saveCoachToSupabase(newCoach, session);
      setAuthSession(session);
      setCoach(newCoach);
      setCloudLoadedForUser(session.user.id);
      setAuthMessage("Workspace created.");
      setCloudStatus(localCoach?.athletes.length ? "Local workspace migrated and synced to Supabase." : "Saved to Supabase.");
      navigate("workspace", { athleteId: null, reportId: null, replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create workspace.";
      setAuthMessage(`Create workspace failed: ${message}`);
    }
  }

  async function handlePasswordReset(email: string): Promise<void> {
    setAuthMessage("Sending password reset email...");
    try {
      await sendPasswordReset(email.trim());
      setAuthMessage("Password reset email sent.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send password reset email.";
      setAuthMessage(`Password reset failed: ${message}`);
    }
  }

  async function handleLogout(): Promise<void> {
    const session = authSession;
    setAuthSession(null);
    setCloudLoadedForUser(null);
    setCoach(null);
    saveStoredSupabaseSession(null);
    setAuthMessage(supabaseConfig.isConfigured ? "Signed out. Sign in to return to your workspace." : "");
    setCloudStatus("");
    navigate("auth", { athleteId: null, reportId: null });
    if (session) {
      try {
        await signOutCoach(session.accessToken);
      } catch {
        // The local sign-out already succeeded; remote logout can fail if the token expired.
      }
    }
  }

  function goWorkspace(): void {
    navigate("workspace", { athleteId: null, reportId: null });
  }

  function startBlankReport(): void {
    setBuilderAthleteId(null);
    setBuilderReportId(null);
    setBuilderData({ ...blankAthlete, date: new Date().toISOString().slice(0, 10) });
    navigate("builder", { athleteId: null, reportId: null });
  }

  function startAthleteReport(athlete: AthleteProfileRecord): void {
    setBuilderAthleteId(athlete.id);
    setBuilderReportId(null);
    setBuilderData(buildAthleteReportDraft(athlete));
    navigate("builder", { athleteId: athlete.id, reportId: null });
  }

  function openAthlete(athleteId: string): void {
    navigate("athlete", { athleteId, reportId: null });
  }

  function openSavedReport(reportId: string): void {
    navigate("saved-report", { reportId });
  }

  function openPrintReport(data: AthleteData, profile: Profile): void {
    setPrintData(data);
    setPrintProfile(profile);
    navigate("print");
  }

  function openProgressReport(athlete: AthleteProfileRecord, reportA: SavedReport, reportB: SavedReport): void {
    setProgressPrint({ athlete, reportA, reportB });
    navigate("progress-print", { athleteId: athlete.id, reportId: null });
  }

  function saveReport(data: AthleteData, profile: Profile): void {
    if (!coach || !data.name.trim()) {
      alert("Add an athlete name before saving this report.");
      return;
    }
    if (builderAthleteId && builderReportId) {
      const matchingAthlete = findExactNameDobAthlete(coach.athletes, data, builderAthleteId);
      const shouldMoveToMatch = matchingAthlete
        ? window.confirm(`This correction now matches an existing athlete profile:\n\n${matchingAthlete.name}\n${getAthleteIdentityLine(matchingAthlete)}\n\nMove this corrected report to that existing profile?`)
        : false;
      const targetAthleteId = shouldMoveToMatch && matchingAthlete ? matchingAthlete.id : builderAthleteId;
      updateCoach((current) => correctSavedReport(current, builderAthleteId, builderReportId, data, profile, targetAthleteId));
      setBuilderReportId(null);
      navigate("workspace", { athleteId: targetAthleteId, reportId: null });
      window.setTimeout(() => alert(shouldMoveToMatch ? "Correction saved and moved to the matching athlete profile. Previous version kept in the audit trail." : "Correction saved. Previous version kept in the audit trail."), 100);
      return;
    }
    const entry = buildReportEntry(data, profile, builderAthleteId);
    updateCoach((current) => addReportEntries(current, [entry]));
    if (builderAthleteId) {
      navigate("athlete", { athleteId: builderAthleteId, reportId: null });
    } else {
      goWorkspace();
    }
    window.setTimeout(() => alert("Report saved to Athlete Library."), 100);
  }

  function saveImportedRows(items: ReviewedCsvRow[]): void {
    if (!coach || items.length === 0) return;
    const saveableItems = items.filter((item) => item.canSave !== false);
    if (saveableItems.length === 0) {
      alert("No ready rows to save. Review missing DOB or row errors first.");
      return;
    }
    const entries = saveableItems.map((item) => buildReportEntry(item.data, item.profile));
    const reportLabel = entries.length === 1 ? "report" : "reports";
    updateCoach((current) => addReportEntries(current, entries));
    goWorkspace();
    window.setTimeout(() => alert(`${entries.length} ${reportLabel} saved to Athlete Library.`), 100);
  }

  function setAthleteArchiveState(athleteId: string, archivedAt: string | null): void {
    updateCoach((current) => {
      const normalizedCoach = normalizeCoachWorkspace(current);
      if (!normalizedCoach) return current;
      return {
        ...normalizedCoach,
        athletes: normalizedCoach.athletes.map((athlete) => athlete.id === athleteId ? { ...athlete, archivedAt } : athlete),
      };
    });
  }

  function archiveAthlete(athlete: AthleteProfileRecord): void {
    if (!window.confirm(`Archive ${athlete.name}?\n\nThis hides the athlete and all saved reports from the active Athlete Library. You can restore the profile later.`)) return;
    setAthleteArchiveState(athlete.id, new Date().toISOString());
    goWorkspace();
    window.setTimeout(() => alert(`${athlete.name} archived. Turn on Show archived to restore this profile later.`), 100);
  }

  function restoreAthlete(athleteId: string): void {
    setAthleteArchiveState(athleteId, null);
    window.setTimeout(() => alert("Athlete restored to the active library."), 100);
  }

  function renderWorkspace(workspace: CoachWorkspace) {
    return (
      <Workspace
        coach={workspace}
        onLogout={() => { void handleLogout(); }}
        onRunReport={startBlankReport}
        onCsvImport={() => navigate("csv", { athleteId: null, reportId: null })}
        onOpenAthlete={openAthlete}
        onRestoreAthlete={restoreAthlete}
        onGuide={() => navigate("guide", { athleteId: null, reportId: null })}
        onPrintReport={openPrintReport}
        syncStatus={cloudStatus}
      />
    );
  }

  if (supabaseConfig.isConfigured && authSession && !coach) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <BrandMark variant="symbol" className="h-20 w-20" />
          <h1 className="mt-6 text-3xl font-black tracking-tight">Loading PEAQ Workspace</h1>
          <p className="mt-3 text-sm font-bold text-slate-500">{cloudStatus || "Connecting to Supabase..."}</p>
        </section>
      </main>
    );
  }

  if (!coach) return <AuthCard onCreateCoach={(newCoach) => { setCoach(newCoach); navigate("workspace", { athleteId: null, reportId: null }); }} cloudEnabled={supabaseConfig.isConfigured} authMessage={authMessage} onSignIn={handleCloudSignIn} onSignUp={handleCloudSignUp} onPasswordReset={handlePasswordReset} />;
  if (view === "guide") return <ScoringGuide onBack={goWorkspace} />;
  if (view === "print" && printData && printProfile) return <OnePageReport data={printData} profile={printProfile} onBack={goWorkspace} />;
  if (view === "progress-print" && progressPrint) return <ProgressReport athlete={progressPrint.athlete} reportA={progressPrint.reportA} reportB={progressPrint.reportB} onBack={() => openAthlete(progressPrint.athlete.id)} />;
  if (view === "builder") return <ReportBuilder data={builderData} setData={setBuilderData} onSave={saveReport} onBack={() => builderAthleteId && !builderReportId ? openAthlete(builderAthleteId) : goWorkspace()} onPrintReport={openPrintReport} mode={builderReportId ? "correction" : "new"} />;
  if (view === "csv") return <CsvImport coach={coach} onBack={goWorkspace} onView={(data) => { setBuilderAthleteId(null); setBuilderReportId(null); setBuilderData(data); navigate("builder", { athleteId: null, reportId: null }); }} onSaveRows={saveImportedRows} />;
  if (view === "athlete") {
    const athlete = coach.athletes.find((item) => item.id === selectedAthleteId);
    if (!athlete) return renderWorkspace(coach);
    return <AthleteProfile athlete={athlete} onBack={goWorkspace} onRunReport={() => startAthleteReport(athlete)} onArchive={() => archiveAthlete(athlete)} onRestore={() => restoreAthlete(athlete.id)} onOpenReport={(report) => openSavedReport(report.id)} onPrintComparison={(reportA, reportB) => openProgressReport(athlete, reportA, reportB)} />;
  }
  if (view === "saved-report") {
    const athlete = coach.athletes.find((item) => item.id === selectedAthleteId);
    const report = athlete?.reports.find((item) => item.id === selectedReportId);
    if (!athlete || !report) return renderWorkspace(coach);
    return <SavedReportView athlete={athlete} report={report} onBack={() => openAthlete(athlete.id)} onCorrect={() => { setBuilderAthleteId(athlete.id); setBuilderReportId(report.id); setBuilderData(report.data); navigate("builder", { athleteId: athlete.id, reportId: report.id }); }} onPrintReport={openPrintReport} />;
  }
  return renderWorkspace(coach);
}

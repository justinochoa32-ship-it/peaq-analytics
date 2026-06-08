import type { SavedProgram } from "./savedPrograms";

const localProgramBuilderUrl = "http://localhost:5174/";

export const programBuilderBaseUrl = normalizeProgramBuilderUrl(
  import.meta.env.VITE_PROGRAM_BUILDER_URL || localProgramBuilderUrl,
);

type ProgramBuilderProfileInput = {
  athleteName: string;
  archetype: string;
  status: string;
  primaryLimiter: string;
  secondaryLimiter: string;
  athleteId?: string | null;
  sourceReportId?: string | null;
};

type ProgramBuilderUrlOptions = {
  savedProgram?: SavedProgram;
  duplicate?: boolean;
};

function normalizeProgramBuilderUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getProgramBuilderProfileBucket(profile: Pick<ProgramBuilderProfileInput, "archetype" | "status">): string {
  if (profile.archetype === "Complete") return "Complete";
  if (profile.archetype === "Complete Athlete") return "Complete";
  if (profile.archetype === "Foundational") return "Foundational";
  if (profile.archetype === "Foundational Profile" || profile.status === "Near Complete Athlete") return "Foundational";
  if (profile.archetype === "Developmental" || profile.archetype === "Capacity-Limited" || profile.archetype === "Transfer-Limited") return profile.archetype;
  return "";
}

function encodeProgramPayload(savedProgram: SavedProgram): string {
  return window.btoa(unescape(encodeURIComponent(JSON.stringify(savedProgram))));
}

function getProfileOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function getProgramBuilderUrl(profile: ProgramBuilderProfileInput, options: ProgramBuilderUrlOptions = {}): string {
  const url = new URL(programBuilderBaseUrl);
  const profileBucket = getProgramBuilderProfileBucket(profile);

  url.searchParams.set("athleteName", profile.athleteName);
  if (profile.athleteId) url.searchParams.set("athleteId", profile.athleteId);
  if (profile.sourceReportId) url.searchParams.set("sourceReportId", profile.sourceReportId);
  if (profileBucket) url.searchParams.set("profileBucket", profileBucket);
  url.searchParams.set("primaryLimiter", profile.primaryLimiter);
  url.searchParams.set("secondaryLimiter", profile.secondaryLimiter);
  if (options.savedProgram) url.searchParams.set("savedProgram", encodeProgramPayload(options.savedProgram));
  if (options.duplicate) url.searchParams.set("duplicateProgram", "1");
  const profileOrigin = getProfileOrigin();
  if (profileOrigin) url.searchParams.set("profileOrigin", profileOrigin);

  return url.toString();
}

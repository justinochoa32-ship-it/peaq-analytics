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
};

function normalizeProgramBuilderUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getProgramBuilderProfileBucket(profile: Pick<ProgramBuilderProfileInput, "archetype" | "status">): string {
  if (profile.archetype === "Complete Athlete") return "Complete";
  if (profile.archetype === "Foundational Profile" || profile.status === "Near Complete Athlete") return "Foundational";
  if (profile.archetype === "Developmental" || profile.archetype === "Capacity-Limited" || profile.archetype === "Transfer-Limited") return profile.archetype;
  return "";
}

export function getProgramBuilderUrl(profile: ProgramBuilderProfileInput): string {
  const url = new URL(programBuilderBaseUrl);
  const profileBucket = getProgramBuilderProfileBucket(profile);

  url.searchParams.set("athleteName", profile.athleteName);
  if (profileBucket) url.searchParams.set("profileBucket", profileBucket);
  url.searchParams.set("primaryLimiter", profile.primaryLimiter);
  url.searchParams.set("secondaryLimiter", profile.secondaryLimiter);

  return url.toString();
}

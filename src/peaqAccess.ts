export type PeaqAccess = {
  canAccessProfile: boolean;
  canAccessBuild: boolean;
  canUseProfileToProgram: boolean;
  canSavePrograms: boolean;
};

function readAccessFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;

  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

const canAccessProfile = readAccessFlag(import.meta.env.VITE_PEAQ_ACCESS_PROFILE, true);
const canAccessBuild = readAccessFlag(import.meta.env.VITE_PEAQ_ACCESS_BUILD, true);

export const peaqAccess: PeaqAccess = {
  canAccessProfile,
  canAccessBuild,
  canUseProfileToProgram: readAccessFlag(import.meta.env.VITE_PEAQ_ACCESS_PROFILE_TO_PROGRAM, canAccessProfile && canAccessBuild),
  canSavePrograms: readAccessFlag(import.meta.env.VITE_PEAQ_ACCESS_SAVE_PROGRAMS, canAccessProfile && canAccessBuild),
};

export const peaqAccessMessages = {
  buildRequired: "PEAQ Build access is required to create programs from profiles.",
  saveProgramsRequired: "PEAQ Build access is required to save program history.",
};

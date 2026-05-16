import { useEffect, useMemo, useState } from "react";

const blankAthlete = {
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

const standards = {
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

const flagMap = {
  sprint10: "Acceleration",
  drill505: "COD",
  codDeficit: "COD Efficiency",
  cmjHeight: "Jump Output",
  mRsi: "Jump Efficiency",
  relativeStrength: "Strength Capacity",
};

const summaryStrengthMap = {
  sprint10: "acceleration ability",
  drill505: "change of direction ability",
  cmjHeight: "jump output",
  mRsi: "jump efficiency",
  relativeStrength: "strength capacity",
};

const templateHeaders = [
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

const brandAssets = {
  wordmark: "/assets/brand/peaq-name.png",
  wordmarkWhite: "/assets/brand/peaq-name-wht.png",
  symbol: "/assets/brand/peaq-symbol.png",
};

const comparisonMetrics = [
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
  { title: "Developmental", copy: "Multiple buckets need development, requiring a broad training emphasis." },
  { title: "Capacity-Limited", copy: "Overall horsepower and capacity are limiting the ceiling of the rest of the profile." },
  { title: "Transfer-Limited", copy: "Capacity exists, but it is not showing up cleanly in athletic expression or efficiency." },
  { title: "Foundational Profile", copy: "Solid foundational base, but needs to improve 1-2 categories to reach Complete Athlete status." },
  { title: "Profile Pending", copy: "Not enough key testing numbers have been entered yet." },
];

function loadStoredCoach() {
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

function saveStoredCoach(coach) {
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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function getAthleteDob(athlete) {
  const reportWithDob = athlete?.reports?.find((report) => report?.data?.dob);
  return String(athlete?.dob || reportWithDob?.data?.dob || "").trim();
}

function createUniqueAthleteIdFromParts(parts, usedIds) {
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

function createUniqueAthleteId(data, athletes) {
  const usedIds = new Set(athletes.map((athlete) => athlete.id));
  const dob = String(data.dob || "").trim();
  const parts = dob ? [data.name, dob] : [data.name, data.sex, data.sport, data.position];
  return createUniqueAthleteIdFromParts(parts, usedIds);
}

function normalizeAthleteProfile(athlete, index, usedIds) {
  const reports = Array.isArray(athlete.reports) ? athlete.reports : [];
  const latestData = reports[0]?.data || {};
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
    reports,
  };
}

function normalizeCoachWorkspace(coach) {
  if (!coach || !Array.isArray(coach.athletes)) return coach;
  const usedIds = new Set();
  return { ...coach, athletes: coach.athletes.map((athlete, index) => normalizeAthleteProfile(athlete, index, usedIds)) };
}

function getAthleteIdentity(athlete) {
  return {
    name: normalizeIdentity(athlete?.name),
    dob: normalizeIdentity(getAthleteDob(athlete)),
    sex: normalizeIdentity(athlete?.sex),
    sport: normalizeIdentity(athlete?.sport),
    position: normalizeIdentity(athlete?.position),
  };
}

function getReportIdentity(data) {
  return {
    name: normalizeIdentity(data?.name),
    dob: normalizeIdentity(data?.dob),
    sex: normalizeIdentity(data?.sex),
    sport: normalizeIdentity(data?.sport),
    position: normalizeIdentity(data?.position),
  };
}

function getAthleteMatchResult(athletes, data, preferredAthleteId) {
  if (preferredAthleteId) {
    const preferredAthlete = athletes.find((athlete) => athlete.id === preferredAthleteId);
    if (preferredAthlete) return { status: "matched", athlete: preferredAthlete, message: "Existing athlete profile selected." };
  }

  const reportIdentity = getReportIdentity(data);
  if (!reportIdentity.name) return { status: "new", athlete: null, message: "New athlete profile." };

  if (reportIdentity.dob) {
    const matches = athletes.filter((athlete) => {
      const athleteIdentity = getAthleteIdentity(athlete);
      return athleteIdentity.name === reportIdentity.name && athleteIdentity.dob === reportIdentity.dob;
    });
    if (matches.length === 1) return { status: "matched", athlete: matches[0], message: "Matched existing athlete by name + DOB." };
    if (matches.length > 1) return { status: "ambiguous", athlete: null, message: "Needs review: multiple profiles share this name + DOB." };
    return { status: "new", athlete: null, message: "New athlete profile." };
  }

  const sameNameAthletes = athletes.filter((athlete) => getAthleteIdentity(athlete).name === reportIdentity.name);
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

function findAthleteMatch(athletes, data, preferredAthleteId) {
  return getAthleteMatchResult(athletes, data, preferredAthleteId).athlete;
}

function buildAthleteBase(data, athleteId, existingAthlete) {
  return {
    id: athleteId,
    name: data.name || existingAthlete?.name || "Unnamed Athlete",
    dob: data.dob || getAthleteDob(existingAthlete),
    sex: data.sex || existingAthlete?.sex || "Male",
    sport: data.sport || existingAthlete?.sport || "Basketball",
    position: data.position || existingAthlete?.position || "",
    height: data.height || existingAthlete?.height || "",
    bodyweight: data.bodyweight || existingAthlete?.bodyweight || "",
    reports: [],
  };
}

function getAthleteIdentityLine(athlete) {
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

function formatDate(value) {
  return String(value || "").slice(0, 10);
}

function isIsoDate(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

function getCorrectionNote(report) {
  if (!report?.correctedAt) return null;
  return `Corrected on ${formatDate(report.correctedAt)}`;
}

function getPossessivePronoun(sex) {
  if (sex === "Female") return "her";
  if (sex === "Male") return "his";
  return "their";
}

function capitalize(value) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function getCoachSummaryText(data, profile) {
  const athleteName = data.name || "This athlete";
  const possessive = getPossessivePronoun(profile.sex);
  const archetype = profile.archetype.includes("Athlete") ? profile.archetype : `${profile.archetype} athlete`;
  return `${athleteName} currently profiles as a ${archetype}. ${capitalize(possessive)} primary limiter is ${profile.primaryLimiter}, and ${possessive} secondary limiter is ${profile.secondaryLimiter}. Currently, ${possessive} primary strength is ${profile.summaryStrength}. ${capitalize(possessive)} primary training priority should be ${profile.trainingFocus.primary}, with ${profile.trainingFocus.secondary} layered in as a secondary focus, while maintaining ${profile.trainingFocus.maintain}.`;
}

function importStatusTone(status) {
  if (status === "Ready") return "bg-emerald-100 text-emerald-800";
  if (status === "Needs Review") return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-700";
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === "") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function scoreMetric(value, standard) {
  if (!Number.isFinite(value) || !standard) return null;
  if (standard.direction === "lower") {
    return clamp(((standard.poor - value) / (standard.poor - standard.elite)) * 100, 0, 100);
  }
  return clamp(((value - standard.poor) / (standard.elite - standard.poor)) * 100, 0, 100);
}

function scoreLabel(score) {
  if (!Number.isFinite(score)) return "Missing";
  if (score >= 80) return "Standout";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Solid";
  if (score >= 20) return "Needs Work";
  return "Limiter";
}

function scoreColor(score) {
  if (!Number.isFinite(score)) return "bg-slate-200";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 40) return "bg-yellow-300";
  return "bg-rose-500";
}

function getProfileRating(score, status) {
  if (!Number.isFinite(score)) return null;
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

function getTrainingFocus(profile) {
  const focusByLimiter = {
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

function buildProfile(data) {
  const sex = data.sex === "Female" ? "Female" : "Male";
  const norms = standards[sex];
  const bodyweight = toNumber(data.bodyweight);
  const sprint10 = toNumber(data.sprint10);
  const drill505 = toNumber(data.drill505);
  const codDeficit = Number.isFinite(sprint10) && Number.isFinite(drill505) ? drill505 - sprint10 : null;
  const cmjHeight = toNumber(data.cmjHeight);
  const mRsi = toNumber(data.mRsi);
  const trapBarE1RM = toNumber(data.trapBarE1RM);
  const relativeStrength = Number.isFinite(bodyweight) && bodyweight > 0 && Number.isFinite(trapBarE1RM) ? trapBarE1RM / bodyweight : null;

  const rawMetrics = { sprint10, drill505, codDeficit, cmjHeight, mRsi, relativeStrength };
  const sprint10Score = scoreMetric(sprint10, norms.sprint10);
  const rawCodDeficitScore = scoreMetric(codDeficit, norms.codDeficit);
  const codDeficitScore = Number.isFinite(rawCodDeficitScore) && Number.isFinite(sprint10Score)
    ? Math.min(rawCodDeficitScore, sprint10Score + 30)
    : rawCodDeficitScore;

  const scores = {
    sprint10: sprint10Score,
    drill505: scoreMetric(drill505, norms.drill505),
    codDeficit: codDeficitScore,
    cmjHeight: scoreMetric(cmjHeight, norms.cmjHeight),
    mRsi: scoreMetric(mRsi, norms.mRsi),
    relativeStrength: scoreMetric(relativeStrength, norms.relativeStrength),
  };

  const scoreList = Object.keys(rawMetrics).map((key) => ({
    key,
    label: norms[key].label,
    unit: norms[key].unit,
    value: rawMetrics[key],
    score: scores[key],
    display: Number.isFinite(rawMetrics[key]) ? `${rawMetrics[key].toFixed(key === "mRsi" || key === "relativeStrength" ? 2 : 2)}${norms[key].unit ? ` ${norms[key].unit}` : ""}` : "Missing",
  }));

  const athleticExpression = average([scores.sprint10, scores.drill505]);
  const power = scores.cmjHeight;
  const strength = scores.relativeStrength;
  const efficiency = average([scores.mRsi, scores.codDeficit]);
  const overall = average([athleticExpression, power, strength, efficiency]);

  const bucketItems = [
    { key: "athleticExpression", label: "Athletic Expression", score: athleticExpression, status: "Transfer-Limited" },
    { key: "power", label: "Power", score: power, status: "Power-Limited" },
    { key: "strength", label: "Strength", score: strength, status: "Strength-Limited" },
    { key: "efficiency", label: "Efficiency", score: efficiency, status: "Efficiency-Limited" },
  ];

  const scoredBucketItems = bucketItems.filter((item) => Number.isFinite(item.score));
  const lowestBucket = [...scoredBucketItems].sort((a, b) => a.score - b.score)[0];
  const availableScores = scoreList.filter((item) => Number.isFinite(item.score));
  const sortedLowestMetrics = [...availableScores].sort((a, b) => a.score - b.score);
  let lowestMetric = sortedLowestMetrics[0];
  let secondLowestMetric = sortedLowestMetrics[1];

  const jumpOutputMetric = availableScores.find((item) => item.key === "cmjHeight");
  const jumpEfficiencyMetric = availableScores.find((item) => item.key === "mRsi");
  const jumpOutputAndEfficiencyAreClose = Number.isFinite(jumpOutputMetric?.score) && Number.isFinite(jumpEfficiencyMetric?.score) && Math.abs(jumpOutputMetric.score - jumpEfficiencyMetric.score) <= 5;
  if (jumpOutputAndEfficiencyAreClose && lowestMetric?.key === "mRsi" && jumpOutputMetric.score <= lowestMetric.score + 5) {
    lowestMetric = jumpOutputMetric;
    secondLowestMetric = jumpEfficiencyMetric;
  }

  const sortedHighest = [...availableScores].sort((a, b) => b.score - a.score);
  const highest = sortedHighest[0];
  const secondHighest = sortedHighest[1];
  const highestTestedMetric = sortedHighest.find((item) => item.key !== "codDeficit");
  const mainScores = Object.values(scores).filter(Number.isFinite);
  const majorLimiters = mainScores.filter((score) => score < 40).length;
  const noScoreBelow60 = mainScores.length >= 5 && mainScores.every((score) => score >= 60);
  const noScoreBelow40 = mainScores.every((score) => score >= 40);

  const completeAthlete = Number.isFinite(overall) && overall >= 75 && athleticExpression >= 70 && power >= 70 && strength >= 70 && efficiency >= 70 && noScoreBelow60;
  const developmental = Number.isFinite(overall) && (overall < 40 || scoredBucketItems.filter((item) => item.score < 35).length >= 2 || scoredBucketItems.filter((item) => item.score < 45).length >= 3 || majorLimiters >= 4);
  const capacityLimited = strength < 50 && lowestBucket?.key === "strength";
  const bestCapacity = Math.max(Number.isFinite(strength) ? strength : 0, Number.isFinite(power) ? power : 0);
  const lowestExpression = Math.min(Number.isFinite(athleticExpression) ? athleticExpression : 100, Number.isFinite(efficiency) ? efficiency : 100);
  const transferLimited = bestCapacity >= 65 && lowestExpression < 55 && bestCapacity - lowestExpression >= 10;

  let archetype = "Profile Pending";
  let status = "Incomplete Profile";
  let summary = "Enter key testing numbers to generate an athlete profile.";
  let trainingDirection = "Collect more data.";

  if (mainScores.length >= 4 && Number.isFinite(overall)) {
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

  const profile = {
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

function Field({ label, value, onChange, suffix, type = "text", required = false }) {
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

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#1e94d2]">
        {children}
      </select>
    </label>
  );
}

function BrandMark({ variant = "wordmark", tone = "dark", className = "" }) {
  const isSymbol = variant === "symbol";
  const src = isSymbol ? brandAssets.symbol : tone === "light" ? brandAssets.wordmarkWhite : brandAssets.wordmark;
  const sizeClass = isSymbol ? "h-11 w-11" : "h-11 w-auto";

  return <img src={src} alt="PEAQ Analytics" className={`${sizeClass} object-contain ${className}`} />;
}

function BrandedPageHeader({ eyebrow, title, copy, children }) {
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
        {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}

function StarRating({ value }) {
  const rating = Number.isFinite(value) ? value : 0;
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
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{Number.isFinite(value) ? value.toFixed(1) : "—"} / 5 Stars</p>
    </div>
  );
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function ScoreBar({ score }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: Number.isFinite(score) ? `${Math.round(score)}%` : "0%" }} />
    </div>
  );
}

function LimiterPill({ value }) {
  return <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">{value}</span>;
}

function StatusPill({ value }) {
  const tone = value.includes("Near") ? "bg-emerald-100 text-emerald-800" : value.includes("Limited") || value.includes("Broad") ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${tone}`}>{value}</span>;
}

function MetricCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{item.label}</p>
          <p className="text-sm text-slate-500">{item.display}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-slate-950">{Number.isFinite(item.score) ? Math.round(item.score) : "—"}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{scoreLabel(item.score)}</p>
        </div>
      </div>
      <ScoreBar score={item.score} />
    </div>
  );
}

function BucketCard({ bucket }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">{bucket.label}</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">{Number.isFinite(bucket.score) ? bucket.score.toFixed(0) : "—"}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{scoreLabel(bucket.score)}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">/100</div>
      </div>
      <ScoreBar score={bucket.score} />
    </div>
  );
}

function SnapshotCard({ profile }) {
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

function OnePageReport({ data, profile, onBack }) {
  const athleteMeta = [data.sex, data.sport, data.position, data.height ? `${data.height} in` : null, data.bodyweight ? `${data.bodyweight} lb` : null, data.date].filter(Boolean).join(" • ");

  return (
    <main className="min-h-screen bg-white p-3 text-slate-950 print:p-0">
      <style>{`
        @page { size: letter landscape; margin: 0.2in; }
        @media print {
          html, body { background: #ffffff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .report-page { width: 10.6in; page-break-inside: avoid; page-break-after: avoid; }
          .report-page .report-card { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-7xl flex-wrap gap-3">
        <button onClick={onBack} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">Back</button>
        <button onClick={() => window.print()} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Print / Save PDF</button>
      </div>

      <section className="report-page mx-auto max-w-[10.6in] bg-white text-slate-950">
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
              <p className="text-3xl font-black tracking-tight">{Number.isFinite(profile.overallScore) ? profile.overallScore.toFixed(0) : "—"}</p>
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
                {profile.bucketItems.map((bucket) => <div key={bucket.key} className="rounded-xl border border-slate-200 bg-white p-2"><p className="text-[9px] font-black uppercase tracking-wide text-slate-500">{bucket.label}</p><p className="mt-0.5 text-xl font-black tracking-tight text-slate-950">{Number.isFinite(bucket.score) ? bucket.score.toFixed(0) : "—"}</p><ScoreBar score={bucket.score} /></div>)}
              </div>
            </div>
            <div className="report-card rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-end justify-between gap-2">
                <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Tested Metrics</p><h2 className="text-lg font-black tracking-tight">Metric Snapshot</h2></div>
                <StatusPill value={profile.status} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {profile.scoreList.map((item) => <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-2"><div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-black leading-tight text-slate-950">{item.label}</p><p className="mt-0.5 text-[10px] font-bold text-slate-500">{item.display}</p></div><p className="text-base font-black text-slate-950">{Number.isFinite(item.score) ? Math.round(item.score) : "—"}</p></div><ScoreBar score={item.score} /></div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
          <span>Powered by</span>
          <span className="text-[#1e94d2]">PEAQ Analytics</span>
        </div>
      </section>
    </main>
  );
}

function ScoringGuide({ onBack }) {
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandedPageHeader eyebrow="Scoring Guide" title="Scoring Guide" copy="PEAQ standards, score tiers, bucket definitions, and model logic.">
          <button onClick={onBack} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Back to Workspace</button>
        </BrandedPageHeader>

        <section className="grid gap-6 lg:grid-cols-2">
          {["Male", "Female"].map((sex) => (
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

function DashboardReport({ data, profile, onSave, onBack, onPrintReport, saveLabel = "Save Report", extraActions = null, auditNote = null }) {
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
                  <p className="mt-1 text-3xl font-black">{Number.isFinite(profile.overallScore) ? profile.overallScore.toFixed(0) : "—"}</p>
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

function ReportBuilder({ data, setData, onSave, onBack, onPrintReport, mode = "new" }) {
  const profile = useMemo(() => buildProfile(data), [data]);
  const update = (key, value) => setData((previous) => ({ ...previous, [key]: value }));
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
            <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-600"><span className="font-black text-slate-950">Auto-calculated:</span> COD Deficit = {Number.isFinite(profile.raw.codDeficit) ? `${profile.raw.codDeficit.toFixed(2)} sec` : "missing"}; Relative strength = {Number.isFinite(profile.raw.relativeStrength) ? `${profile.raw.relativeStrength.toFixed(2)} xBW` : "missing"}.</div>
          </div>
        </section>

        <DashboardReport data={data} profile={profile} onSave={() => onSave(data, profile)} onBack={onBack} onPrintReport={() => onPrintReport(data, profile)} saveLabel={isCorrection ? "Save Correction" : "Save Report"} />
      </div>
    </main>
  );
}

function buildSavedReport(data, profile) {
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

function buildCorrectedReport(existingReport, data, profile) {
  return {
    ...buildSavedReport(data, profile),
    id: existingReport.id,
    savedAt: existingReport.savedAt || existingReport.createdAt || new Date().toISOString(),
    correctedAt: new Date().toISOString(),
    correctionCount: (existingReport.correctionCount || 0) + 1,
  };
}

function buildReportEntry(data, profile, preferredAthleteId = null) {
  return { data, profile, preferredAthleteId };
}

function addReportEntries(current, entries) {
  if (!current) return current;
  const normalizedCoach = normalizeCoachWorkspace(current);
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

function correctSavedReport(current, athleteId, reportId, data, profile) {
  if (!current) return current;
  const normalizedCoach = normalizeCoachWorkspace(current);
  return {
    ...normalizedCoach,
    athletes: normalizedCoach.athletes.map((athlete) => {
      if (athlete.id !== athleteId) return athlete;
      const existingReport = athlete.reports.find((report) => report.id === reportId);
      if (!existingReport) return athlete;
      const correctedReport = buildCorrectedReport(existingReport, data, profile);
      const athleteBase = buildAthleteBase(data, athlete.id, athlete);
      return {
        ...athlete,
        ...athleteBase,
        reports: athlete.reports.map((report) => report.id === reportId ? correctedReport : report).sort((a, b) => b.date.localeCompare(a.date)),
      };
    }),
  };
}

function getLatestReport(athlete) {
  return athlete.reports?.[0];
}

function getReportBucketScore(report, key) {
  const bucket = report?.profile?.bucketItems?.find((item) => item.key === key);
  return bucket?.score;
}

function getComparisonValue(report, key) {
  if (!report) return null;
  if (key === "overall") return report.overall;
  if (key === "rating") return report.rating;
  if (key === "athleticExpression" || key === "power" || key === "strength" || key === "efficiency") return getReportBucketScore(report, key);
  return report.profile?.raw?.[key];
}

function formatComparisonValue(value, metric) {
  if (!Number.isFinite(value)) return "—";
  const display = value.toFixed(metric.decimals);
  return metric.unit ? `${display} ${metric.unit}` : display;
}

function getComparisonChange(metric, reportA, reportB) {
  const valueA = getComparisonValue(reportA, metric.key);
  const valueB = getComparisonValue(reportB, metric.key);
  if (!Number.isFinite(valueA) || !Number.isFinite(valueB)) {
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

function reportOptionLabel(report, index) {
  const label = [report.date, report.archetype].filter(Boolean).join(" · ");
  return `${label || "Saved Report"}${index === 0 ? " (Latest)" : ""}`;
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function starRatingMatches(rating, range) {
  if (range === "all") return true;
  if (!Number.isFinite(rating)) return false;
  if (range === "under-3.5") return rating < 3.5;
  return rating >= Number(range);
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row = { id: `row-${rowIndex + 1}` };
    headers.forEach((header, index) => { row[header] = values[index] || ""; });
    return row;
  });
}

function validateImportRow(row) {
  if (!row.name) return "Missing Required Info";
  if (!row.sex || !["Male", "Female"].includes(row.sex)) return "Invalid Sex";
  if (!isIsoDate(row.date)) return "Invalid Test Date";
  if (!isIsoDate(row.dob)) return "Invalid DOB";
  if (!row.bodyweight) return "Missing Bodyweight";
  return "Complete";
}

function csvRowToAthlete(row) {
  return { ...blankAthlete, ...row, sport: row.sport || "Basketball", date: row.date || new Date().toISOString().slice(0, 10) };
}

function getImportReview(athletes, data, uploadStatus) {
  if (uploadStatus !== "Complete") {
    return { status: uploadStatus, message: "Fix this row before saving.", canSave: false };
  }

  const matchResult = getAthleteMatchResult(athletes, data, null);
  if (matchResult.status === "ambiguous") {
    return { status: "Needs Review", message: matchResult.message, canSave: false };
  }
  return { status: "Ready", message: matchResult.message, canSave: true };
}

function CsvImport({ coach, onBack, onView, onSaveRows }) {
  const [csvText, setCsvText] = useState(templateHeaders.join(",") + "\n");
  const rows = useMemo(() => parseCsv(csvText), [csvText]);
  const reviewedRows = useMemo(() => {
    const preparedRows = rows.map((row) => {
      const data = csvRowToAthlete(row);
      return { row, data, profile: buildProfile(data), upload: validateImportRow(row) };
    });

    return preparedRows.map((item) => {
      let review = getImportReview(coach.athletes, item.data, item.upload);
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
  }, [coach.athletes, rows]);

  const readyRows = reviewedRows.filter((item) => item.canSave);
  const needsReviewCount = reviewedRows.filter((item) => item.review.status === "Needs Review").length;

  function downloadTemplate() {
    const example = `${templateHeaders.join(",")}\nExample Athlete,Male,2026-05-10,2008-04-15,Basketball,Guard,72,179,1.68,2.07,14.6,0.49,350`;
    const blob = new Blob([example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "athlete-profile-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ""));
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
            <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} className="mt-5 h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs outline-none focus:border-slate-500" />
            <div className="mt-5 flex flex-wrap gap-3"><button onClick={() => onSaveRows(readyRows)} disabled={readyRows.length === 0} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-40">Save Ready Rows</button><p className="flex items-center text-sm font-bold text-slate-500">{readyRows.length} ready · {needsReviewCount} need review</p></div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Import Review</p>
            <h2 className="text-2xl font-black">Athlete Rows</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_0.8fr_1fr_1fr_0.7fr_1fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 lg:grid"><div>Name</div><div>Upload</div><div>Profile</div><div>Limiter</div><div>Rating</div><div>Actions</div></div>
              <div className="divide-y divide-slate-100">
                {reviewedRows.map((item) => (
                  <div key={item.row.id} className="grid gap-3 bg-white px-4 py-4 lg:grid-cols-[1fr_0.8fr_1fr_1fr_0.7fr_1fr] lg:items-center">
                    <div><p className="font-black text-slate-950">{item.data.name || "Missing Name"}</p><p className="text-xs font-semibold text-slate-500">{[item.data.dob ? `DOB: ${item.data.dob}` : null, item.data.sex, item.data.sport, item.data.position].filter(Boolean).join(" · ")}</p></div>
                    <div><span className={`rounded-full px-3 py-1 text-xs font-black ${importStatusTone(item.review.status)}`}>{item.review.status}</span><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.review.message}</p></div>
                    <div className="text-sm font-black text-slate-800">{item.profile.archetype}</div>
                    <div><LimiterPill value={item.profile.primaryLimiter} /></div>
                    <div><span className="text-sm font-black text-slate-700">{Number.isFinite(item.profile.rating) ? item.profile.rating.toFixed(1) : "—"}</span></div>
                    <div className="flex flex-wrap gap-2"><button onClick={() => onView(item.data)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">View</button><button onClick={() => onSaveRows([item])} disabled={!item.canSave} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-40">Save</button></div>
                  </div>
                ))}
                {reviewedRows.length === 0 && <div className="p-10 text-center"><p className="text-lg font-black text-slate-950">No rows found.</p><p className="text-sm text-slate-500">Paste CSV data or upload a CSV file.</p></div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ReportComparison({ reports }) {
  const [reportAId, setReportAId] = useState(reports[1]?.id || reports[0]?.id || "");
  const [reportBId, setReportBId] = useState(reports[0]?.id || "");

  useEffect(() => {
    setReportAId(reports[1]?.id || reports[0]?.id || "");
    setReportBId(reports[0]?.id || "");
  }, [reports]);

  if (reports.length < 2) return null;

  const reportA = reports.find((report) => report.id === reportAId) || reports[0];
  const reportB = reports.find((report) => report.id === reportBId) || reports[1] || reports[0];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-slate-500">Report Comparison</p>
          <h2 className="text-2xl font-black">Compare Reports</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
          <SelectField label="Report A (From)" value={reportA.id} onChange={setReportAId}>
            {reports.map((report, index) => <option key={report.id} value={report.id}>{reportOptionLabel(report, index)}</option>)}
          </SelectField>
          <SelectField label="Report B (To)" value={reportB.id} onChange={setReportBId}>
            {reports.map((report, index) => <option key={report.id} value={report.id}>{reportOptionLabel(report, index)}</option>)}
          </SelectField>
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

function AthleteProfile({ athlete, onBack, onOpenReport }) {
  const latest = athlete.reports[0];
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandedPageHeader eyebrow="Athlete Profile" title={athlete.name} copy={getAthleteIdentityLine(athlete)}>
          <button onClick={onBack} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Back to Athlete Library</button>
        </BrandedPageHeader>
        <section className="grid gap-4 md:grid-cols-4"><SummaryCard label="Reports" value={athlete.reports.length} helper="Saved testing dates" /><SummaryCard label="Latest Overall" value={Number.isFinite(latest.overall) ? latest.overall.toFixed(0) : "—"} helper="Current score" /><SummaryCard label="Latest Rating" value={Number.isFinite(latest.rating) ? latest.rating.toFixed(1) : "—"} helper="Profile stars" /><SummaryCard label="Current Limiter" value={latest.primaryLimiter} helper="Primary priority" /></section>
        <ReportComparison reports={athlete.reports} />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-slate-500">Report History</p><h2 className="text-2xl font-black">Saved Reports</h2><div className="mt-5 grid gap-3">{athlete.reports.map((report) => <button key={report.id} onClick={() => onOpenReport(report)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-slate-950">{report.date}</p><p className="text-sm font-semibold text-slate-500">{[report.archetype, report.status, getCorrectionNote(report)].filter(Boolean).join(" · ")}</p></div><div className="flex flex-wrap gap-2"><StatusPill value={report.status} /><LimiterPill value={report.primaryLimiter} /></div></div></button>)}</div></section>
      </div>
    </main>
  );
}

function SavedReportView({ athlete, report, onBack, onCorrect, onPrintReport }) {
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
      </div>
    </main>
  );
}

function AuthCard({ onCreateCoach }) {
  const [form, setForm] = useState({ name: "", email: "", organization: "" });
  const valueCards = [
    { title: "Import", copy: "Enter testing data manually or upload it from CSV." },
    { title: "Profile", copy: "Archetype athletes from speed, COD, jump, strength, and efficiency." },
    { title: "Track", copy: "Save report history and compare progress over time." },
  ];
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function submit() {
    if (!form.name.trim() || !form.email.trim() || !form.organization.trim()) return;
    onCreateCoach({ id: slugify(`${form.name}-${form.organization}`), ...form, athletes: [] });
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
          <h2 className="mt-6 text-3xl font-black tracking-tight">Create Your PEAQ Workspace</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Start by setting up your coach workspace. You can add athletes after your account is created.</p>
          <div className="mt-6 space-y-4">
            <Field label="Coach Name" value={form.name} onChange={(value) => update("name", value)} />
            <Field label="Email" value={form.email} onChange={(value) => update("email", value)} />
            <Field label="Organization" value={form.organization} onChange={(value) => update("organization", value)} />
            <button onClick={submit} className="w-full rounded-2xl bg-[#1e94d2] px-5 py-4 text-sm font-black text-white hover:bg-[#167bb0]">Create Workspace</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Workspace({ coach, onLogout, onRunReport, onCsvImport, onOpenAthlete, onGuide, onPrintReport }) {
  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySort, setLibrarySort] = useState("name-asc");
  const [sexFilter, setSexFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [archetypeFilter, setArchetypeFilter] = useState("all");
  const [limiterFilter, setLimiterFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const totalReports = coach.athletes.reduce((sum, athlete) => sum + athlete.reports.length, 0);
  const latestReports = coach.athletes.map((athlete) => getLatestReport(athlete)).filter(Boolean);
  const avgRating = latestReports.length ? latestReports.reduce((sum, report) => sum + (report.rating || 0), 0) / latestReports.length : null;
  const filterOptions = useMemo(() => ({
    sex: uniqueOptions(coach.athletes.map((athlete) => athlete.sex)),
    sport: uniqueOptions(coach.athletes.map((athlete) => athlete.sport)),
    archetype: uniqueOptions(coach.athletes.map((athlete) => getLatestReport(athlete)?.archetype)),
    limiter: uniqueOptions(coach.athletes.map((athlete) => getLatestReport(athlete)?.primaryLimiter)),
  }), [coach.athletes]);
  const filteredAthletes = useMemo(() => {
    const search = librarySearch.trim().toLowerCase();
    const visible = coach.athletes.filter((athlete) => {
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
      if (librarySort === "rating-desc") return (Number.isFinite(latestB?.rating) ? latestB.rating : -1) - (Number.isFinite(latestA?.rating) ? latestA.rating : -1);
      if (librarySort === "rating-asc") return (Number.isFinite(latestA?.rating) ? latestA.rating : 999) - (Number.isFinite(latestB?.rating) ? latestB.rating : 999);
      if (librarySort === "date-desc") return String(latestB?.date || "").localeCompare(String(latestA?.date || ""));
      if (librarySort === "date-asc") return String(latestA?.date || "").localeCompare(String(latestB?.date || ""));
      return a.name.localeCompare(b.name);
    });
  }, [archetypeFilter, coach.athletes, librarySearch, librarySort, limiterFilter, ratingFilter, sexFilter, sportFilter]);
  const filtersActive = librarySearch || sexFilter !== "all" || sportFilter !== "all" || archetypeFilter !== "all" || limiterFilter !== "all" || ratingFilter !== "all" || librarySort !== "name-asc";

  function clearLibraryFilters() {
    setLibrarySearch("");
    setLibrarySort("name-asc");
    setSexFilter("all");
    setSportFilter("all");
    setArchetypeFilter("all");
    setLimiterFilter("all");
    setRatingFilter("all");
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
        <section className="grid gap-4 md:grid-cols-5"><SummaryCard label="Athletes" value={coach.athletes.length} helper="Athlete profiles" /><SummaryCard label="All Reports" value={totalReports} helper="Saved testing dates" /><SummaryCard label="Recent Reports" value={latestReports.length} helper="Current snapshots" /><SummaryCard label="Avg Rating" value={avgRating ? avgRating.toFixed(1) : "—"} helper="Latest reports only" /><button onClick={onRunReport} className="rounded-3xl bg-[#1e94d2] p-5 text-left text-white shadow-sm hover:bg-[#167bb0]"><p className="text-xs font-black uppercase tracking-wide text-white/70">New Report</p><p className="mt-2 text-2xl font-black tracking-tight">Run Report</p><p className="mt-1 text-sm font-semibold text-white/75">Start a fresh athlete profile</p></button></section>
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
                <p className="text-sm font-black text-slate-600">Showing {filteredAthletes.length} of {coach.athletes.length} athletes</p>
                <button onClick={clearLibraryFilters} disabled={!filtersActive} className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-40">Clear Filters</button>
              </div>
            </div>
          ) : null}

          {coach.athletes.length === 0 ? <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><p className="text-2xl font-black text-slate-950">No athletes yet.</p><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">Run a new report or import a CSV to start building your athlete library.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={onRunReport} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Run New Report</button><button onClick={onCsvImport} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-100">Import CSV</button></div></div> : filteredAthletes.length === 0 ? <div className="mt-5 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><p className="text-2xl font-black text-slate-950">No matches found.</p><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">Adjust the search or filters to show more athletes.</p></div> : <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><div className="hidden grid-cols-[1.2fr_1.15fr_1.15fr_1fr_0.8fr_1fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 lg:grid"><div>Name</div><div>Latest Archetype</div><div>Latest Status</div><div>Primary Limiter</div><div>Rating</div><div>Actions</div></div><div className="divide-y divide-slate-100">{filteredAthletes.map((athlete) => { const latest = getLatestReport(athlete); return <div key={athlete.id} className="grid gap-3 bg-white px-4 py-4 lg:grid-cols-[1.2fr_1.15fr_1.15fr_1fr_0.8fr_1fr] lg:items-center"><div><p className="font-black text-slate-950">{athlete.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{getAthleteIdentityLine(athlete)}</p></div><div className="text-sm font-black text-slate-800">{latest.archetype}</div><div><StatusPill value={latest.status} /></div><div><LimiterPill value={latest.primaryLimiter} /></div><div><StarRating value={latest.rating} /></div><div className="flex flex-wrap gap-2"><button onClick={() => onOpenAthlete(athlete.id)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">Open Profile</button><button onClick={() => onPrintReport(latest.data, latest.profile)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">Print Latest</button></div></div>; })}</div></div>}
        </section>
      </div>
    </main>
  );
}

export default function AthleteProfilingMVP() {
  const [coach, setCoach] = useState(loadStoredCoach);
  const [view, setView] = useState("auth");
  const [builderData, setBuilderData] = useState(blankAthlete);
  const [builderAthleteId, setBuilderAthleteId] = useState(null);
  const [builderReportId, setBuilderReportId] = useState(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [printProfile, setPrintProfile] = useState(null);

  useEffect(() => {
    saveStoredCoach(coach);
  }, [coach]);

  function openPrintReport(data, profile) {
    setPrintData(data);
    setPrintProfile(profile);
    setView("print");
  }

  function saveReport(data, profile) {
    if (!coach || !data.name.trim()) {
      alert("Add an athlete name before saving this report.");
      return;
    }
    if (builderAthleteId && builderReportId) {
      setCoach((current) => correctSavedReport(current, builderAthleteId, builderReportId, data, profile));
      setBuilderReportId(null);
      setView("workspace");
      window.setTimeout(() => alert("Report correction saved."), 100);
      return;
    }
    const entry = buildReportEntry(data, profile, builderAthleteId);
    setCoach((current) => addReportEntries(current, [entry]));
    setView("workspace");
    window.setTimeout(() => alert("Report saved to Athlete Library."), 100);
  }

  function saveImportedRows(items) {
    if (!coach || items.length === 0) return;
    const saveableItems = items.filter((item) => item.canSave !== false);
    if (saveableItems.length === 0) {
      alert("No ready rows to save. Review missing DOB or row errors first.");
      return;
    }
    const entries = saveableItems.map((item) => buildReportEntry(item.data, item.profile));
    const reportLabel = entries.length === 1 ? "report" : "reports";
    setCoach((current) => addReportEntries(current, entries));
    setView("workspace");
    window.setTimeout(() => alert(`${entries.length} ${reportLabel} saved to Athlete Library.`), 100);
  }

  if (!coach) return <AuthCard onCreateCoach={(newCoach) => { setCoach(newCoach); setView("workspace"); }} />;
  if (view === "guide") return <ScoringGuide onBack={() => setView("workspace")} />;
  if (view === "print" && printData && printProfile) return <OnePageReport data={printData} profile={printProfile} onBack={() => setView("workspace")} />;
  if (view === "builder") return <ReportBuilder data={builderData} setData={setBuilderData} onSave={saveReport} onBack={() => setView("workspace")} onPrintReport={openPrintReport} mode={builderReportId ? "correction" : "new"} />;
  if (view === "csv") return <CsvImport coach={coach} onBack={() => setView("workspace")} onView={(data) => { setBuilderAthleteId(null); setBuilderReportId(null); setBuilderData(data); setView("builder"); }} onSaveRows={saveImportedRows} />;
  if (view === "athlete") {
    const athlete = coach.athletes.find((item) => item.id === selectedAthleteId);
    if (!athlete) return <Workspace coach={coach} onLogout={() => setCoach(null)} onRunReport={() => { setBuilderAthleteId(null); setBuilderReportId(null); setBuilderData(blankAthlete); setView("builder"); }} onCsvImport={() => setView("csv")} onOpenAthlete={(id) => { setSelectedAthleteId(id); setView("athlete"); }} onGuide={() => setView("guide")} onPrintReport={openPrintReport} />;
    return <AthleteProfile athlete={athlete} onBack={() => setView("workspace")} onOpenReport={(report) => { setSelectedReportId(report.id); setView("saved-report"); }} />;
  }
  if (view === "saved-report") {
    const athlete = coach.athletes.find((item) => item.id === selectedAthleteId);
    const report = athlete?.reports.find((item) => item.id === selectedReportId);
    if (!athlete || !report) return <Workspace coach={coach} onLogout={() => setCoach(null)} onRunReport={() => { setBuilderAthleteId(null); setBuilderReportId(null); setBuilderData(blankAthlete); setView("builder"); }} onCsvImport={() => setView("csv")} onOpenAthlete={(id) => { setSelectedAthleteId(id); setView("athlete"); }} onGuide={() => setView("guide")} onPrintReport={openPrintReport} />;
    return <SavedReportView athlete={athlete} report={report} onBack={() => setView("athlete")} onCorrect={() => { setBuilderAthleteId(athlete.id); setBuilderReportId(report.id); setBuilderData(report.data); setView("builder"); }} onPrintReport={openPrintReport} />;
  }
  return <Workspace coach={coach} onLogout={() => setCoach(null)} onRunReport={() => { setBuilderAthleteId(null); setBuilderReportId(null); setBuilderData({ ...blankAthlete, date: new Date().toISOString().slice(0, 10) }); setView("builder"); }} onCsvImport={() => setView("csv")} onOpenAthlete={(id) => { setSelectedAthleteId(id); setView("athlete"); }} onGuide={() => setView("guide")} onPrintReport={openPrintReport} />;
}

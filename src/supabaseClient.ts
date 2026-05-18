const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseAnonKey = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
);

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};

export interface SupabaseUser {
  id: string;
  email?: string;
}

export interface SupabaseSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: SupabaseUser;
}

export function getSupabaseConfigStatus() {
  if (!supabaseConfig.url && !supabaseConfig.anonKey) {
    return "Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.";
  }
  if (!supabaseConfig.url) return "Missing VITE_SUPABASE_URL.";
  if (!supabaseConfig.anonKey) return "Missing VITE_SUPABASE_ANON_KEY.";
  return "Supabase frontend environment is configured.";
}

function normalizeSession(payload: Record<string, unknown>): SupabaseSession | null {
  const sessionPayload = payload.session && typeof payload.session === "object" ? payload.session as Record<string, unknown> : payload;
  const accessToken = typeof sessionPayload.access_token === "string" ? sessionPayload.access_token : "";
  const refreshToken = typeof sessionPayload.refresh_token === "string" ? sessionPayload.refresh_token : "";
  const expiresIn = typeof sessionPayload.expires_in === "number" ? sessionPayload.expires_in : null;
  const userSource = sessionPayload.user || payload.user;
  const user = userSource && typeof userSource === "object" ? userSource as Record<string, unknown> : null;
  const userId = typeof user?.id === "string" ? user.id : "";
  if (!accessToken || !refreshToken || !userId) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
    user: {
      id: userId,
      email: typeof user?.email === "string" ? user.email : undefined,
    },
  };
}

export async function supabaseFetch<T = unknown>(path: string, options: RequestInit & { accessToken?: string } = {}): Promise<T> {
  if (!supabaseConfig.isConfigured) {
    throw new Error(getSupabaseConfigStatus());
  }

  const { accessToken, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set("apikey", supabaseConfig.anonKey);
  headers.set("Authorization", `Bearer ${accessToken || supabaseConfig.anonKey}`);

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${supabaseConfig.url}${path}`, {
    ...requestOptions,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed with status ${response.status}.`);
  }

  if (response.status === 204) return null as T;

  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export async function signUpCoach(email: string, password: string, coachName: string, organization: string): Promise<SupabaseSession | null> {
  const payload = await supabaseFetch<Record<string, unknown>>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: {
        coach_name: coachName,
        name: coachName,
        organization,
      },
    }),
  });
  return normalizeSession(payload);
}

export async function signInCoach(email: string, password: string): Promise<SupabaseSession> {
  const payload = await supabaseFetch<Record<string, unknown>>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const session = normalizeSession(payload);
  if (!session) throw new Error("Sign in did not return a valid Supabase session.");
  return session;
}

export async function refreshSupabaseSession(refreshToken: string): Promise<SupabaseSession> {
  const payload = await supabaseFetch<Record<string, unknown>>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const session = normalizeSession(payload);
  if (!session) throw new Error("Could not refresh Supabase session.");
  return session;
}

export async function signOutCoach(accessToken: string): Promise<void> {
  await supabaseFetch("/auth/v1/logout", {
    method: "POST",
    accessToken,
  });
}

export async function sendPasswordReset(email: string): Promise<void> {
  await supabaseFetch("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

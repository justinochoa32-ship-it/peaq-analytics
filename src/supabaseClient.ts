const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseAnonKey = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
);

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};

export function getSupabaseConfigStatus() {
  if (!supabaseConfig.url && !supabaseConfig.anonKey) {
    return "Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.";
  }
  if (!supabaseConfig.url) return "Missing VITE_SUPABASE_URL.";
  if (!supabaseConfig.anonKey) return "Missing VITE_SUPABASE_ANON_KEY.";
  return "Supabase frontend environment is configured.";
}

export async function supabaseFetch(path: string, options: RequestInit & { accessToken?: string } = {}) {
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

  if (response.status === 204) return null;
  return response.json();
}

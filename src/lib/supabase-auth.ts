const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://szlybvrsgkybhmbhsgxz.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "sb_publishable_uR7KW7wwI3A4TK_7QusPBA_lr269kHL";

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
  };
};

const SESSION_KEY = "adson-fashion-admin-session";

function getConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase não está configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.",
    );
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_ANON_KEY };
}

function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

async function supabaseAuthRequest(path: string, options: RequestInit = {}) {
  const { url, key } = getConfig();
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...options,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.msg || data?.error_description || data?.message || "Não foi possível concluir a operação.");
  }
  return data;
}

export async function signUp(email: string, password: string, name: string) {
  const data = await supabaseAuthRequest("/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { full_name: name } }),
  });

  if (data?.access_token) {
    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user,
    };
    saveSession(session);
    return { session, needsEmailConfirmation: false };
  }

  return { session: null, needsEmailConfirmation: true };
}

export async function signIn(email: string, password: string) {
  const data = await supabaseAuthRequest("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const session: AuthSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    user: data.user,
  };
  saveSession(session);
  return session;
}

export async function signOut() {
  const session = getStoredSession();
  if (session) {
    try {
      await supabaseAuthRequest("/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch {
      // Remove the local session even if the remote logout fails.
    }
  }
  saveSession(null);
}

export async function getCurrentUser() {
  const session = getStoredSession();
  if (!session) return null;

  try {
    const data = await supabaseAuthRequest("/user", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (data?.app_metadata?.role !== "admin") return null;
    return data;
  } catch {
    saveSession(null);
    return null;
  }
}

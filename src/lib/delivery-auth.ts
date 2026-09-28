const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://szlybvrsgkybhmbhsgxz.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "sb_publishable_uR7KW7wwI3A4TK_7QusPBA_lr269kHL";

export type DeliverySession = { access_token: string; refresh_token: string; expires_at?: number; user: { id: string; email?: string } };
const SESSION_KEY = "adson-fashion-delivery-session";

function save(session: DeliverySession | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
export function getDeliverySession(): DeliverySession | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as DeliverySession : null; } catch { return null; }
}
async function authRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/auth/v1${path}`, {
    ...options,
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.msg || data?.error_description || data?.message || "Não foi possível entrar.");
  return data;
}
export async function signInDelivery(email: string, password: string) {
  const data = await authRequest("/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  const session: DeliverySession = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at, user: data.user };
  save(session);
  return session;
}
export async function signOutDelivery() {
  const session = getDeliverySession();
  if (session) { try { await authRequest("/logout", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }); } catch {} }
  save(null);
}
export async function getDeliveryProfile() {
  const session = getDeliverySession();
  if (!session?.user.email) return null;
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/delivery_profiles?select=id,name,phone,login_email,is_online&login_email=eq.${encodeURIComponent(session.user.email)}&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Este acesso não está configurado como delivery.");
  const rows = await response.json() as Array<{id:string;name:string;phone:string;login_email:string|null;is_online:boolean}>;
  return rows[0] ?? null;
}
export async function setDeliveryOnline(id: string, isOnline: boolean) {
  const session = getDeliverySession();
  if (!session) throw new Error("Sessão de delivery não encontrada.");
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/delivery_profiles?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ is_online: isOnline, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error("Não foi possível atualizar o seu estado.");
  const rows = await response.json() as Array<{id:string;name:string;phone:string;login_email:string|null;is_online:boolean}>;
  return rows[0] ?? null;
}

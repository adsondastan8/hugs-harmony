import { getStoredSession } from "./supabase-auth";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://szlybvrsgkybhmbhsgxz.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "sb_publishable_uR7KW7wwI3A4TK_7QusPBA_lr269kHL";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  delivery_address: string;
  created_at: string;
  updated_at: string;
};

function getConfig() {
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_ANON_KEY };
}

async function request(path: string, options: RequestInit = {}) {
  const { url, key } = getConfig();
  const session = getStoredSession();
  if (!session) throw new Error("Sessão não encontrada. Entre novamente.");

  const response = await fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.details || "Não foi possível guardar os dados.");
  return data;
}

export async function getCustomerProfile() {
  const session = getStoredSession();
  if (!session) return null;
  const data = await request(`/customers?id=eq.${encodeURIComponent(session.user.id)}&select=*&limit=1`);
  return (data as Customer[])[0] ?? null;
}

export async function saveCustomerProfile(input: { name: string; phone: string; delivery_address: string }) {
  const session = getStoredSession();
  if (!session) throw new Error("Sessão não encontrada. Entre novamente.");
  const data = await request("/customers?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ id: session.user.id, ...input }),
  });
  return (data as Customer[])[0];
}

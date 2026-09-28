import { getStoredSession } from "./supabase-auth";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://szlybvrsgkybhmbhsgxz.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "sb_publishable_uR7KW7wwI3A4TK_7QusPBA_lr269kHL";

function getConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase não está configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.",
    );
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_ANON_KEY };
}

async function request(path: string, options: RequestInit = {}) {
  const { url, key } = getConfig();
  const session = getStoredSession();
  if (!session) throw new Error("Sessão do ADM não encontrada. Entre novamente.");

  const response = await fetch(`${url}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.hint || data?.details || "Não foi possível comunicar com o Supabase.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  created_by: string;
  created_at: string;
  image_url?: string | null;
};

export async function listProducts() {
  return (await request("/products?select=*&order=created_at.desc")) as Product[];
}

export async function createProduct(input: {
  name: string;
  category: string;
  price: number;
  stock: number;
  created_by: string;
}) {
  const result = await request("/products", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(input),
  });
  return (result as Product[])[0];
}

export async function updateProduct(id: string, input: {
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url?: string | null;
}) {
  const result = await request(`/products?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(input),
  });
  return (result as Product[])[0];
}

export async function uploadProductImage(productId: string, file: File) {
  const { url, key } = getConfig();
  const session = getStoredSession();
  if (!session) throw new Error("Sessão do ADM não encontrada. Entre novamente.");
  if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem válida.");
  if (file.size > 6 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 6 MB.");

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const path = `${productId}/${Date.now()}-${safeName || "imagem"}`;
  const response = await fetch(`${url}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || "Não foi possível enviar a imagem.");
  }
  return `${url}/storage/v1/object/public/product-images/${path}`;
}

export async function deleteProduct(id: string) {
  await request(`/products?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

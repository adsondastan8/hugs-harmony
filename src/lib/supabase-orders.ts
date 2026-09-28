import { getStoredSession } from "./supabase-auth";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://szlybvrsgkybhmbhsgxz.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "sb_publishable_uR7KW7wwI3A4TK_7QusPBA_lr269kHL";

export type OrderStatus = "pending" | "confirmed" | "sent" | "delivered" | "cancelled";

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

function getConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase não está configurado.");
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

export async function listOrders() {
  return (await request("/orders?select=*&order=created_at.desc")) as Order[];
}

export async function listOrderItems(orderId: string) {
  return (await request(`/order_items?select=*&order_id=eq.${encodeURIComponent(orderId)}&order=id.asc`)) as OrderItem[];
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const now = new Date().toISOString();
  const timestamps =
    status === "confirmed"
      ? { confirmed_at: now }
      : status === "sent"
        ? { sent_at: now }
        : status === "delivered"
          ? { delivered_at: now }
          : {};

  const result = await request(`/orders?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status, ...timestamps }),
  });
  return (result as Order[])[0];
}

export function buildOrderWhatsAppUrl(order: Order, items: OrderItem[]) {
  const phone = order.customer_phone.replace(/\D/g, "");
  const lines = [
    "Olá! Aqui é da Adson Fashion.",
    "",
    `Pedido: #${order.id.slice(0, 8).toUpperCase()}`,
    ...items.map((item) => `• ${item.product_name} x${item.quantity} — ${Number(item.subtotal).toLocaleString("pt-MZ")} MT`),
    "",
    `Total: ${Number(order.total).toLocaleString("pt-MZ")} MT`,
    `Entrega: ${order.delivery_address}`,
    order.notes ? `Observação: ${order.notes}` : "",
    "",
    "Pagamento na entrega.",
  ].filter(Boolean);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

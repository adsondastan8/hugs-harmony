import { getDeliverySession } from "./delivery-auth";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://szlybvrsgkybhmbhsgxz.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "sb_publishable_uR7KW7wwI3A4TK_7QusPBA_lr269kHL";

export const VAPID_PUBLIC_KEY =
  "BPIcg3Jx7gvItkD85nbAoC1TS8xJRZOoDoNxMfUphYZtqVFxZRapd9JXp0alNWII-bnzdx0a0VrZ5q0Pvg0eHds";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeDeliveryPush(deliveryId: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Este dispositivo/navegador não suporta Push Notifications.");
  }

  const session = getDeliverySession();
  if (!session?.access_token) throw new Error("Sessão de delivery não encontrada.");

  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.ready);

  await registration.update();

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!json.endpoint || !p256dh || !auth) {
    throw new Error("O Chrome não devolveu uma subscription Push válida.");
  }

  const response = await fetch(
    `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/delivery_push_subscriptions?on_conflict=endpoint`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        delivery_id: deliveryId,
        endpoint: json.endpoint,
        p256dh,
        auth,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(details || "Não foi possível guardar o dispositivo para receber notificações.");
  }

  return subscription;
}

export async function hasDeliveryPushSubscription() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.ready);
  return Boolean(await registration.pushManager.getSubscription());
}

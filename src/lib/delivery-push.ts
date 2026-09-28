import { getDeliverySession } from "./delivery-auth";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://szlybvrsgkybhmbhsgxz.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "sb_publishable_uR7KW7wwI3A4TK_7QusPBA_lr269kHL";

export const VAPID_PUBLIC_KEY =
  "BBTAzWb5YiJmMVdE7XfXc5jIUa-FyTjg2Gzey3jexVBA5bPTM9fqBq7qB1b9I5lYgwg3gzQdf8yuTrj3vJCxEgg";

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

  if (!registration.active) {
    throw new Error("O Service Worker ainda está a iniciar. Feche e abra novamente a página e tente outra vez.");
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    if ("Notification" in window && Notification.permission !== "granted") {
      throw new Error(`O Chrome ainda não autorizou notificações (estado: ${Notification.permission}).`);
    }

    const pushController = new AbortController();
    const pushTimeoutId = window.setTimeout(() => pushController.abort(), 10000);

    try {
      subscription = await Promise.race([
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }),
        new Promise<PushSubscription>((_, reject) => {
          pushController.signal.addEventListener("abort", () => {
            reject(new Error("O Chrome demorou demasiado a criar a Push Subscription."));
          });
        }),
      ]);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `O Chrome não conseguiu criar a Push Subscription: ${error.message}`
          : "O Chrome não conseguiu criar a Push Subscription."
      );
    } finally {
      window.clearTimeout(pushTimeoutId);
    }
  }

  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!json.endpoint || !p256dh || !auth) {
    throw new Error("O Chrome não devolveu uma subscription Push válida.");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  let response: Response;
  try {
    response = await fetch(
      `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/delivery_push_subscriptions?on_conflict=endpoint`,
      {
        method: "POST",
        signal: controller.signal,
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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("O registo do Push demorou demasiado. Atualize a página e tente novamente.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `O servidor recusou o registo do Push (${response.status}). ${details || "Verifique a sessão do delivery."}`
    );
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

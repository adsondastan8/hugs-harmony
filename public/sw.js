const CACHE_NAME = "adson-fashion-pwa-v4";
const APP_SHELL = ["/", "/manifest.webmanifest", "/adson-fashion-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});


self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Nova encomenda — Adson Fashion";
  const body = payload.body || "Tem uma nova encomenda atribuída a si.";
  const orderId = payload.orderId || null;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/adson-fashion-icon.svg",
      badge: "/adson-fashion-icon.svg",
      tag: orderId ? `adson-fashion-order-${orderId}` : "adson-fashion-order",
      renotify: true,
      requireInteraction: true,
      data: { orderId, url: payload.url || "/delivery" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const target = clients.find((client) => "focus" in client);
      if (target) {
        if (orderId) target.postMessage({ type: "OPEN_DELIVERY_ORDER", orderId });
        return target.focus();
      }
      return self.clients.openWindow("/delivery");
    })
  );
});

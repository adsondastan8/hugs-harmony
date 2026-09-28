import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { subscribeDeliveryPush, hasDeliveryPushSubscription } from "../lib/delivery-push";
import {
  getDeliveryProfile,
  getDeliverySession,
  listDeliveryOrderItems,
  listDeliveryOrders,
  setDeliveryOnline,
  signInDelivery,
  signOutDelivery,
  signUpDelivery,
  updateDeliveryOrderStatus,
  type DeliveryOrder,
  type DeliveryOrderItem,
} from "../lib/delivery-auth";

export const Route = createFileRoute("/delivery")({ component: DeliveryPage });

type Profile = { id:string; name:string; phone:string; login_email:string|null; is_online:boolean };

function statusLabel(status: DeliveryOrder["status"]) {
  if (status === "pending") return "Nova";
  if (status === "confirmed") return "Aceite";
  if (status === "sent") return "A caminho";
  if (status === "delivered") return "Entregue";
  return "Cancelada";
}

function money(value: number) {
  return Number(value).toLocaleString("pt-MZ");
}

function DeliveryPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [profile,setProfile]=useState<Profile|null>(null);
  const [orders,setOrders]=useState<DeliveryOrder[]>([]);
  const [items,setItems]=useState<Record<string, DeliveryOrderItem[]>>({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [ordersLoading,setOrdersLoading]=useState(false);
  const [error,setError]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [activeOrder,setActiveOrder]=useState<string|null>(null);
  const [notificationsEnabled,setNotificationsEnabled]=useState(false);
  const [newOrderAlert,setNewOrderAlert]=useState<DeliveryOrder|null>(null);
  const knownOrderIds=useRef<Set<string>>(new Set());
  const firstOrdersLoad=useRef(true);

  async function load() {
    setLoading(true); setError("");
    try {
      if (getDeliverySession()) {
        const p=await getDeliveryProfile();
        if (!p) { await signOutDelivery(); setError("Este acesso não está configurado como delivery."); }
        else { setProfile(p); await loadOrders(); }
      }
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível carregar o acesso."); }
    finally { setLoading(false); }
  }

  async function enableNotifications() {
    setError("");
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setError("Este dispositivo/navegador não suporta notificações web.");
      return;
    }

    try {
      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

      if (permission !== "granted") {
        setNotificationsEnabled(false);
        setError(`As notificações estão bloqueadas. Permissão atual: ${permission}.`);
        return;
      }

      if (!profile) throw new Error("Entre primeiro na área do delivery.");
      await subscribeDeliveryPush(profile.id);
      setNotificationsEnabled(true);
    } catch (e) {
      setNotificationsEnabled(false);
      setError(e instanceof Error
        ? `O Android recusou a notificação: ${e.message}`
        : "O Android recusou a notificação. Verifique as permissões do site.");
    }
  }

  async function loadOrders(showNotification = false) {
    setOrdersLoading(true);
    try {
      const next = await listDeliveryOrders();
      const nextIds = new Set(next.map(order => order.id));
      if (!firstOrdersLoad.current && showNotification) {
        const newOrders = next.filter(
          order => order.status === "pending" && !knownOrderIds.current.has(order.id)
        );
        if (newOrders.length > 0) {
          setNewOrderAlert(newOrders[0]);
          window.setTimeout(() => setNewOrderAlert(null), 12000);
        }
      }
      knownOrderIds.current = nextIds;
      firstOrdersLoad.current = false;
      setOrders(next);
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível carregar as encomendas."); }
    finally { setOrdersLoading(false); }
  }

  useEffect(()=>{ void load(); },[]);

  useEffect(() => {
    if (!profile) return;
    void (async () => {
      if (typeof window !== "undefined" && "Notification" in window) {
        const granted = Notification.permission === "granted";
        setNotificationsEnabled(granted && await hasDeliveryPushSubscription());
      }
    })();
    const timer = window.setInterval(() => { void loadOrders(true); }, 10000);
    return () => window.clearInterval(timer);
  }, [profile]);

  async function login(e:FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "signup") await signUpDelivery(email.trim(),password);
      else await signInDelivery(email.trim(),password);
      const p=await getDeliveryProfile();
      if (!p) { await signOutDelivery(); throw new Error("Este email ainda não foi associado a um delivery pelo administrador."); }
      setProfile(p);
      await loadOrders();
    } catch(e) { setError(e instanceof Error ? e.message : mode === "signup" ? "Não foi possível criar o acesso." : "Email ou palavra-passe inválidos."); }
    finally { setLoading(false); }
  }

  async function changeStatus(value:boolean) {
    if (!profile) return;
    setSaving(true); setError("");
    try { const p=await setDeliveryOnline(profile.id,value); if(p) setProfile(p); }
    catch(e) { setError(e instanceof Error ? e.message : "Não foi possível atualizar o estado."); }
    finally { setSaving(false); }
  }

  async function changeOrderStatus(orderId:string, status:DeliveryOrder["status"]) {
    setSaving(true); setError("");
    try {
      const updated = await updateDeliveryOrderStatus(orderId,status);
      if (updated) setOrders(current => current.map(order => order.id === orderId ? updated : order));
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível atualizar a encomenda."); }
    finally { setSaving(false); }
  }

  async function toggleOrder(orderId:string) {
    if (activeOrder === orderId) { setActiveOrder(null); return; }
    setActiveOrder(orderId);
    if (!items[orderId]) {
      try {
        const next = await listDeliveryOrderItems(orderId);
        setItems(current => ({...current, [orderId]: next}));
      } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível carregar os produtos."); }
    }
  }

  async function logout() { await signOutDelivery(); setProfile(null); setOrders([]); setItems({}); knownOrderIds.current.clear(); firstOrdersLoad.current = true; }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f5f1e8] text-[#171512]"><p className="font-bold">A carregar...</p></main>;

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-6 text-[#171512] sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        {newOrderAlert && (
          <div className="fixed inset-x-3 top-4 z-50 mx-auto max-w-xl rounded-2xl border border-[#b8905a] bg-[#171512] p-4 text-white shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b8905a] text-xl">🔔</div>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setActiveOrder(newOrderAlert.id); setNewOrderAlert(null); }}>
                <p className="text-xs font-bold uppercase tracking-wider text-[#d7b77a]">Nova encomenda</p>
                <p className="mt-1 font-black">{newOrderAlert.customer_name}</p>
                <p className="mt-1 text-sm text-white/70">{money(Number(newOrderAlert.total))} MT · {newOrderAlert.delivery_address}</p>
              </button>
              <button type="button" aria-label="Fechar" onClick={() => setNewOrderAlert(null)} className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10">✕</button>
            </div>
          </div>
        )}

        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8905a]">Adson Fashion</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Área do Delivery</h1>
          </div>
          {profile && <button type="button" onClick={()=>void logout()} className="rounded-xl border border-[#d9cebf] bg-[#fffcf7] px-4 py-2 text-xs font-bold">Sair</button>}
        </header>

        {!profile ? (
          <div className="mx-auto max-w-md rounded-3xl border border-[#e7ded0] bg-[#fffcf7] p-6 shadow-xl sm:p-8">
            <p className="text-sm leading-6 text-[#756f67]">{mode === "login" ? "Entre com o seu acesso individual para gerir as suas entregas." : "Primeiro acesso: use o email associado pelo administrador e crie a sua palavra-passe."}</p>
            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
            <form onSubmit={login} className="mt-6 grid gap-4">
              <label className="text-sm font-bold">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d9cebf] bg-white px-4 py-3 outline-none focus:border-[#b8905a]" placeholder="delivery@email.com"/></label>
              <label className="text-sm font-bold">Palavra-passe<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d9cebf] bg-white px-4 py-3 outline-none focus:border-[#b8905a]" placeholder="••••••••"/></label>
              <button disabled={loading} className="rounded-xl bg-[#171512] px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? "A processar..." : mode === "login" ? "Entrar" : "Criar acesso"}</button>
            </form>
            <button type="button" onClick={()=>{setMode(mode === "login" ? "signup" : "login");setError("");}} className="mt-5 w-full text-center text-xs font-bold text-[#8b6b2f]">{mode === "login" ? "É o seu primeiro acesso? Criar acesso" : "Já tem acesso? Entrar"}</button>
          </div>
        ) : (
          <>
            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
            <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
              <aside className="space-y-5">
                <div className="rounded-3xl bg-[#171512] p-5 text-white shadow-lg">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b8905a]">Delivery</p>
                  <h2 className="mt-1 text-2xl font-black">{profile.name}</h2>
                  <p className="mt-1 text-sm text-white/60">{profile.phone}</p>
                </div>
                <div className="rounded-2xl border border-[#e7ded0] bg-white p-5">
                  <p className="text-sm font-bold">O seu estado</p>
                  <div className="mt-3 flex items-center gap-3"><span className={`h-4 w-4 rounded-full ${profile.is_online ? "bg-green-500" : "bg-red-500"}`} /><span className="text-xl font-black">{profile.is_online ? "Online" : "Offline"}</span></div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button type="button" disabled={saving || profile.is_online} onClick={()=>void changeStatus(true)} className="rounded-xl bg-green-600 px-3 py-3 text-xs font-black text-white disabled:opacity-40">🟢 Online</button>
                    <button type="button" disabled={saving || !profile.is_online} onClick={()=>void changeStatus(false)} className="rounded-xl bg-[#171512] px-3 py-3 text-xs font-black text-white disabled:opacity-40">🔴 Offline</button>
                  </div>
                </div>
              </aside>

              <section className="rounded-3xl border border-[#e7ded0] bg-[#fffcf7] p-5 shadow-sm sm:p-6">
                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b8905a]">Trabalho</p><h2 className="mt-1 text-2xl font-black">As minhas encomendas</h2><p className="mt-1 text-sm text-[#756f67]">Aqui aparecem apenas as encomendas atribuídas a este delivery.</p></div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={()=>void enableNotifications()} className={`rounded-xl border px-3 py-2 text-xs font-bold ${notificationsEnabled ? "border-green-200 bg-green-50 text-green-700" : "border-[#d9cebf] bg-white"}`}>
                      {notificationsEnabled ? "🔔 Notificações ativas" : "🔔 Ativar notificações"}
                    </button>
                    <button type="button" onClick={()=>void loadOrders(false)} className="rounded-xl border border-[#d9cebf] px-3 py-2 text-xs font-bold">Atualizar</button>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#faf7f1] p-3"><p className="text-xs text-[#756f67]">Novas</p><p className="mt-1 text-xl font-black">{orders.filter(o=>o.status==="pending").length}</p></div>
                  <div className="rounded-xl bg-[#faf7f1] p-3"><p className="text-xs text-[#756f67]">Em entrega</p><p className="mt-1 text-xl font-black">{orders.filter(o=>o.status==="sent").length}</p></div>
                  <div className="rounded-xl bg-[#faf7f1] p-3"><p className="text-xs text-[#756f67]">Entregues</p><p className="mt-1 text-xl font-black">{orders.filter(o=>o.status==="delivered").length}</p></div>
                </div>

                <div className="mt-5 space-y-3">
                  {ordersLoading && <div className="rounded-2xl bg-[#faf7f1] p-5 text-sm font-semibold text-[#756f67]">A carregar encomendas...</div>}
                  {!ordersLoading && orders.length === 0 && <div className="rounded-2xl border border-dashed border-[#d9cebf] p-8 text-center"><p className="text-2xl">📦</p><p className="mt-2 font-black">Nenhuma encomenda ainda</p><p className="mt-1 text-sm text-[#756f67]">Quando um cliente escolher este delivery, a encomenda aparecerá aqui.</p></div>}
                  {orders.map(order => {
                    const open = activeOrder === order.id;
                    const orderItems = items[order.id] ?? [];
                    return (
                      <article key={order.id} className="overflow-hidden rounded-2xl border border-[#e7ded0] bg-white">
                        <button type="button" onClick={()=>void toggleOrder(order.id)} className="w-full p-4 text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div><p className="text-xs font-bold uppercase tracking-wider text-[#b8905a]">#{order.id.slice(0,8).toUpperCase()}</p><h3 className="mt-1 font-black">{order.customer_name}</h3><p className="mt-1 text-xs text-[#756f67]">{order.customer_phone}</p></div>
                            <div className="text-right"><span className="rounded-full bg-[#faf7f1] px-3 py-1 text-[11px] font-black">{statusLabel(order.status)}</span><p className="mt-2 font-black">{money(Number(order.total))} MT</p></div>
                          </div>
                          <p className="mt-3 text-sm leading-5 text-[#625a50]">📍 {order.delivery_address}</p>
                        </button>
                        {open && (
                          <div className="border-t border-[#eee7dc] bg-[#fffcf7] p-4">
                            <div className="space-y-2 text-sm">
                              {orderItems.length === 0 ? <p className="text-[#756f67]">A carregar produtos...</p> : orderItems.map(item=><div key={item.id} className="flex justify-between gap-3"><span>{item.product_name} × {item.quantity}{item.selected_color ? ` · ${item.selected_color}` : ""}{item.selected_size ? ` · ${item.selected_size}` : ""}</span><b>{money(Number(item.subtotal))} MT</b></div>)}
                            </div>
                            {order.notes && <p className="mt-4 rounded-xl bg-[#faf7f1] p-3 text-xs"><b>Observação:</b> {order.notes}</p>}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {order.status === "pending" && <button type="button" disabled={saving} onClick={()=>void changeOrderStatus(order.id,"confirmed")} className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-black text-white">Aceitar</button>}
                              {order.status === "confirmed" && <button type="button" disabled={saving} onClick={()=>void changeOrderStatus(order.id,"sent")} className="rounded-xl bg-[#171512] px-4 py-2.5 text-xs font-black text-white">Marcar a caminho</button>}
                              {order.status === "sent" && <button type="button" disabled={saving} onClick={()=>void changeOrderStatus(order.id,"delivered")} className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-black text-white">Marcar entregue</button>}
                              {(order.status === "pending" || order.status === "confirmed") && <button type="button" disabled={saving} onClick={()=>void changeOrderStatus(order.id,"cancelled")} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-black text-red-700">Cancelar</button>}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

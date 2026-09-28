import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { listPublicProducts, type Product } from "../lib/supabase-data";

type CartItem = { productId: string; quantity: number };
type DeliveryZone = "cidade" | "bairro";

const CART_KEY = "adson-fashion-cart";
const STORE_WHATSAPP_NUMBER = "258853131247";
const CITY_DELIVERY_FEE = 0;
const NEIGHBORHOOD_DELIVERY_FEE = 70;

function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as CartItem[]; } catch { return []; }
}
function writeCart(items: CartItem[]) { localStorage.setItem(CART_KEY, JSON.stringify(items)); }

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>("cidade");
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(readCart());
    void listPublicProducts().then(setProducts).catch(() => setError("Não foi possível carregar o seu pedido."));
  }, []);

  const lines = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? { product, quantity: Math.min(item.quantity, product.stock) } : null;
  }).filter(Boolean) as Array<{ product: Product; quantity: number }>;

  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  const deliveryFee = deliveryZone === "bairro" ? NEIGHBORHOOD_DELIVERY_FEE : CITY_DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function changeQuantity(productId: string, quantity: number) {
    const safeQuantity = Math.max(0, Math.floor(quantity));
    const next = cart.map((item) => item.productId === productId ? { ...item, quantity: safeQuantity } : item).filter((item) => item.quantity > 0);
    setCart(next);
    writeCart(next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (lines.length === 0) { setError("O seu pedido está vazio."); return; }
    if (!name.trim() || !phone.trim() || !address.trim() || !deliveryTime) {
      setError("Preencha nome, telefone, endereço e a hora desejada para receber a encomenda.");
      return;
    }

    const zoneLabel = deliveryZone === "cidade" ? "Dentro da cidade (grátis)" : "Bairro (70 MT)";
    const message = [
      "Olá, Adson Fashion! Quero fazer uma encomenda.",
      "",
      ...lines.map((line) => `• ${line.product.name} × ${line.quantity} — ${(Number(line.product.price) * line.quantity).toLocaleString("pt-MZ")} MT`),
      "",
      `Subtotal: ${subtotal.toLocaleString("pt-MZ")} MT`,
      `Zona de entrega: ${zoneLabel}`,
      `Taxa de delivery: ${deliveryFee.toLocaleString("pt-MZ")} MT`,
      `Total: ${total.toLocaleString("pt-MZ")} MT`,
      "Pagamento: na entrega",
      "",
      `Nome: ${name.trim()}`,
      `Telefone: ${phone.trim()}`,
      `Endereço: ${address.trim()}`,
      `Hora desejada para receber: ${deliveryTime}`,
      notes.trim() ? `Observação: ${notes.trim()}` : "",
    ].filter(Boolean).join("\n");

    localStorage.removeItem(CART_KEY);
    window.location.href = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
  const sectionClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button type="button" onClick={() => navigate({ to: "/produtos" })} className="flex items-center gap-2 text-sm font-bold text-slate-700 transition hover:text-slate-950">
            <span className="text-lg">←</span> Voltar aos produtos
          </button>
          <div className="text-right">
            <p className="text-lg font-black tracking-tight">Adson Fashion</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Finalização segura</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            <span className="text-slate-950">01 Pedido</span><span>—</span><span>02 Entrega</span><span>—</span><span>03 WhatsApp</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Finalizar encomenda</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Revise os produtos, indique onde e quando deseja receber e envie a encomenda diretamente para a nossa equipa.</p>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>}

        {lines.length === 0 ? (
          <div className={`${sectionClass} p-8 text-center sm:p-12`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">🛍️</div>
            <h2 className="mt-5 text-xl font-black">A sua encomenda está vazia</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Escolha os produtos que deseja comprar e volte aqui para concluir a encomenda.</p>
            <button type="button" onClick={() => navigate({ to: "/produtos" })} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800">Ver produtos</button>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_390px]">
            <div className="space-y-6">
              <section className={sectionClass + " p-5 sm:p-7"}>
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Resumo</p><h2 className="mt-1 text-xl font-black">Os seus produtos</h2></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
                </div>
                <div className="mt-6 divide-y divide-slate-100">
                  {lines.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">🛍️</div>}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{product.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{Number(product.price).toLocaleString("pt-MZ")} MT cada</p>
                        <div className="mt-3 inline-flex items-center rounded-lg border border-slate-200 bg-white">
                          <button type="button" aria-label="Diminuir quantidade" onClick={() => changeQuantity(product.id, quantity - 1)} className="h-8 w-8 text-lg text-slate-500 hover:text-slate-950">−</button>
                          <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                          <button type="button" aria-label="Aumentar quantidade" onClick={() => changeQuantity(product.id, Math.min(quantity + 1, product.stock))} className="h-8 w-8 text-lg text-slate-500 hover:text-slate-950">+</button>
                        </div>
                      </div>
                      <div className="text-right"><p className="font-black">{(Number(product.price) * quantity).toLocaleString("pt-MZ")} MT</p><button type="button" onClick={() => changeQuantity(product.id, 0)} className="mt-2 text-xs font-semibold text-slate-400 hover:text-red-600">Remover</button></div>
                    </div>
                  ))}
                </div>
              </section>

              <form id="checkout-form" onSubmit={submit} className={sectionClass + " p-5 sm:p-7"}>
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Entrega</p><h2 className="mt-1 text-xl font-black">Onde devemos entregar?</h2></div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-bold sm:col-span-2">Nome completo<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Adson Dastan" className={fieldClass} /></label>
                  <label className="text-sm font-bold">Telefone<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+258 84 000 0000" className={fieldClass} /></label>
                  <label className="text-sm font-bold">Hora desejada<input required type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={fieldClass} /></label>
                  <label className="text-sm font-bold sm:col-span-2">Endereço de entrega<textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Bairro, rua, referência..." className={fieldClass} /></label>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-bold">Zona de entrega</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={() => setDeliveryZone("cidade")} className={`rounded-xl border p-4 text-left transition ${deliveryZone === "cidade" ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}>
                        <span className="block text-sm font-black">Dentro da cidade</span><span className={`mt-1 block text-xs ${deliveryZone === "cidade" ? "text-white/70" : "text-slate-500"}`}>Entrega grátis</span>
                      </button>
                      <button type="button" onClick={() => setDeliveryZone("bairro")} className={`rounded-xl border p-4 text-left transition ${deliveryZone === "bairro" ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}>
                        <span className="block text-sm font-black">Bairro</span><span className={`mt-1 block text-xs ${deliveryZone === "bairro" ? "text-white/70" : "text-slate-500"}`}>Taxa de 70 MT</span>
                      </button>
                    </div>
                  </div>
                  <label className="text-sm font-bold sm:col-span-2">Observação <span className="font-normal text-slate-400">(opcional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Alguma referência ou pedido especial?" className={fieldClass} /></label>
                </div>
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><span className="mt-0.5">✓</span><p><strong className="text-slate-900">Pagamento na entrega.</strong> A equipa confirma o pedido e a disponibilidade pelo WhatsApp.</p></div>
              </form>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className={sectionClass + " overflow-hidden"}>
                <div className="bg-slate-950 px-6 py-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Total da encomenda</p><p className="mt-2 text-3xl font-black tracking-tight">{total.toLocaleString("pt-MZ")} MT</p></div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-500"><span>Produtos</span><span className="font-semibold text-slate-900">{subtotal.toLocaleString("pt-MZ")} MT</span></div>
                    <div className="flex justify-between text-slate-500"><span>Delivery</span><span className={deliveryFee === 0 ? "font-bold text-emerald-600" : "font-semibold text-slate-900"}>{deliveryFee === 0 ? "Grátis" : `${deliveryFee.toLocaleString("pt-MZ")} MT`}</span></div>
                    <div className="my-4 border-t border-slate-100" />
                    <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black">{total.toLocaleString("pt-MZ")} MT</span></div>
                  </div>
                  <button type="submit" form="checkout-form" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">Confirmar encomenda <span>→</span></button>
                  <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Ao continuar, o seu pedido será preparado para envio no WhatsApp da Adson Fashion.</p>
                  <div className="mt-5 grid grid-cols-3 border-t border-slate-100 pt-5 text-center text-[11px] font-semibold text-slate-500"><span>✓ Compra simples</span><span>✓ Pagamento na entrega</span><span>✓ WhatsApp</span></div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

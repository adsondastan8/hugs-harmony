import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { listPublicProducts, type Product } from "../lib/supabase-data";
import { createCheckoutOrder } from "../lib/supabase-orders";

type CartItem = { productId: string; quantity: number; color?: string; size?: string };
type DeliveryZone = "cidade" | "bairro";

const CART_KEY = "adson-fashion-cart";
const STORE_WHATSAPP_NUMBER = "258853131247";
const CITY_DELIVERY_FEE = 0;
const NEAR_DELIVERY_FEE = 50;
const MID_DELIVERY_FEE = 80;
const NEAR_NEIGHBORHOODS = ["Popular", "Muchenga", "N'zinje", "Estação", "Cerâmica", "Chiuaula / Luchiringo"];
const MID_NEIGHBORHOODS = ["Namacula", "Sanjala", "Chiulugo", "23 de Setembro", "Massenger"];

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
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>("bairro");
  const [deliveryPlace, setDeliveryPlace] = useState<"bairro" | "ponto">("bairro");

  const neighborhoodFee = NEAR_NEIGHBORHOODS.includes(neighborhood) ? NEAR_DELIVERY_FEE : MID_NEIGHBORHOODS.includes(neighborhood) ? MID_DELIVERY_FEE : MID_DELIVERY_FEE;
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(readCart());
    void listPublicProducts().then(setProducts).catch(() => setError("Não foi possível carregar o seu pedido."));
  }, []);

  const lines = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? { product, quantity: Math.min(item.quantity, product.stock), color: item.color, size: item.size } : null;
  }).filter(Boolean) as Array<{ product: Product; quantity: number }>;

  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  const deliveryFee = deliveryPlace === "bairro" ? neighborhoodFee : MID_DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function changeQuantity(productId: string, quantity: number) {
    const safeQuantity = Math.max(0, Math.floor(quantity));
    const next = cart.map((item) => item.productId === productId ? { ...item, quantity: safeQuantity } : item).filter((item) => item.quantity > 0);
    setCart(next);
    writeCart(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (lines.length === 0) { setError("O seu pedido está vazio."); return; }
    if (!name.trim() || !phone.trim() || (deliveryPlace === "bairro" && !neighborhood) || !address.trim() || !deliveryTime) {
      setError("Preencha nome, telefone, bairro, endereço/referência e a hora desejada para receber a encomenda.");
      return;
    }

    const zoneLabel = deliveryPlace === "bairro" ? `Bairro ${neighborhood} (${deliveryFee} MT)` : `Ponto de entrega: ${address.trim()} (${deliveryFee} MT)`;
    const message = [
      "Olá, Adson Fashion! Quero fazer uma encomenda.",
      "",
      ...lines.map((line) => `• ${line.product.name} × ${line.quantity}${line.color ? ` · Cor: ${line.color}` : ""}${line.size ? ` · Tamanho: ${line.size}` : ""} — ${(Number(line.product.price) * line.quantity).toLocaleString("pt-MZ")} MT`),
      "",
      `Subtotal: ${subtotal.toLocaleString("pt-MZ")} MT`,
      `Zona de entrega: ${zoneLabel}`,
      `Taxa de delivery: ${deliveryFee.toLocaleString("pt-MZ")} MT`,
      `Total: ${total.toLocaleString("pt-MZ")} MT`,
      "Pagamento: na entrega",
      "",
      `Nome: ${name.trim()}`,
      `Telefone: ${phone.trim()}`,
      deliveryPlace === "bairro" ? `Bairro: ${neighborhood.trim()}` : "Local: mercado / serviço / outro ponto",
      `Endereço / referência: ${address.trim()}`,
      `Hora desejada para receber: ${deliveryTime}`,
      notes.trim() ? `Observação: ${notes.trim()}` : "",
    ].filter(Boolean).join("\n");

    try {
      const deliveryAddress = deliveryPlace === "bairro"
        ? `Bairro: ${neighborhood.trim()} | ${address.trim()}`
        : address.trim();
      const orderId = await createCheckoutOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryAddress,
        total,
        notes: notes.trim(),
        items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity, color: line.color, size: line.size })),
      });

      localStorage.removeItem(CART_KEY);
      const messageWithOrder = `${message}\n\nNúmero da encomenda: #${orderId.slice(0, 8).toUpperCase()}`;
      window.location.href = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(messageWithOrder)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gravar a encomenda. Tente novamente.");
    }
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-[#e5dccd] bg-[#fffdf9] px-4 py-3.5 text-[15px] outline-none transition placeholder:text-[#9a8f80] focus:border-[#a88745] focus:ring-2 focus:ring-slate-900/10";
  const sectionClass = "rounded-2xl border border-[#e5dccd] bg-[#fffdf9] shadow-sm";

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#17130d]">
      <header className="sticky top-0 z-30 border-b border-[#e5dccd]/80 bg-[#fffdf9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button type="button" onClick={() => navigate({ to: "/produtos" })} className="flex items-center gap-2 text-sm font-bold text-[#4d463e] transition hover:text-[#17130d]">
            <span className="text-lg">←</span> Voltar aos produtos
          </button>
          <div className="text-right">
            <p className="text-lg font-black tracking-tight">Adson Fashion</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a8f80]">Finalização segura</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-[#9a8f80]">
            <span className="text-[#17130d]">01 Pedido</span><span>—</span><span>02 Entrega</span><span>—</span><span>03 WhatsApp</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Finalizar encomenda</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#776e62]">Revise os produtos, indique onde e quando deseja receber e envie a encomenda diretamente para a nossa equipa.</p>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-[#dfc2bd] bg-[#f8ece9] px-5 py-4 text-sm font-semibold text-[#91463b]">{error}</div>}

        {lines.length === 0 ? (
          <div className={`${sectionClass} p-8 text-center sm:p-12`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4efe6] text-2xl">🛍️</div>
            <h2 className="mt-5 text-xl font-black">A sua encomenda está vazia</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#776e62]">Escolha os produtos que deseja comprar e volte aqui para concluir a encomenda.</p>
            <button type="button" onClick={() => navigate({ to: "/produtos" })} className="mt-6 rounded-xl bg-[#17130d] px-6 py-3 font-bold text-white transition hover:bg-[#2a2319]">Ver produtos</button>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_390px]">
            <div className="space-y-6">
              <section className={sectionClass + " p-5 sm:p-7"}>
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a8f80]">Resumo</p><h2 className="mt-1 text-xl font-black">Os seus produtos</h2></div>
                  <span className="rounded-full bg-[#f4efe6] px-3 py-1.5 text-xs font-bold">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
                </div>
                <div className="mt-6 divide-y divide-slate-100">
                  {lines.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f4efe6] text-2xl">🛍️</div>}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{product.name}</p>
                        <p className="mt-1 text-sm text-[#776e62]">{Number(product.price).toLocaleString("pt-MZ")} MT cada</p>
                        <div className="mt-3 inline-flex items-center rounded-lg border border-[#e5dccd] bg-[#fffdf9]">
                          <button type="button" aria-label="Diminuir quantidade" onClick={() => changeQuantity(product.id, quantity - 1)} className="h-8 w-8 text-lg text-[#776e62] hover:text-[#17130d]">−</button>
                          <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                          <button type="button" aria-label="Aumentar quantidade" onClick={() => changeQuantity(product.id, Math.min(quantity + 1, product.stock))} className="h-8 w-8 text-lg text-[#776e62] hover:text-[#17130d]">+</button>
                        </div>
                      </div>
                      <div className="text-right"><p className="font-black">{(Number(product.price) * quantity).toLocaleString("pt-MZ")} MT</p><button type="button" onClick={() => changeQuantity(product.id, 0)} className="mt-2 text-xs font-semibold text-[#9a8f80] hover:text-[#a14b3f]">Remover</button></div>
                    </div>
                  ))}
                </div>
              </section>

              <form id="checkout-form" onSubmit={submit} className={sectionClass + " p-5 sm:p-7"}>
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a8f80]">Entrega</p><h2 className="mt-1 text-xl font-black">Onde devemos entregar?</h2></div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-bold sm:col-span-2">Nome completo<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Adson Dastan" className={fieldClass} /></label>
                  <label className="text-sm font-bold">Telefone<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+258 84 000 0000" className={fieldClass} /></label>
                  <label className="text-sm font-bold">Hora desejada<input required type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={fieldClass} /></label>
                  <label className={`text-sm font-bold ${deliveryPlace === "bairro" ? "" : "opacity-60"}`}>Escolha o seu bairro<select required={deliveryPlace === "bairro"} disabled={deliveryPlace !== "bairro"} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={fieldClass}><option value="">Selecione o bairro</option><option>Sanjala</option><option>N'zinje</option><option>Muchenga</option><option>Popular</option><option>Namacula</option><option>Chiulugo</option><option>Chiuaula / Luchiringo</option><option>Estação</option><option>Cerâmica</option><option>Massenger</option><option>Assumane</option><option>Sambula</option><option>23 de Setembro</option><option>Mitava</option><option>Utumuile</option><option>Ntoto</option><option>Naluila</option></select></label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setDeliveryPlace("bairro")} className={`rounded-xl border p-4 text-left ${deliveryPlace === "bairro" ? "border-[#17130d] bg-[#17130d] text-white" : "border-[#e5dccd] bg-[#fffdf9]"}`}><span className="block text-sm font-black">Entrega no bairro</span><span className="mt-1 block text-xs opacity-70">Escolha o bairro abaixo</span></button><button type="button" onClick={() => setDeliveryPlace("ponto")} className={`rounded-xl border p-4 text-left ${deliveryPlace === "ponto" ? "border-[#17130d] bg-[#17130d] text-white" : "border-[#e5dccd] bg-[#fffdf9]"}`}><span className="block text-sm font-black">Mercado / serviço / outro local</span><span className="mt-1 block text-xs opacity-70">Indique o ponto de entrega</span></button></div>
                  <p className="mt-2 text-xs font-semibold text-[#8b6b2f]">Taxa de delivery: {deliveryPlace === "bairro" ? (neighborhood ? `${neighborhoodFee} MT` : "selecione o bairro") : `${MID_DELIVERY_FEE} MT`}</p>
                  <label className="text-sm font-bold sm:col-span-2">{deliveryPlace === "bairro" ? "Endereço / ponto de referência" : "Indique a sua localização com detalhe"}<textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder={deliveryPlace === "bairro" ? "Rua, casa, ponto de referência..." : "Ex.: Mercado X, bairro/zona, rua, próximo de..., nome do serviço ou outro ponto de referência..."} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-[#776e62]">{deliveryPlace === "bairro" ? "Indique a rua, casa e uma referência para facilitar a entrega." : "Escreva o máximo de detalhes possível para o entregador encontrar a sua localização."}</span></label>
                  <div className="sm:col-span-2">
                    
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      
                      <button type="button" onClick={() => setDeliveryZone("bairro")} className={`rounded-xl border p-4 text-left transition ${deliveryZone === "bairro" ? "border-slate-950 bg-[#17130d] text-white shadow-lg" : "border-[#e5dccd] bg-[#fffdf9] hover:border-slate-400"}`}>
                        <span className="block text-sm font-black">Bairro</span><span className="mt-1 block text-xs text-white/70">A taxa é definida pelo local</span>
                      </button>
                    </div>
                  </div>
                  <label className="text-sm font-bold sm:col-span-2">Observação <span className="font-normal text-[#9a8f80]">(opcional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Alguma referência ou pedido especial?" className={fieldClass} /></label>
                </div>
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#faf7f1] p-4 text-sm text-[#625a50]"><span className="mt-0.5">✓</span><p><strong className="text-[#17130d]">Pagamento na entrega.</strong> A equipa confirma o pedido e a disponibilidade pelo WhatsApp.</p></div>
              </form>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className={sectionClass + " overflow-hidden"}>
                <div className="bg-[#17130d] px-6 py-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Total da encomenda</p><p className="mt-2 text-3xl font-black tracking-tight">{total.toLocaleString("pt-MZ")} MT</p></div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-[#776e62]"><span>Produtos</span><span className="font-semibold text-[#17130d]">{subtotal.toLocaleString("pt-MZ")} MT</span></div>
                    <div className="flex justify-between text-[#776e62]"><span>Delivery</span><span className={deliveryFee === 0 ? "font-bold text-[#8b6b2f]" : "font-semibold text-[#17130d]"}>{deliveryFee === 0 ? "Grátis" : `${deliveryFee.toLocaleString("pt-MZ")} MT`}</span></div>
                    <div className="my-4 border-t border-slate-100" />
                    <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black">{total.toLocaleString("pt-MZ")} MT</span></div>
                  </div>
                  <button type="submit" form="checkout-form" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17130d] px-5 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#2a2319]">Confirmar encomenda <span>→</span></button>
                  <p className="mt-3 text-center text-[11px] leading-5 text-[#9a8f80]">Ao continuar, o seu pedido será preparado para envio no WhatsApp da Adson Fashion.</p>
                  <div className="mt-5 grid grid-cols-3 border-t border-slate-100 pt-5 text-center text-[11px] font-semibold text-[#776e62]"><span>✓ Compra simples</span><span>✓ Pagamento na entrega</span><span>✓ WhatsApp</span></div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

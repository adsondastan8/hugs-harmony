import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { listPublicProducts, type Product } from "../lib/supabase-data";
type OrderItem = { productId: string; quantity: number; color?: string; size?: string };
const ORDER_KEY = "adson-fashion-cart";
function readOrder(): OrderItem[] { try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]") as OrderItem[]; } catch { return []; } }
function writeOrder(items: OrderItem[]) { localStorage.setItem(ORDER_KEY, JSON.stringify(items)); }
export const Route = createFileRoute("/produtos")({ component: ProductsPage });
function ProductsPage() {
  const navigate = useNavigate(); const [products, setProducts] = useState<Product[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [order, setOrder] = useState<OrderItem[]>([]);
  useEffect(() => { setOrder(readOrder()); let active = true; void listPublicProducts().then((data) => { if (active) setProducts(data); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar os produtos."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  function selectProduct(product: Product) {
  const current = order.find((item) => item.productId === product.id);
  if ((product.colors?.length ?? 0) > 0 && !current?.color) return;
  if ((product.sizes?.length ?? 0) > 0 && !current?.size) return;
  const existing = order.find((item) => item.productId === product.id && item.color === current?.color && item.size === current?.size);
  const next = existing ? order.map((item) => item === existing ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item) : [...order, { productId: product.id, quantity: 1, color: current?.color, size: current?.size }];
  setOrder(next); writeOrder(next);
}
  function removeProduct(productId: string) { const next = order.filter((item) => item.productId !== productId); setOrder(next); writeOrder(next); }
  function quantity(productId: string) { return order.filter((item) => item.productId === productId).reduce((sum, item) => sum + item.quantity, 0); }
function updateVariant(productId: string, field: "color" | "size", value: string) {
  const existing = order.find((item) => item.productId === productId);
  const next = existing ? order.map((item) => item === existing ? { ...item, [field]: value || undefined } : item) : [...order, { productId, quantity: 0, [field]: value || undefined }];
  setOrder(next); writeOrder(next);
}
  const itemCount = order.reduce((sum, item) => sum + item.quantity, 0);
  const total = order.reduce((sum, item) => { const product = products.find((p) => p.id === item.productId); return sum + (product ? Number(product.price) * item.quantity : 0); }, 0);
  return (<main className="min-h-screen bg-[#faf7f1] pb-24 text-[#17130d]">
    <header className="sticky top-0 z-20 border-b border-[#e5dccd] bg-[#fffdf9]/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6"><button type="button" onClick={() => navigate({ to: "/" })} className="text-left"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#776e62]">Adson Fashion</p><p className="text-base font-black">Produtos</p></button>{itemCount > 0 && <button type="button" onClick={() => navigate({ to: "/checkout" })} className="rounded-lg bg-[#17130d] px-3 py-2 text-xs font-bold text-white">Encomenda · {itemCount}</button>}</div></header>
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#776e62]">Catálogo</p><h1 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">Escolha o que deseja encomendar</h1><p className="mt-2 max-w-2xl text-sm leading-5 text-[#625a50]">Escolha um ou vários produtos. Quando terminar, toque em <strong>Fazer encomenda</strong>.</p></div>
      {error && <div className="mb-5 rounded-lg border border-[#dfc2bd] bg-[#f8ece9] px-4 py-3 text-xs font-medium text-[#91463b]">{error}</div>}
      {loading ? <div className="rounded-xl bg-[#fffdf9] p-8 text-center text-sm text-[#776e62]">A carregar produtos...</div> : products.length === 0 ? <div className="rounded-xl border border-dashed border-[#d8cdbb] bg-[#fffdf9] p-8 text-center"><p className="text-3xl">🛍️</p><h2 className="mt-3 text-base font-black">Ainda não há produtos</h2><p className="mt-1 text-xs text-[#776e62]">Os novos produtos da nossa coleção aparecerão aqui.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">{products.map((product) => { const selected = quantity(product.id); return <article key={product.id} className={`overflow-hidden rounded-xl border bg-[#fffdf9] shadow-sm transition ${selected > 0 ? "border-slate-950 ring-1 ring-slate-950/10" : "border-[#e5dccd]"}`}><div>{product.image_url ? <img src={product.image_url} alt={product.name} className="h-40 w-full object-cover sm:h-52" /> : <div className="flex h-40 items-center justify-center bg-[#f4efe6] text-3xl sm:h-52">🛍️</div>}</div><div className="p-3 sm:p-4"><p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#776e62]">{product.category}</p><h2 className="mt-1 truncate text-sm font-black">{product.name}</h2><p className="mt-2 text-base font-black">{Number(product.price).toLocaleString("pt-MZ")} MT</p><p className={product.stock > 0 ? "mt-1 text-[11px] font-semibold text-[#8b6b2f]" : "mt-1 text-[11px] font-semibold text-[#a14b3f]"}>{product.stock > 0 ? `${product.stock} disponíveis` : "Esgotado"}</p><button type="button" disabled={product.stock <= 0} onClick={() => selectProduct(product)} className={`mt-3 w-full rounded-lg px-3 py-2.5 text-xs font-bold transition ${selected > 0 ? "bg-[#a88745] text-white" : "bg-[#17130d] text-white"} disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-[#9a8f80]`}>{selected > 0 ? `✓ Selecionado · ${selected}` : "Fazer encomenda"}</button>{selected > 0 && <button type="button" onClick={() => removeProduct(product.id)} className="mt-1.5 w-full py-1.5 text-[11px] font-semibold text-[#776e62] hover:text-[#a14b3f]">Remover</button>}</div></article>; })}</div>}
    </section>
    {itemCount > 0 && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5dccd] bg-[#fffdf9]/95 p-3 shadow-xl backdrop-blur"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3"><div><p className="text-xs font-bold text-[#776e62]">{itemCount} {itemCount === 1 ? "item" : "itens"}</p><p className="text-base font-black">{total.toLocaleString("pt-MZ")} MT</p></div><button type="button" onClick={() => navigate({ to: "/checkout" })} className="rounded-lg bg-[#17130d] px-4 py-2.5 text-xs font-bold text-white">Fazer encomenda →</button></div></div>}
  </main>);
}
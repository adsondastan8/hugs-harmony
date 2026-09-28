import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { listPublicProducts, type Product } from "../lib/supabase-data";
type CartItem = { productId: string; quantity: number };
const CART_KEY = "adson-fashion-cart";
function readCart(): CartItem[] { try { return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as CartItem[]; } catch { return []; } }
function writeCart(items: CartItem[]) { localStorage.setItem(CART_KEY, JSON.stringify(items)); }
export const Route = createFileRoute("/produtos")({ component: ProductsPage });
function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  function refreshCartCount() { setCartCount(readCart().reduce((sum, item) => sum + item.quantity, 0)); }
  useEffect(() => { refreshCartCount(); let active = true; void listPublicProducts().then((data) => { if (active) setProducts(data); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar os produtos."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  function addToCart(product: Product) { const cart = readCart(); const existing = cart.find((item) => item.productId === product.id); if (existing) existing.quantity = Math.min(existing.quantity + 1, product.stock); else cart.push({ productId: product.id, quantity: 1 }); writeCart(cart); refreshCartCount(); }
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button type="button" onClick={() => navigate({ to: "/" })} className="text-left"><p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Adson Fashion</p><p className="text-xl font-black">Produtos</p></button>
          <button type="button" onClick={() => navigate({ to: "/checkout" })} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">🛒 Carrinho {cartCount > 0 ? `(${cartCount})` : ""}</button>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Catálogo</p><h1 className="mt-2 text-4xl font-black">Veja os nossos produtos</h1><p className="mt-3 max-w-2xl text-slate-600">Escolha o que deseja comprar. Não precisa criar conta para fazer a encomenda.</p></div>
        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {loading ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500">A carregar produtos...</div> : products.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><p className="text-5xl">🛍️</p><h2 className="mt-4 text-xl font-black">Ainda não há produtos</h2><p className="mt-2 text-sm text-slate-500">Os produtos adicionados pelo ADM aparecerão aqui.</p></div> :
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-64 w-full object-cover" /> : <div className="flex h-64 items-center justify-center bg-slate-100 text-5xl">🛍️</div>}<div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{product.category}</p><h2 className="mt-2 text-lg font-black">{product.name}</h2><p className="mt-3 text-xl font-black">{Number(product.price).toLocaleString("pt-MZ")} MT</p><p className={product.stock > 0 ? "mt-2 text-sm font-semibold text-emerald-600" : "mt-2 text-sm font-semibold text-red-600"}>{product.stock > 0 ? `${product.stock} disponíveis` : "Esgotado"}</p><button type="button" disabled={product.stock <= 0} onClick={() => addToCart(product)} className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Adicionar ao carrinho</button></div></article>)}</div>
        }
      </section>
    </main>
  );
}
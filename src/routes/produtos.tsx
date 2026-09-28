import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { listPublicProducts, type Product } from "../lib/supabase-data";

type OrderItem = { productId: string; quantity: number };
const ORDER_KEY = "adson-fashion-cart";

function readOrder(): OrderItem[] {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]") as OrderItem[];
  } catch {
    return [];
  }
}

function writeOrder(items: OrderItem[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(items));
}

export const Route = createFileRoute("/produtos")({ component: ProductsPage });

function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderItem[]>([]);

  useEffect(() => {
    setOrder(readOrder());
    let active = true;
    void listPublicProducts()
      .then((data) => { if (active) setProducts(data); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar os produtos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function selectProduct(product: Product) {
    const existing = order.find((item) => item.productId === product.id);
    const next = existing
      ? order.map((item) => item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item)
      : [...order, { productId: product.id, quantity: 1 }];
    setOrder(next);
    writeOrder(next);
  }

  function removeProduct(productId: string) {
    const next = order.filter((item) => item.productId !== productId);
    setOrder(next);
    writeOrder(next);
  }

  function quantity(productId: string) {
    return order.find((item) => item.productId === productId)?.quantity ?? 0;
  }

  const itemCount = order.reduce((sum, item) => sum + item.quantity, 0);
  const total = order.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? Number(product.price) * item.quantity : 0);
  }, 0);

  return (
    <main className="min-h-screen bg-slate-50 pb-32 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button type="button" onClick={() => navigate({ to: "/" })} className="text-left">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Adson Fashion</p>
            <p className="text-xl font-black">Produtos</p>
          </button>
          {itemCount > 0 && (
            <button type="button" onClick={() => navigate({ to: "/checkout" })} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
              Minha encomenda · {itemCount}
            </button>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Catálogo</p>
          <h1 className="mt-2 text-4xl font-black">Escolha o que deseja encomendar</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Pode escolher um produto ou vários. Quando terminar, toque em <strong>Fazer encomenda</strong>.</p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500">A carregar produtos...</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-5xl">🛍️</p><h2 className="mt-4 text-xl font-black">Ainda não há produtos</h2>
            <p className="mt-2 text-sm text-slate-500">Os produtos adicionados pelo ADM aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const selected = quantity(product.id);
              return (
                <article key={product.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${selected > 0 ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200"}`}>
                  {product.image_url ? <img src={product.image_url} alt={product.name} className="h-64 w-full object-cover" /> : <div className="flex h-64 items-center justify-center bg-slate-100 text-5xl">🛍️</div>}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{product.category}</p>
                    <h2 className="mt-2 text-lg font-black">{product.name}</h2>
                    <p className="mt-3 text-xl font-black">{Number(product.price).toLocaleString("pt-MZ")} MT</p>
                    <p className={product.stock > 0 ? "mt-2 text-sm font-semibold text-emerald-600" : "mt-2 text-sm font-semibold text-red-600"}>{product.stock > 0 ? `${product.stock} disponíveis` : "Esgotado"}</p>
                    <button type="button" disabled={product.stock <= 0} onClick={() => selectProduct(product)} className={`mt-4 w-full rounded-xl px-4 py-3 font-bold transition ${selected > 0 ? "bg-emerald-600 text-white" : "bg-slate-950 text-white"} disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400`}>
                      {selected > 0 ? `✓ Selecionado · ${selected}` : "Fazer encomenda"}
                    </button>
                    {selected > 0 && (
                      <button type="button" onClick={() => removeProduct(product.id)} className="mt-2 w-full py-2 text-sm font-semibold text-slate-500 hover:text-red-600">Remover da encomenda</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div><p className="text-sm font-bold text-slate-500">{itemCount} {itemCount === 1 ? "item" : "itens"} selecionado{itemCount === 1 ? "" : "s"}</p><p className="text-lg font-black">{total.toLocaleString("pt-MZ")} MT</p></div>
            <button type="button" onClick={() => navigate({ to: "/checkout" })} className="rounded-xl bg-slate-950 px-6 py-3.5 font-bold text-white shadow-lg">Fazer encomenda →</button>
          </div>
        </div>
      )}
    </main>
  );
}
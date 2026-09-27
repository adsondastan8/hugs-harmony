import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getCurrentUser } from "../lib/supabase-auth";
import { createProduct, deleteProduct, listProducts, type Product } from "../lib/supabase-data";

export function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Roupa");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate({ to: "/" });
          return;
        }
        const data = await listProducts();
        if (active) setProducts(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar os produtos.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [navigate]);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const numericPrice = Number(price.replace(",", "."));
    const numericStock = Number(stock);
    if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 || !Number.isInteger(numericStock) || numericStock < 0) {
      setError("Preencha nome, preço e estoque corretamente.");
      return;
    }
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) { navigate({ to: "/" }); return; }
      const product = await createProduct({
        name: name.trim(), category, price: numericPrice, stock: numericStock, created_by: user.id,
      });
      setProducts((current) => [product, ...current]);
      setName(""); setPrice(""); setStock("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível guardar o produto.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(id: string) {
    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível remover o produto.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Adson Fashion</p>
            <h1 className="mt-1 text-2xl font-black">Produtos</h1>
          </div>
          <button type="button" onClick={() => navigate({ to: "/admin" })} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800">
            Voltar ao painel
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div>
          <p className="text-sm font-semibold text-slate-500">Gestão da loja</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Meus produtos</h2>
          <p className="mt-3 text-slate-600">Os produtos ficam guardados permanentemente no Supabase.</p>
        </div>
        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        <form onSubmit={addProduct} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">Adicionar produto</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
              <option>Roupa</option><option>Calçado</option><option>Acessório</option><option>Outro</option>
            </select>
            <input required value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="Preço (MT)" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
            <input required value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" placeholder="Estoque" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          </div>
          <button type="submit" disabled={saving} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-60">
            {saving ? "A guardar..." : "Guardar produto"}
          </button>
        </form>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? <div className="p-10 text-center text-slate-500">A carregar produtos...</div> :
           products.length === 0 ? <div className="p-10 text-center"><div className="text-4xl">📦</div><h3 className="mt-4 text-xl font-bold">Ainda não há produtos</h3></div> :
           <div className="divide-y divide-slate-200">{products.map((product) => (
             <div key={product.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
               <div><h3 className="font-bold">{product.name}</h3><p className="mt-1 text-sm text-slate-500">{product.category} · {product.stock} em estoque</p></div>
               <div className="flex items-center gap-4"><span className="font-bold">{Number(product.price).toLocaleString("pt-MZ")} MT</span><button type="button" onClick={() => void removeProduct(product.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Remover</button></div>
             </div>
           ))}</div>}
        </div>
      </section>
    </main>
  );
}

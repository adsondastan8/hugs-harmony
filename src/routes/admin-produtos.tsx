import { FormEvent, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProducts,
});

type Product = {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: string;
};

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Roupa");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !price.trim() || !stock.trim()) return;

    setProducts((current) => [
      ...current,
      { id: Date.now(), name: name.trim(), category, price: price.trim(), stock: stock.trim() },
    ]);
    setName("");
    setPrice("");
    setStock("");
    setShowForm(false);
  }

  function removeProduct(id: number) {
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Adson Fashion</p>
            <h1 className="mt-1 text-2xl font-black">Produtos</h1>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800">
            Voltar ao painel
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-slate-500">Gestão da loja</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Meus produtos</h2>
            <p className="mt-3 text-slate-600">Cadastre os produtos que ficarão disponíveis para os clientes.</p>
          </div>
          <button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white hover:bg-slate-800">
            {showForm ? "Fechar formulário" : "+ Adicionar produto"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={addProduct} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Novo produto</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Nome do produto</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Camiseta básica" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Categoria</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-950">
                  <option>Roupa</option>
                  <option>Calçado</option>
                  <option>Acessório</option>
                  <option>Outro</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Preço (MT)</span>
                <input required value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="Ex.: 1500" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Estoque</span>
                <input required value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" placeholder="Ex.: 10" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              </label>
            </div>
            <button type="submit" className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800">Guardar produto</button>
          </form>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {products.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">📦</div>
              <h3 className="mt-4 text-xl font-bold">Ainda não há produtos</h3>
              <p className="mt-2 text-slate-500">Clique em “Adicionar produto” para começar o catálogo.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{product.category} · {product.stock} em estoque</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{product.price} MT</span>
                    <button type="button" onClick={() => removeProduct(product.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

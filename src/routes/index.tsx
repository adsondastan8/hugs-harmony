import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { listPublicProducts, type Product } from "../lib/supabase-data";

export const Route = createFileRoute("/")({
  component: StoreHome,
});

function StoreHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  useEffect(() => {
    let active = true;
    void listPublicProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((error) => {
        if (active) setProductError(error instanceof Error ? error.message : "Não foi possível carregar os produtos.");
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Adson Fashion</p>
            <h1 className="mt-1 text-2xl font-black">Moda para si</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/cliente" })}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
          >
            Minha conta
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Adson Fashion</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            Escolha o seu produto e faça a sua encomenda.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Crie a sua conta de cliente, escolha os produtos e receba a sua encomenda com pagamento na entrega.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/cliente" })}
            className="mt-8 rounded-xl bg-white px-6 py-3.5 font-bold text-slate-950"
          >
            Criar conta / Entrar
          </button>
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Produtos</p>
              <h2 className="mt-2 text-3xl font-black">Escolha o seu produto</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold ring-1 ring-slate-200">{products.length} produtos</span>
          </div>

          {productError && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{productError}</div>}

          {loadingProducts ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">A carregar produtos...</div>
          ) : products.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-4xl">🛍️</p>
              <p className="mt-3 font-bold text-slate-800">Ainda não há produtos disponíveis.</p>
              <p className="mt-1 text-sm text-slate-500">Os produtos adicionados pelo ADM aparecerão aqui.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-slate-100 text-5xl">🛍️</div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{product.category}</p>
                    <h3 className="mt-2 text-lg font-black">{product.name}</h3>
                    <p className="mt-3 text-xl font-black">{Number(product.price).toLocaleString("pt-MZ")} MT</p>
                    <p className={`mt-2 text-sm font-semibold ${product.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {product.stock > 0 ? `${product.stock} disponíveis` : "Esgotado"}
                    </p>
                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => navigate({ to: "/cliente" })}
                      className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {product.stock > 0 ? "Comprar" : "Indisponível"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-3xl">🛍️</div>
            <h3 className="mt-4 text-lg font-black">Escolha o produto</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Veja os produtos disponíveis na loja.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-3xl">📦</div>
            <h3 className="mt-4 text-lg font-black">Delivery</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Informe o local onde deseja receber a encomenda.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-3xl">💵</div>
            <h3 className="mt-4 text-lg font-black">Pague na entrega</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">O pagamento é feito quando receber o pedido.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

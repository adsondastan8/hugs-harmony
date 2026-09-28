import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: StoreHome,
});

function StoreHome() {
  const navigate = useNavigate();

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

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
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

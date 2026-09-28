import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { listPublicProducts, type Product } from "../lib/supabase-data";

export const Route = createFileRoute("/")({ component: StoreHome });

function StoreHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => { void listPublicProducts().then(setProducts).catch(() => setProducts([])); }, []);

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={() => navigate({ to: "/" })} className="text-left">
            <p className="text-sm font-black tracking-tight">Adson Fashion</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Estilo para todos os dias</p>
          </button>
          <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 sm:flex">
            <a href="#destaques" className="hover:text-slate-950">Destaques</a>
            <a href="#experiencia" className="hover:text-slate-950">Como comprar</a>
            <a href="#entrega" className="hover:text-slate-950">Entrega</a>
          </nav>
          <button type="button" onClick={() => navigate({ to: "/produtos" })} className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800">Comprar agora</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-8 text-white sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 right-20 h-72 w-72 rounded-full bg-slate-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">Nova experiência de compra</span>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">O seu estilo.<br /><span className="text-white/60">A sua escolha.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Descubra peças, escolha os seus favoritos e faça a sua encomenda de forma simples, rápida e segura. Pague apenas quando receber.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate({ to: "/produtos" })} className="rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">Explorar produtos →</button>
              <a href="#experiencia" className="rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Saber como funciona</a>
            </div>
          </div>
          <div className="relative mt-8 grid max-w-xl grid-cols-3 gap-2 sm:absolute sm:bottom-7 sm:right-8 sm:mt-0 sm:w-[330px]">
            <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur"><p className="text-lg font-black">01</p><p className="mt-1 text-[10px] text-white/60">Escolha</p></div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur"><p className="text-lg font-black">02</p><p className="mt-1 text-[10px] text-white/60">Encomende</p></div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur"><p className="text-lg font-black">03</p><p className="mt-1 text-[10px] text-white/60">Receba</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-black">Compra simples</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Encomenda simples e rápida.</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-black">Entrega fácil</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Escolha a sua zona de entrega.</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-black">Pagamento</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Pague quando receber.</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-black">Atendimento</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Confirmação rápida pelo WhatsApp.</p></div>
      </section>

      {products.length > 0 && (
        <section id="destaques" className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Seleção da loja</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Destaques</h2></div>
            <button type="button" onClick={() => navigate({ to: "/produtos" })} className="text-xs font-bold underline underline-offset-4">Ver catálogo</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <button type="button" key={product.id} onClick={() => navigate({ to: "/produtos" })} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                {product.image_url ? <img src={product.image_url} alt={product.name} className="h-44 w-full object-cover sm:h-56" /> : <div className="flex h-44 items-center justify-center bg-slate-100 text-3xl sm:h-56">🛍️</div>}
                <div className="p-3"><p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{product.category}</p><p className="mt-1 truncate text-sm font-black">{product.name}</p><p className="mt-2 text-sm font-black">{Number(product.price).toLocaleString("pt-MZ")} MT</p></div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section id="experiencia" className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="max-w-xl"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Uma compra sem complicação</p><h2 className="mt-1.5 text-xl font-black sm:text-2xl">Do produto à entrega em poucos passos.</h2></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[["01","Escolha","Explore o catálogo e selecione os produtos que quer encomendar."],["02","Revise","Confira quantidades e o valor da sua encomenda."],["03","Informe","Indique telefone, endereço, zona e hora de entrega."],["04","Confirme","A sua encomenda é preparada e confirmada pelo WhatsApp."]].map(([number,title,description]) => <div key={number} className="rounded-xl bg-slate-50 p-4"><span className="text-[10px] font-black text-slate-400">{number}</span><h3 className="mt-3 text-sm font-black">{title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p></div>)}
          </div>
        </div>
      </section>

      <section id="entrega" className="mx-auto max-w-7xl px-4 py-2 pb-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-lg">🚚</p><h2 className="mt-2 text-base font-black">Entrega transparente</h2><p className="mt-1.5 text-xs leading-5 text-slate-500">Dentro da cidade, a entrega é grátis. Para bairros, aplica-se uma taxa fixa de 70 MT.</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-lg">💳</p><h2 className="mt-2 text-base font-black">Pagamento na entrega</h2><p className="mt-1.5 text-xs leading-5 text-slate-500">Não precisa pagar online. O pagamento é feito quando receber a encomenda.</p></div>
        </div>
      </section>

      <section className="mx-4 mb-8 overflow-hidden rounded-2xl bg-slate-950 px-5 py-8 text-center text-white sm:mx-auto sm:max-w-7xl sm:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Adson Fashion</p>
        <h2 className="mt-2 text-xl font-black">Encontre o seu próximo favorito.</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/60">Explore o catálogo e faça a sua encomenda quando estiver pronto.</p>
        <button type="button" onClick={() => navigate({ to: "/produtos" })} className="mt-5 rounded-lg bg-white px-5 py-2.5 text-sm font-black text-slate-950">Ver produtos →</button>
      </section>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p>© {new Date().getFullYear()} Adson Fashion</p><p>Moda • Entrega • Pagamento na entrega</p></div></footer>
    </main>
  );
}
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div>
            <p className="text-2xl font-black tracking-tight text-slate-950">ADSON FASHION</p>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">Moda & estilo</p>
          </div>

          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-6 flex-col gap-1.5">
              <span className="h-0.5 w-6 rounded-full bg-current" />
              <span className="h-0.5 w-6 rounded-full bg-current" />
              <span className="h-0.5 w-6 rounded-full bg-current" />
            </span>
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-5 top-[76px] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl sm:right-8">
            <nav aria-label="Menu principal" className="space-y-1">
              {[
                ["👤", "Criar conta"],
                ["🔐", "Fazer login"],
                ["🛍️", "Produtos"],
                ["🛒", "Meu carrinho"],
                ["❤️", "Favoritos"],
                ["📦", "Meus pedidos"],
                ["📞", "Contactar a loja"],
              ].map(([icon, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Bem-vindo à</p>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">Adson Fashion</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Descubra roupas e acessórios para expressar o seu estilo. Uma nova forma de conhecer a nossa loja e encontrar aquilo que combina consigo.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button type="button" className="rounded-xl bg-slate-950 px-6 py-3.5 font-bold text-white transition hover:bg-slate-800">
              Ver produtos
            </button>
            <button type="button" className="rounded-xl border border-slate-300 px-6 py-3.5 font-bold text-slate-900 transition hover:bg-slate-100">
              Conhecer a loja
            </button>
          </div>
        </div>

        <div className="flex min-h-[360px] items-center justify-center rounded-3xl bg-slate-100 p-10">
          <div className="text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-5xl shadow-sm">👗</div>
            <p className="mt-6 text-xl font-bold text-slate-900">Seu estilo começa aqui</p>
            <p className="mt-2 text-slate-500">Adson Fashion</p>
          </div>
        </div>
      </section>
    </main>
  );
}

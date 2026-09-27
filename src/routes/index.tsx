import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16 text-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Adson Fashion</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">Em construção</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Estamos a preparar a nova estrutura da loja. Primeiro vamos construir a Área ADM e depois a área dos clientes.
          </p>
        </div>
      </section>
    </main>
  );
}

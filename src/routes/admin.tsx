import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getCurrentUser, signOut } from "../lib/supabase-auth";
import { AdminProducts } from "../components/AdminProducts";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

const cards = [
  ["📦", "Produtos", "Cadastrar e gerir os produtos da loja.", "/admin/produtos"],
  ["🛒", "Pedidos", "Ver e confirmar pedidos dos clientes.", null],
  ["👥", "Clientes", "Consultar os clientes registados.", null],
  ["📊", "Estatísticas", "Acompanhar o movimento da loja.", null],
] as const;

function AdminDashboard() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [module, setModule] = useState<"dashboard" | "produtos">("dashboard");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate({ to: "/" });
          return;
        }
        if (active) setEmail(user.email ?? "");
      } catch {
        navigate({ to: "/" });
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <p className="text-sm font-semibold text-slate-500">A verificar a sua sessão...</p>
      </main>
    );
  }

  if (module === "produtos") {
    return <AdminProducts />;
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Adson Fashion</p>
            <h1 className="mt-1 text-2xl font-black">Painel do ADM</h1>
            {email && <p className="mt-1 text-xs text-slate-400">{email}</p>}
          </div>
          <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800">
            Sair
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div>
          <p className="text-sm font-semibold text-slate-500">Bem-vindo ao painel</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Gestão da loja</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Aqui será possível administrar produtos, pedidos e clientes da Adson Fashion.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([icon, title, description, path]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              {path ? (
                <button type="button" onClick={() => setModule("produtos")} className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                  Abrir módulo
                </button>
              ) : (
                <button type="button" disabled className="mt-5 cursor-not-allowed rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-500">
                  Em breve
                </button>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h3 className="text-xl font-bold text-slate-950">Próximas funções</h3>
          <p className="mt-2 text-slate-600">
            O próximo passo será ligar os produtos ao Supabase para que os dados fiquem guardados permanentemente.
          </p>
        </div>
      </section>
    </main>
  );
}

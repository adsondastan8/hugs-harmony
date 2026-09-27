import { FormEvent, useState } from "react";
import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    navigate({ to: "/admin" });
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Adson Fashion</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Área do ADM</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Entre na sua conta de administrador para gerir a loja.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">E-mail</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@adsonfashion.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">Palavra-passe</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite a sua palavra-passe"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-20 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800"
            >
              Entrar no ADM
            </button>
          </form>

          <div className="mt-7 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs leading-5 text-slate-500">
              Esta versão é apenas para testar o acesso ao painel. A autenticação real será ligada ao Supabase depois.
            </p>
            <Link to="/" className="mt-3 inline-block text-sm font-semibold text-slate-700 hover:underline">
              Área da loja
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

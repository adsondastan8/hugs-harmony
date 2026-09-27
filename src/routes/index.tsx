import { FormEvent, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signIn, signUp } from "../lib/supabase-auth";

export const Route = createFileRoute("/")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mode === "signup" && !name.trim()) {
      setError("Digite o seu nome.");
      return;
    }

    if (mode === "signup" && password !== confirmation) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUp(email.trim(), password, name.trim());
        if (result.session) {
          navigate({ to: "/admin" });
        } else {
          setMessage("Conta criada. Verifique o seu e-mail para confirmar a conta e depois entre no ADM.");
          setMode("login");
          setPassword("");
          setConfirmation("");
        }
      } else {
        await signIn(email.trim(), password);
        navigate({ to: "/admin" });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir a operação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Adson Fashion</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {mode === "login" ? "Área do ADM" : "Criar conta ADM"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "Entre na sua conta de administrador para gerir a loja."
                : "Crie a sua conta de administrador para começar a gerir a loja."}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => switchMode("login")} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
              Entrar
            </button>
            <button type="button" onClick={() => switchMode("signup")} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
              Criar conta
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label htmlFor="admin-name" className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
                <input id="admin-name" type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200" />
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">E-mail</label>
              <input id="admin-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@adsonfashion.com" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200" />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">Palavra-passe</label>
              <div className="relative">
                <input id="admin-password" type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite a sua palavra-passe" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-20 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="admin-confirmation" className="mb-2 block text-sm font-semibold text-slate-700">Confirmar palavra-passe</label>
                <input id="admin-confirmation" type={showPassword ? "text" : "password"} required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repita a palavra-passe" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200" />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Aguarde..." : mode === "login" ? "Entrar no ADM" : "Criar conta ADM"}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs leading-5 text-slate-500">
              A autenticação é feita pelo Supabase. A palavra-passe não é guardada no código da loja.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

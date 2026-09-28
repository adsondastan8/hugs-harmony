import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getCurrentUser, signIn, signOut, signUp } from "../lib/supabase-auth";
import { getCustomerProfile, saveCustomerProfile } from "../lib/supabase-customers";

export const Route = createFileRoute("/cliente")({
  component: CustomerPage,
});

function CustomerPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setLoggedIn(true);
      setEmail(user.email ?? "");
      const profile = await getCustomerProfile();
      if (profile) {
        setName(profile.name);
        setPhone(profile.phone);
        setAddress(profile.delivery_address);
      }
    })();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (mode === "signup" && password !== confirmation) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (mode === "signup" && (!name.trim() || !phone.trim() || !address.trim())) {
      setError("Preencha nome, telefone e endereço de entrega.");
      return;
    }
    setLoading(true);
    try {
      if (!loggedIn) {
        if (mode === "signup") {
          const result = await signUp(email.trim(), password, name.trim());
          if (!result.session) {
            setMessage("Conta criada. Confirme o seu e-mail e depois entre.");
            setMode("login");
            return;
          }
        } else {
          await signIn(email.trim(), password);
        }
        setLoggedIn(true);
      }
      await saveCustomerProfile({ name: name.trim(), phone: phone.trim(), delivery_address: address.trim() });
      setMessage("Dados guardados com sucesso. A sua conta está pronta para comprar.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await signOut();
    setLoggedIn(false);
    setPassword("");
    setConfirmation("");
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Adson Fashion</p>
          <h1 className="mt-3 text-3xl font-black">{loggedIn ? "Minha conta" : mode === "signup" ? "Criar conta" : "Entrar"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Crie a sua conta para guardar os dados de entrega e fazer pedidos.
          </p>

          {!loggedIn && (
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button type="button" onClick={() => setMode("login")} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${mode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}>Entrar</button>
              <button type="button" onClick={() => setMode("signup")} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${mode === "signup" ? "bg-white shadow-sm" : "text-slate-500"}`}>Criar conta</button>
            </div>
          )}

          {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          {message && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}

          <form onSubmit={submit} className="mt-6 space-y-5">
            {!loggedIn && mode === "signup" && <label className="grid gap-2 text-sm font-semibold">Nome<input required value={name} onChange={e => setName(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>}
            {!loggedIn && <label className="grid gap-2 text-sm font-semibold">E-mail<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>}
            {!loggedIn && <label className="grid gap-2 text-sm font-semibold">Palavra-passe<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>}
            {!loggedIn && mode === "signup" && <label className="grid gap-2 text-sm font-semibold">Confirmar palavra-passe<input required minLength={6} type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>}
            <label className="grid gap-2 text-sm font-semibold">Telefone<input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+258..." className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Endereço de entrega<textarea required value={address} onChange={e => setAddress(e.target.value)} rows={4} className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
            <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white disabled:opacity-60">{loading ? "A guardar..." : loggedIn ? "Guardar dados" : mode === "signup" ? "Criar conta" : "Entrar"}</button>
          </form>

          {loggedIn && (
            <>
              <button
                type="button"
                onClick={() => navigate({ to: "/" })}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-bold text-white"
              >
                Continuar a comprar
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="mt-3 w-full rounded-xl border border-slate-300 px-5 py-3 font-bold"
              >
                Sair da conta
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

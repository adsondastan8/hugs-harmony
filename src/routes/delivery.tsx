import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getDeliveryProfile, getDeliverySession, setDeliveryOnline, signInDelivery, signOutDelivery, signUpDelivery } from "../lib/delivery-auth";

export const Route = createFileRoute("/delivery")({ component: DeliveryPage });

type Profile = { id:string; name:string; phone:string; login_email:string|null; is_online:boolean };

function DeliveryPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [profile,setProfile]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login");

  async function load() {
    setLoading(true); setError("");
    try {
      if (getDeliverySession()) {
        const p=await getDeliveryProfile();
        if (!p) { await signOutDelivery(); setError("Este acesso não está configurado como delivery."); }
        else setProfile(p);
      }
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível carregar o acesso."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); },[]);

  async function login(e:FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        await signUpDelivery(email.trim(),password);
      } else {
        await signInDelivery(email.trim(),password);
      }
      const p=await getDeliveryProfile();
      if (!p) { await signOutDelivery(); throw new Error("Este email ainda não foi associado a um delivery pelo administrador."); }
      setProfile(p);
    } catch(e) { setError(e instanceof Error ? e.message : mode === "signup" ? "Não foi possível criar o acesso." : "Email ou palavra-passe inválidos."); }
    finally { setLoading(false); }
  }

  async function changeStatus(value:boolean) {
    if (!profile) return;
    setSaving(true); setError("");
    try { const p=await setDeliveryOnline(profile.id,value); if(p) setProfile(p); }
    catch(e) { setError(e instanceof Error ? e.message : "Não foi possível atualizar o estado."); }
    finally { setSaving(false); }
  }

  async function logout() { await signOutDelivery(); setProfile(null); }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f5f1e8] text-[#171512]"><p className="font-bold">A carregar...</p></main>;

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#171512] sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-[#e7ded0] bg-[#fffcf7] p-6 shadow-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8905a]">Adson Fashion</p>
          <h1 className="mt-2 text-3xl font-black">Área do Delivery</h1>
          {!profile ? (
            <>
              <p className="mt-2 text-sm leading-6 text-[#756f67]">{mode === "login" ? "Entre com o seu acesso individual para indicar quando está disponível para fazer entregas." : "Primeiro acesso: use o email que o administrador associou ao seu delivery e crie a sua palavra-passe."}</p>
              {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
              <form onSubmit={login} className="mt-6 grid gap-4">
                <label className="text-sm font-bold">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d9cebf] bg-white px-4 py-3 outline-none focus:border-[#b8905a]" placeholder="delivery@email.com"/></label>
                <label className="text-sm font-bold">Palavra-passe<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d9cebf] bg-white px-4 py-3 outline-none focus:border-[#b8905a]" placeholder="••••••••"/></label>
                <button disabled={loading} className="rounded-xl bg-[#171512] px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? "A processar..." : mode === "login" ? "Entrar" : "Criar acesso"}</button>
              </form>
              <button type="button" onClick={()=>{setMode(mode === "login" ? "signup" : "login");setError("");}} className="mt-5 w-full text-center text-xs font-bold text-[#8b6b2f]">{mode === "login" ? "É o seu primeiro acesso? Criar acesso" : "Já tem acesso? Entrar"}</button>
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-[#171512] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-[#b8905a]">Delivery</p>
                <h2 className="mt-1 text-2xl font-black">{profile.name}</h2>
                <p className="mt-1 text-sm text-white/60">{profile.phone}</p>
              </div>
              {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
              <div className="mt-6 rounded-2xl border border-[#e7ded0] bg-white p-5">
                <p className="text-sm font-bold">O seu estado agora</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`h-4 w-4 rounded-full ${profile.is_online ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xl font-black">{profile.is_online ? "Online" : "Offline"}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button type="button" disabled={saving || profile.is_online} onClick={()=>void changeStatus(true)} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40">🟢 Estou Online</button>
                  <button type="button" disabled={saving || !profile.is_online} onClick={()=>void changeStatus(false)} className="rounded-xl bg-[#171512] px-4 py-3 text-sm font-black text-white disabled:opacity-40">🔴 Estou Offline</button>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-[#faf7f1] p-4 text-sm leading-6 text-[#625a50]">Quando ficar <strong>Online</strong>, o seu nome aparecerá como disponível no checkout dos clientes. Ao ficar <strong>Offline</strong>, deixará de poder ser selecionado.</div>
              <button type="button" onClick={()=>void logout()} className="mt-6 w-full rounded-xl border border-[#d9cebf] px-4 py-3 text-sm font-bold">Sair</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getCurrentUser, signOut } from "../lib/supabase-auth";
import { createProduct, deleteProduct, listProducts, type Product } from "../lib/supabase-data";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

const cards = [
  ["📦", "Produtos", "Cadastrar e gerir os produtos da loja.", "produtos"],
  ["🛒", "Pedidos", "Ver e confirmar pedidos dos clientes.", null],
  ["👥", "Clientes", "Consultar os clientes registados.", null],
  ["📊", "Estatísticas", "Acompanhar o movimento da loja.", null],
] as const;

function AdminDashboard() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [module, setModule] = useState<"dashboard" | "produtos">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("Roupa");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");

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

  useEffect(() => {
    if (module !== "produtos") return;

    let active = true;
    setProductError("");
    setProductLoading(true);

    void listProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((e) => {
        if (active) {
          setProductError(e instanceof Error ? e.message : "Não foi possível carregar os produtos.");
        }
      })
      .finally(() => {
        if (active) setProductLoading(false);
      });

    return () => {
      active = false;
    };
  }, [module]);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductError("");
    const price = Number(productPrice.replace(",", "."));
    const stock = Number(productStock);
    if (!productName.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setProductError("Preencha nome, preço e estoque corretamente.");
      return;
    }
    setProductSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) { navigate({ to: "/" }); return; }
      const product = await createProduct({ name: productName.trim(), category: productCategory, price, stock, created_by: user.id });
      setProducts((current) => [product, ...current]);
      setProductName(""); setProductPrice(""); setProductStock("");
    } catch (e) {
      setProductError(e instanceof Error ? e.message : "Não foi possível guardar o produto.");
    } finally { setProductSaving(false); }
  }

  async function removeProduct(id: string) {
    try { await deleteProduct(id); setProducts((current) => current.filter((p) => p.id !== id)); }
    catch (e) { setProductError(e instanceof Error ? e.message : "Não foi possível remover o produto."); }
  }

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
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
            <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Adson Fashion</p><h1 className="mt-1 text-2xl font-black">Produtos</h1></div>
            <button type="button" onClick={() => setModule("dashboard")} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold">Voltar ao painel</button>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <h2 className="text-4xl font-black">Adicionar produto</h2>
          <p className="mt-3 text-slate-600">Os produtos serão guardados no Supabase.</p>
          {productError && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{productError}</div>}
          <form onSubmit={addProduct} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2">
              <input required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Nome do produto" className="rounded-xl border border-slate-300 px-4 py-3" />
              <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3"><option>Roupa</option><option>Calçado</option><option>Acessório</option><option>Outro</option></select>
              <input required value={productPrice} onChange={(e) => setProductPrice(e.target.value)} inputMode="decimal" placeholder="Preço (MT)" className="rounded-xl border border-slate-300 px-4 py-3" />
              <input required value={productStock} onChange={(e) => setProductStock(e.target.value)} inputMode="numeric" placeholder="Estoque" className="rounded-xl border border-slate-300 px-4 py-3" />
            </div>
            <button type="submit" disabled={productSaving} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-60">{productSaving ? "A guardar..." : "Guardar produto"}</button>
          </form>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">{productLoading ? <p className="p-8 text-center text-slate-500">A carregar...</p> : products.length === 0 ? <p className="p-8 text-center text-slate-500">Ainda não há produtos.</p> : products.map((p) => <div key={p.id} className="flex items-center justify-between border-b border-slate-200 p-5"><div><b>{p.name}</b><p className="text-sm text-slate-500">{p.category} · {p.stock} em estoque</p></div><div className="flex items-center gap-4"><b>{Number(p.price).toLocaleString("pt-MZ")} MT</b><button type="button" onClick={() => void removeProduct(p.id)} className="text-sm font-semibold text-red-600">Remover</button></div></div>)}</div>
        </section>
      </main>
    );
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
          {cards.map(([icon, title, description, action]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              {action ? (
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

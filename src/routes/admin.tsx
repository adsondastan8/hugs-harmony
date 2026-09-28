import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  uploadProductImage,
  type Product,
} from "../lib/supabase-data";
import { getCurrentUser, signIn, signOut, signUp } from "../lib/supabase-auth";
import { listCustomers, type Customer } from "../lib/supabase-customers";
import {
  buildOrderWhatsAppUrl,
  listOrderItems,
  listOrders,
  updateOrderStatus,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "../lib/supabase-orders";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

const ADMIN_EMAIL = "adsondastan2@gmail.com";

const cards = [
  ["📦", "Produtos", "Cadastrar, editar e gerir o estoque.", "produtos"],
  ["🛒", "Pedidos", "Ver, confirmar e acompanhar os pedidos dos clientes.", "pedidos"],
  ["👥", "Clientes", "Consultar os clientes registados.", null],
  ["📊", "Estatísticas", "Acompanhar o movimento da loja.", null],
] as const;

function AdminDashboard() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [module, setModule] = useState<"dashboard" | "produtos" | "pedidos" | "clientes">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("Roupa");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productColors, setProductColors] = useState("");
  const [productSizes, setProductSizes] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          if (active) setAuthenticated(false);
          return;
        }
        if (active) { setAuthenticated(true); setEmail(user.email ?? ""); }
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

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
        throw new Error(`Este ADM aceita apenas o e-mail ${ADMIN_EMAIL}.`);
      }
      if (authMode === "signup") {
        if (!authName.trim()) throw new Error("Informe o seu nome.");
        const result = await signUp(authEmail.trim(), authPassword, authName.trim());
        if (result.needsEmailConfirmation) {
          setAuthError("Conta criada. Confirme o e-mail e depois faça login. O acesso ao ADM precisa ser autorizado pelo administrador.");
          setAuthMode("login");
          return;
        }
        const user = await getCurrentUser();
        if (!user) throw new Error("Conta criada, mas ainda não tem permissão de administrador. O administrador precisa autorizar esta conta.");
        setAuthenticated(true);
        setEmail(user.email ?? "");
      } else {
        await signIn(authEmail.trim(), authPassword);
        const user = await getCurrentUser();
        if (!user) throw new Error("Conta sem permissão de administrador.");
        setAuthenticated(true);
        setEmail(user.email ?? "");
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    if (module !== "pedidos") return;
    let active = true;
    setOrderError("");
    setOrderLoading(true);
    void listOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((e) => {
        if (active) setOrderError(e instanceof Error ? e.message : "Não foi possível carregar os pedidos.");
      })
      .finally(() => {
        if (active) setOrderLoading(false);
      });
    return () => { active = false; };
  }, [module]);

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

  useEffect(() => {
    if (module !== "clientes") return;
    let active = true;
    setCustomerError("");
    setCustomerLoading(true);
    void listCustomers()
      .then((data) => { if (active) setCustomers(data); })
      .catch((e) => { if (active) setCustomerError(e instanceof Error ? e.message : "Não foi possível carregar os clientes."); })
      .finally(() => { if (active) setCustomerLoading(false); });
    return () => { active = false; };
  }, [module]);

  function resetProductForm() {
    setEditingProductId(null);
    setProductName("");
    setProductCategory("Roupa");
    setProductPrice("");
    setProductStock("");
    setProductColors("");
    setProductSizes("");
    setProductImage(null);
  }

  function startEditing(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductCategory(product.category);
    setProductPrice(String(product.price));
    setProductStock(String(product.stock));
    setProductColors((product.colors ?? []).join(", "));
    setProductSizes((product.sizes ?? []).join(", "));
    setProductImage(null);
    setProductError("");
    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductError("");

    const price = Number(productPrice.replace(",", "."));
    const stock = Number(productStock);
    const colors = productColors.split(",").map((value) => value.trim()).filter(Boolean);
    const sizes = productSizes.split(",").map((value) => value.trim()).filter(Boolean);

    if (
      !productName.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setProductError("Preencha nome, preço e estoque corretamente.");
      return;
    }

    setProductSaving(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/" });
        return;
      }

      if (editingProductId) {
        const current = products.find((product) => product.id === editingProductId);
        let imageUrl = current?.image_url ?? null;

        if (productImage) {
          imageUrl = await uploadProductImage(editingProductId, productImage);
        }

        const updated = await updateProduct(editingProductId, {
          name: productName.trim(),
          category: productCategory,
          price,
          stock,
          image_url: imageUrl,
          colors,
          sizes,
        });

        setProducts((items) =>
          items.map((item) => (item.id === editingProductId ? updated : item)),
        );
      } else {
        const created = await createProduct({
          name: productName.trim(),
          category: productCategory,
          price,
          stock,
          created_by: user.id,
          colors,
          sizes,
        });

        let createdProduct = created;
        if (productImage) {
          const imageUrl = await uploadProductImage(created.id, productImage);
          createdProduct = await updateProduct(created.id, {
            name: created.name,
            category: created.category,
            price: Number(created.price),
            stock: created.stock,
            image_url: imageUrl,
          });
        }

        setProducts((items) => [createdProduct, ...items]);
      }

      resetProductForm();
    } catch (e) {
      setProductError(e instanceof Error ? e.message : "Não foi possível guardar o produto.");
    } finally {
      setProductSaving(false);
    }
  }

  async function removeProduct(id: string) {
    if (!window.confirm("Tem certeza que deseja remover este produto?")) return;

    setProductError("");
    try {
      await deleteProduct(id);
      setProducts((items) => items.filter((product) => product.id !== id));
      if (editingProductId === id) resetProductForm();
    } catch (e) {
      setProductError(e instanceof Error ? e.message : "Não foi possível remover o produto.");
    }
  }

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  function requestLogout() {
    setLogoutConfirmOpen(true);
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <p className="text-sm font-semibold text-slate-500">A verificar o acesso do ADM...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Adson Fashion</p>
          <h1 className="mt-3 text-3xl font-black">Área do ADM</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Entre no painel ou crie uma conta de administrador para solicitar acesso.</p>
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${authMode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}>Entrar</button>
            <button type="button" onClick={() => { setAuthMode("signup"); setAuthError(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${authMode === "signup" ? "bg-white shadow-sm" : "text-slate-500"}`}>Criar conta</button>
          </div>
          {authError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div>}
          <form onSubmit={submitAuth} className="mt-6 space-y-4">
            {authMode === "signup" && <label className="grid gap-2 text-sm font-semibold">Nome<input required value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Seu nome" className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>}
            <label className="grid gap-2 text-sm font-semibold">E-mail<input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="seu@email.com" className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-semibold">Palavra-passe<input required minLength={6} type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
            <button disabled={authLoading} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white disabled:opacity-60">{authLoading ? "A processar..." : authMode === "login" ? "Entrar no ADM" : "Criar conta"}</button>
          </form>
          {authMode === "signup" && <p className="mt-4 text-xs leading-5 text-slate-500">Por segurança, criar a conta não concede automaticamente privilégios de ADM. A conta deve ser autorizada pelo administrador.</p>}
        </div>
      </main>
    );
  }

  if (module === "pedidos") {
    const statusLabel: Record<OrderStatus, string> = {
      pending: "Pendente", confirmed: "Confirmado", sent: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
    };
    const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
      pending: "confirmed", confirmed: "sent", sent: "delivered",
    };
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
            <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Adson Fashion</p><h1 className="mt-1 text-2xl font-black">Gestão de pedidos</h1></div>
            <button type="button" onClick={() => setModule("dashboard")} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold">Voltar ao painel</button>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {orderError && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{orderError}</div>}
          {orderLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">A carregar pedidos...</div> : orders.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><p className="text-4xl">🛒</p><p className="mt-3 font-bold">Ainda não há pedidos.</p><p className="mt-1 text-sm">Os pedidos aparecerão aqui quando o checkout do cliente estiver ligado.</p></div> : (
            <div className="grid gap-5 lg:grid-cols-2">{orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pedido #{order.id.slice(0,8).toUpperCase()}</p><h2 className="mt-1 text-xl font-black">{order.customer_name}</h2><p className="text-sm text-slate-500">{order.customer_phone}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{statusLabel[order.status]}</span></div>
                <div className="mt-5 space-y-2 text-sm"><p><strong>Entrega:</strong> {order.delivery_address}</p><p><strong>Total:</strong> {Number(order.total).toLocaleString("pt-MZ")} MT</p>{order.notes && <p><strong>Observação:</strong> {order.notes}</p>}</div>
                <button type="button" onClick={async () => { const items = await listOrderItems(order.id); setOrderItems((current) => ({...current, [order.id]: items})); }} className="mt-5 text-sm font-bold underline">Ver produtos do pedido</button>
                {orderItems[order.id] && <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">{orderItems[order.id].map((item) => <p key={item.id}>• {item.product_name} × {item.quantity}{item.selected_color ? ` · Cor: ${item.selected_color}` : ""}{item.selected_size ? ` · Tamanho: ${item.selected_size}` : ""} — {Number(item.subtotal).toLocaleString("pt-MZ")} MT</p>)}</div>}
                <div className="mt-5 flex flex-wrap gap-3">
                  {nextStatus[order.status] && <button type="button" onClick={async () => { const updated = await updateOrderStatus(order.id, nextStatus[order.status]!); setOrders((items) => items.map((item) => item.id === order.id ? updated : item)); }} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Marcar como {statusLabel[nextStatus[order.status]!]}</button>}
                  {order.customer_phone && <a href={buildOrderWhatsAppUrl(order, orderItems[order.id] ?? [])} target="_blank" rel="noreferrer" className="rounded-xl border border-green-200 px-4 py-2.5 text-sm font-bold text-green-700">WhatsApp</a>}
                </div>
              </article>
            ))}</div>
          )}
        </section>
      </main>
    );
  }

  if (module === "clientes") {
    return (
      <main className="min-h-screen bg-[#F5F1E8] text-[#171512]">
        <header className="border-b border-[#E7DED0] bg-[#171512] text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
            <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B8905A]">Adson Fashion</p><h1 className="mt-1 text-2xl font-black">Gestão de clientes</h1></div>
            <button type="button" onClick={() => setModule("dashboard")} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold">Voltar ao painel</button>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {customerError && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{customerError}</div>}
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8905A]">Base de clientes</p><h2 className="mt-2 text-3xl font-black">Clientes</h2><p className="mt-2 text-sm text-[#756F67]">Contactos e dados de entrega guardados pelos clientes.</p></div><span className="rounded-full bg-[#171512] px-4 py-2 text-sm font-bold text-white">{customers.length}</span></div>
          {customerLoading ? <div className="rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] p-10 text-center text-[#756F67]">A carregar clientes...</div> : customers.length === 0 ? <div className="rounded-2xl border border-dashed border-[#D9CEBF] bg-[#FFFCF7] p-10 text-center text-[#756F67]"><p className="text-4xl">👥</p><p className="mt-3 font-bold">Ainda não há clientes registados.</p></div> : (
            <div className="overflow-hidden rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] shadow-sm">
              <div className="hidden grid-cols-4 gap-4 border-b border-[#E7DED0] bg-[#EEE8DE] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#756F67] md:grid"><span>Cliente</span><span>Telefone</span><span>Local de entrega</span><span>Registado</span></div>
              {customers.map((customer) => <article key={customer.id} className="grid gap-3 border-b border-[#E7DED0] px-5 py-5 last:border-0 md:grid-cols-4 md:items-center md:gap-4"><div><p className="font-black">{customer.name || "Sem nome"}</p><p className="text-xs text-[#756F67]">{customer.id}</p></div><p className="text-sm font-semibold">{customer.phone || "—"}</p><p className="text-sm text-[#756F67]">{customer.delivery_address || "—"}</p><p className="text-sm text-[#756F67]">{new Date(customer.created_at).toLocaleDateString("pt-MZ")}</p></article>)}
            </div>
          )}
        </section>
      </main>
    );
  }

  if (module === "produtos") {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Adson Fashion</p>
              <h1 className="mt-1 text-2xl font-black">Gestão de produtos</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                resetProductForm();
                setModule("dashboard");
              }}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold"
            >
              Voltar ao painel
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div id="product-form" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  {editingProductId ? "Editar produto" : "Novo produto"}
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  {editingProductId ? "Atualizar produto" : "Adicionar produto"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetProductForm();
                    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
                >
                  + Adicionar produto
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
            </div>

            {productError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {productError}
              </div>
            )}

            <form onSubmit={saveProduct} className="mt-7">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Nome
                  <input
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Nome do produto"
                    className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Categoria
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                  >
                    <option>Roupa</option>
                    <option>Calçado</option>
                    <option>Acessório</option>
                    <option>Outro</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Preço (MT)
                  <input
                    required
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    inputMode="decimal"
                    placeholder="Ex.: 1999"
                    className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Estoque
                  <input
                    required
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    inputMode="numeric"
                    placeholder="Quantidade disponível"
                    className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Cores disponíveis
                  <input value={productColors} onChange={(e) => setProductColors(e.target.value)} placeholder="Ex.: Preto, Branco, Azul, Vermelho" className="rounded-xl border border-slate-300 px-4 py-3 font-normal" />
                  <span className="text-xs font-normal text-slate-500">Separe as cores por vírgulas.</span>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Tamanhos disponíveis
                  <input value={productSizes} onChange={(e) => setProductSizes(e.target.value)} placeholder="Ex.: S, M, L, XL, XXL" className="rounded-xl border border-slate-300 px-4 py-3 font-normal" />
                  <span className="text-xs font-normal text-slate-500">Separe os tamanhos por vírgulas.</span>
                </label>

                <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                  Foto do produto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => setProductImage(e.target.files?.[0] ?? null)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal"
                  />
                  <span className="text-xs font-normal text-slate-500">
                    JPG, PNG, WEBP ou GIF — máximo 6 MB.
                    {productImage ? ` Selecionada: ${productImage.name}` : ""}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={productSaving}
                className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-60"
              >
                {productSaving
                  ? "A guardar..."
                  : editingProductId
                    ? "Guardar alterações"
                    : "Guardar produto"}
              </button>
            </form>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black">Produtos cadastrados</h2>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold">
                {products.length}
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {productLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 sm:col-span-2 lg:col-span-3">
                  A carregar produtos...
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 sm:col-span-2 lg:col-span-3">
                  Ainda não há produtos.
                </div>
              ) : (
                products.map((product) => (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-slate-100 text-5xl">
                        🛍️
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black">{product.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                        </div>
                        <p className="text-lg font-black">
                          {Number(product.price).toLocaleString("pt-MZ")} MT
                        </p>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Estoque</p>
                        <p className="mt-1 text-xl font-black">{product.stock} unidades</p>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            startEditing(product);
                          }}
                          className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeProduct(product.id)}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#171512]">
      <div className="min-h-screen">
        <header className="border-b border-[#E7DED0] bg-[#FFFCF7]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B8905A]">Adson Fashion</p>
              <h1 className="mt-1 text-2xl font-black">Painel ADM</h1>
              <p className="mt-1 truncate text-xs text-[#756F67]">{email}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className="hidden rounded-xl border border-[#D9CEBF] px-4 py-2.5 text-sm font-bold hover:bg-[#F5F1E8] sm:block">Ver loja</a>
              <button type="button" aria-label="Abrir menu ADM" aria-expanded={adminMenuOpen} onClick={() => setAdminMenuOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#171512] text-xl text-white">☰</button>
            </div>
          </div>
        </header>

        {adminMenuOpen && (
          <div className="fixed inset-0 z-50">
            <button type="button" aria-label="Fechar menu ADM" onClick={() => setAdminMenuOpen(false)} className="absolute inset-0 bg-black/45" />
            <aside className="absolute right-0 top-0 flex h-full w-[min(86vw,360px)] flex-col bg-[#171512] p-5 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B8905A]">Adson Fashion</p>
                  <h2 className="mt-2 text-xl font-black">Menu ADM</h2>
                  <p className="mt-1 truncate text-xs text-white/45">{email}</p>
                </div>
                <button type="button" aria-label="Fechar menu ADM" onClick={() => setAdminMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-xl">×</button>
              </div>
              <nav className="mt-6 grid gap-2">
                <button type="button" onClick={() => { setModule("dashboard"); setAdminMenuOpen(false); }} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left text-sm font-bold">📊 Dashboard</button>
                <button type="button" onClick={() => { setModule("produtos"); setAdminMenuOpen(false); }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold hover:bg-white/10">📦 Produtos</button>
                <button type="button" onClick={() => { setModule("pedidos"); setAdminMenuOpen(false); }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold hover:bg-white/10">🛒 Encomendas</button>
                <button type="button" onClick={() => { setModule("clientes"); setAdminMenuOpen(false); }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold hover:bg-white/10">👥 Clientes</button>
                <button type="button" disabled className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-white/35">📈 Estatísticas <span className="ml-auto text-[9px] uppercase">Em breve</span></button>
              </nav>
              <div className="mt-auto border-t border-white/10 pt-5">
                <button type="button" onClick={requestLogout} className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/10">🚪 Sair</button>
              </div>
            </aside>
          </div>
        )}

        <section>
          <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
            <div>
              <p className="text-sm font-semibold text-[#756F67]">Bem-vindo ao painel</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">Gestão da loja</h2>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#756F67]">Área</p>
                <p className="mt-2 text-2xl font-black">Privada</p>
                <p className="mt-1 text-sm text-[#756F67]">Acesso protegido</p>
              </div>
              <div className="rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#756F67]">Produtos</p>
                <p className="mt-2 text-2xl font-black">Gestão</p>
                <p className="mt-1 text-sm text-[#756F67]">Catálogo e estoque</p>
              </div>
              <div className="rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#756F67]">Encomendas</p>
                <p className="mt-2 text-2xl font-black">Controle</p>
                <p className="mt-1 text-sm text-[#756F67]">Acompanhe os pedidos</p>
              </div>
              <div className="rounded-2xl border border-[#E7DED0] bg-[#171512] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-[#B8905A]">Conta</p>
                <p className="mt-2 truncate text-lg font-black">{email || "Administrador"}</p>
                <p className="mt-1 text-sm text-white/60">Sessão ativa</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8905A]">Módulos</p>
              <h3 className="mt-2 text-2xl font-black">O que quer administrar?</h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {cards.map(([icon, title, description, action]) => (
                  <article key={title} className="rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] p-6 shadow-sm">
                    <div className="text-3xl">{icon}</div>
                    <h4 className="mt-5 text-xl font-bold">{title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[#756F67]">{description}</p>
                    {title === "Clientes" ? (
                      <button type="button" onClick={() => setModule("clientes")} className="mt-5 rounded-xl bg-[#171512] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">Abrir módulo</button>
                    ) : action ? (
                      <button type="button" onClick={() => setModule(action === "pedidos" ? "pedidos" : "produtos")} className="mt-5 rounded-xl bg-[#171512] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">Abrir módulo</button>
                    ) : (
                      <span className="mt-5 inline-flex rounded-xl bg-[#EEE8DE] px-4 py-2.5 text-sm font-bold text-[#756F67]">Em breve</span>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>

        </section>

        {logoutConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-5">
            <div className="w-full max-w-sm rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] p-6 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8905A]">Sair do ADM</p>
              <h2 className="mt-2 text-xl font-black text-[#171512]">Tem certeza que quer sair?</h2>
              <p className="mt-2 text-sm leading-5 text-[#756F67]">A sessão do administrador será encerrada neste dispositivo.</p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setLogoutConfirmOpen(false)} className="flex-1 rounded-xl border border-[#D9CEBF] px-4 py-3 text-sm font-bold text-[#171512]">Não</button>
                <button type="button" onClick={() => void handleLogout()} className="flex-1 rounded-xl bg-[#171512] px-4 py-3 text-sm font-bold text-white">Sim, sair</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
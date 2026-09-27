import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/produtos")({
  component: Produtos,
});

const categories = ["Todos", "Roupas", "Calçados", "Acessórios"];

const products = [
  { name: "Produto em destaque", category: "Roupas", price: "Preço a definir", icon: "👕" },
  { name: "Novo produto", category: "Calçados", price: "Preço a definir", icon: "👟" },
  { name: "Acessório", category: "Acessórios", price: "Preço a definir", icon: "👜" },
];

function Produtos() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div>
            <p className="text-2xl font-black tracking-tight text-slate-950">ADSON FASHION</p>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">Produtos</p>
          </div>
          <Link
            to="/"
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Início
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Loja online</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Produtos</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Encontre roupas, calçados e acessórios da Adson Fashion. Os produtos reais serão adicionados aqui.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-950 hover:text-white"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.name} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex h-64 items-center justify-center bg-slate-100 text-7xl">
                {product.icon}
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold text-slate-500">{product.category}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{product.name}</h2>
                <p className="mt-3 font-semibold text-slate-700">{product.price}</p>
                <button
                  type="button"
                  className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
                >
                  Ver produto
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-lg font-bold text-slate-900">Espaço reservado para os produtos da loja</p>
          <p className="mt-2 text-slate-600">
            Nesta próxima etapa podemos colocar fotos, nomes, tamanhos, cores, preços e estoque dos produtos reais.
          </p>
        </div>
      </section>
    </main>
  );
}

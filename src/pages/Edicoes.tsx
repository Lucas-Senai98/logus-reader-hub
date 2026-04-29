import { useEffect, useMemo, useState } from "react";
import { Search, Newspaper } from "lucide-react";
import { Edicao, getEdicoes } from "@/lib/storage";
import EdicaoCard from "@/components/EdicaoCard";
import { useSearchParams } from "react-router-dom";

const PER_PAGE = 12;

export default function Edicoes() {
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getEdicoes();
        if (active) {
          setEdicoes(data);
        }
      } catch (error) {
        console.error("Erro ao carregar edicoes:", error);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return edicoes;
    const q = query.toLowerCase();
    return edicoes.filter(
      (e) =>
        String(e.numero).includes(q) ||
        e.titulo.toLowerCase().includes(q) ||
        e.data.includes(q),
    );
  }, [edicoes, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div className="container py-20">
      <header className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Acervo completo
        </span>
        <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
          Todas as Edições
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Navegue por todo o historico do Diario da Tarde. Clique em uma edicao
          para abrir no leitor flipbook.
        </p>
      </header>

      <div className="mx-auto mt-10 flex max-w-md items-center">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por numero, titulo ou data..."
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {paginated.length > 0 ? (
        <>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((e) => (
              <EdicaoCard key={e.id} edicao={e} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={
                    "h-10 min-w-10 rounded-md px-3 text-sm font-medium transition-colors " +
                    (page === i + 1
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-16 grid place-items-center rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <Newspaper className="h-14 w-14 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Nenhuma edicao encontrada.</p>
        </div>
      )}
    </div>
  );
}

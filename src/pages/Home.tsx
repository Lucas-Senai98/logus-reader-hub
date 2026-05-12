import { Link } from "react-router-dom";
import { ChevronDown, BookOpen, Newspaper, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Edicao, getEdicoes, formatarData } from "@/lib/storage";
import EdicaoCard from "@/components/EdicaoCard";
import { useReveal } from "@/hooks/use-reveal";

export default function Home() {
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);

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

  const ultima = edicoes[0];
  const anteriores = edicoes.slice(1, 7);

  const refUltima = useReveal<HTMLDivElement>();
  const refGrid = useReveal<HTMLDivElement>();

  return (
    <>
      <section className="relative -mt-[72px] flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80"
            alt="Pilha de jornais impressos"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--gradient-hero)" }}
          />
        </div>

        <div className="container relative z-10 pt-32">
          <div className="max-w-3xl space-y-6 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
                Edição mais recente disponivel
            </span>
            <h1 className="font-serif text-5xl font-bold leading-[1.05] text-foreground text-balance md:text-7xl">
                O seu jornal
              <br />
                <span className="text-accent">diário</span>
            </h1>
            <div className="flex flex-wrap gap-4 pt-2">
              {ultima && (
                <Link
                  to={`/ler/${ultima.id}`}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red)] transition-transform hover:-translate-y-0.5"
                >
                  <BookOpen className="h-4 w-4" /> Ler Ultima Edição
                </Link>
              )}
              <Link
                to="/edicoes"
                className="inline-flex items-center gap-2 rounded-md border border-foreground/40 bg-background/20 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-foreground hover:bg-foreground/10"
              >
                Ver Todas as Edições <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center">
          <ChevronDown
            className="h-8 w-8 text-foreground/60 animate-bounce-soft"
            aria-hidden
          />
        </div>
      </section>

      <section className="bg-card py-24">
        <div className="container">
          <div ref={refUltima} className="reveal mx-auto max-w-3xl">
            <SectionHeader eyebrow="Em destaque" title="Ultima Edição" />

            {ultima ? (
              <article className="mt-10 overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-deep)]">
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-secondary to-card md:aspect-auto">
                    {ultima.capaBase64 ? (
                      <img
                        src={ultima.capaBase64}
                        alt={`Capa da ${ultima.titulo}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 text-muted-foreground">
                        <Newspaper className="h-20 w-20 opacity-40" />
                        <span className="font-serif text-3xl text-foreground/70">
                          N {ultima.numero}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-5 p-8 md:p-10">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                      Ultima Edição
                    </span>
                    <h3 className="font-serif text-3xl text-foreground md:text-4xl">
                      {ultima.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Publicada em{" "}
                      <span className="text-accent">{formatarData(ultima.data)}</span>
                    </p>
                    <Link
                      to={`/ler/${ultima.id}`}
                      className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red-soft)] transition-transform hover:-translate-y-0.5"
                    >
                      Abrir Leitor
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-border bg-background p-16 text-center">
                <Newspaper className="h-14 w-14 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Nenhuma edicao disponivel ainda.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <div ref={refGrid} className="reveal">
            <SectionHeader eyebrow="Arquivo" title="Edicoes anteriores" />

            {anteriores.length > 0 ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {anteriores.map((e) => (
                  <EdicaoCard key={e.id} edicao={e} />
                ))}
              </div>
            ) : (
              <p className="mt-12 text-center text-muted-foreground">
                Em breve, novas edicoes.
              </p>
            )}

            <div className="mt-12 flex justify-center">
              <Link
                to="/edicoes"
                className="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Ver Todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-serif text-4xl text-foreground md:text-5xl">
        {title}
      </h2>
      <div className="mx-auto mt-4 flex items-center justify-center gap-3">
        <span className="h-px w-12 bg-border" />
        <span className="h-2 w-2 rotate-45 bg-primary" />
        <span className="h-px w-12 bg-border" />
      </div>
    </div>
  );
}

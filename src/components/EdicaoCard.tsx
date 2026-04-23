import { Newspaper, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Edicao, formatarData } from "@/lib/storage";

export default function EdicaoCard({ edicao }: { edicao: Edicao }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-red-soft)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-secondary to-card">
        {edicao.capaBase64 ? (
          <img
            src={edicao.capaBase64}
            alt={`Capa da ${edicao.titulo}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Newspaper className="h-16 w-16 opacity-50" />
            <span className="font-serif text-2xl text-foreground/70">
              Nº {edicao.numero}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Edição nº {edicao.numero}
          </p>
          <h3 className="mt-1 font-serif text-xl text-foreground">
            {edicao.titulo}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatarData(edicao.data)}
          </p>
        </div>
        <Link
          to={`/ler/${edicao.id}`}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <BookOpen className="h-4 w-4" /> Ler
        </Link>
      </div>
    </article>
  );
}
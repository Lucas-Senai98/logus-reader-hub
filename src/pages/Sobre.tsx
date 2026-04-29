import { useReveal } from "@/hooks/use-reveal";

export default function Sobre() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div className="container py-20">
      <div ref={ref} className="reveal grid items-center gap-14 lg:grid-cols-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Quem somos
          </span>
          <h1 className="mt-3 font-serif text-5xl leading-tight text-foreground md:text-6xl">
            Notícias com{" "}
            <span className="text-accent">história</span> e propósito.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Há mais de duas décadas, o Diário da Tarde é uma referência em
            jornalismo local independente. Nosso compromisso é com a verdade,
            o pluralismo e a comunidade — com pautas próximas e uma cobertura
            cuidadosa dos assuntos que moldam o cotidiano da nossa cidade.
          </p>
          <p className="mt-4 text-muted-foreground">
            Acreditamos que jornalismo de qualidade fortalece a democracia e
            aproxima pessoas. Por isso seguimos publicando, semana após semana,
            edições que combinam tradição impressa e a praticidade do digital.
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-deep)]">
            <img
              src="https://images.unsplash.com/photo-1542435503-956c469947f6?w=1200&q=80"
              alt="Redação do jornal"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
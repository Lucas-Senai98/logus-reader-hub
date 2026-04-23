import { useReveal } from "@/hooks/use-reveal";

const stats = [
  { value: "20+", label: "Anos de história" },
  { value: "500+", label: "Edições publicadas" },
  { value: "10k", label: "Leitores ativos" },
  { value: "2", label: "Publicações" },
];

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
            Há mais de duas décadas, o Logus Notícias é uma referência em
            jornalismo local independente. Nosso compromisso é com a verdade,
            o pluralismo e a comunidade — com pautas próximas e uma cobertura
            cuidadosa dos assuntos que moldam o cotidiano da nossa cidade.
          </p>
          <p className="mt-4 text-muted-foreground">
            Acreditamos que jornalismo de qualidade fortalece a democracia e
            aproxima pessoas. Por isso seguimos publicando, semana após semana,
            edições que combinam tradição impressa e a praticidade do digital.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-5 text-center transition-colors hover:border-primary/50"
              >
                <div className="font-serif text-4xl font-bold text-accent">
                  {s.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-deep)]">
            <img
              src="https://images.unsplash.com/photo-1542435503-956c469947f6?w=1200&q=80"
              alt="Redação do jornal"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 rounded-xl bg-primary px-6 py-4 text-primary-foreground shadow-[var(--shadow-red)]">
            <div className="text-xs uppercase tracking-widest opacity-80">
              Desde
            </div>
            <div className="font-serif text-3xl font-bold">2005</div>
          </div>
        </div>
      </div>
    </div>
  );
}
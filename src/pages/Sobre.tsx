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
            O Diário da Tarde é o jornal vespertino de Grande Circulação nos
            estados do Rio de Janeiro e de Minas Gerais da empresa Logus
            Ambiental Ltda. Este novo veículo é um passo adiante em nossa
            trajetória e compromisso que vem desde 2006 com periódicos locais
            que chegam a quase duas mil edições.
          </p>
          <p className="mt-4 text-muted-foreground">
            Nossa missão é informar, publicar e mantê-lo informado com
            seriedade e compromisso!
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

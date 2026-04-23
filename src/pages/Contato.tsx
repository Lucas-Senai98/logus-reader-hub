import { useState } from "react";
import {
  User,
  Mail,
  MessageSquare,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  Facebook,
  Instagram,
  MessageCircle,
} from "lucide-react";

export default function Contato() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setSuccess(false), 4000);
    }, 1500);
  }

  return (
    <div className="container py-20">
      <header className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Fale conosco
        </span>
        <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
          Vamos conversar
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Envie sugestões de pauta, denúncias ou apenas um olá. Respondemos
          todas as mensagens.
        </p>
      </header>

      <div className="mt-14 grid gap-8 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-8 lg:col-span-3"
        >
          <div className="grid gap-5">
            <Field icon={User} label="Nome completo" name="nome" required />
            <Field
              icon={Mail}
              label="E-mail"
              name="email"
              type="email"
              required
            />
            <Field
              icon={MessageSquare}
              label="Assunto"
              name="assunto"
              required
            />
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Mensagem
              </label>
              <textarea
                name="mensagem"
                rows={5}
                required
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Escreva sua mensagem…"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red-soft)] transition-transform hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Mensagem enviada!
                </>
              ) : (
                "Enviar Mensagem"
              )}
            </button>

            {success && (
              <p className="text-sm text-accent">
                Obrigado! Sua mensagem foi recebida — retornaremos em breve.
              </p>
            )}
          </div>
        </form>

        <aside className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-7">
            <h3 className="font-serif text-2xl text-foreground">
              Informações
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
              <Info icon={MapPin}>
                Rua Principal, 123 — Centro
                <br />
                Sua Cidade / UF
              </Info>
              <Info icon={Phone}>(00) 0000-0000</Info>
              <Info icon={Mail}>contato@diario-da-tardenoticias.com.br</Info>
              <Info icon={Clock}>
                Seg. à Sex. — 09h às 18h
                <br />
                Sáb. — 09h às 13h
              </Info>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7">
            <h3 className="font-serif text-2xl text-foreground">Redes</h3>
            <div className="mt-4 flex gap-3">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: MessageCircle, label: "WhatsApp" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          {...props}
          className="h-12 w-full rounded-md border border-border bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary/15 text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <div className="pt-1.5 leading-relaxed">{children}</div>
    </li>
  );
}
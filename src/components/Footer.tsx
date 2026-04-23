import { Facebook, Instagram, MessageCircle } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Jornal local independente. Transparência e imparcialidade para
            levar as notícias que importam até você.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-serif text-lg text-foreground">Navegação</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#/" className="hover:text-accent">Home</a></li>
            <li><a href="#/edicoes" className="hover:text-accent">Edições</a></li>
            <li><a href="#/sobre" className="hover:text-accent">Sobre Nós</a></li>
            <li><a href="#/contato" className="hover:text-accent">Fale Conosco</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-serif text-lg text-foreground">Acompanhe</h4>
          <div className="flex gap-3">
            {[
              { Icon: Facebook, label: "Facebook" },
              { Icon: Instagram, label: "Instagram" },
              { Icon: MessageCircle, label: "WhatsApp" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Diário da Tarde. Todos os direitos reservados.
      </div>
    </footer>
  );
}
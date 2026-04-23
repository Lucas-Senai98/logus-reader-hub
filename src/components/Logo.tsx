import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div
        className="grid h-11 w-11 place-items-center rounded-md bg-primary font-serif text-2xl font-bold text-primary-foreground shadow-[var(--shadow-red-soft)] transition-transform group-hover:scale-105"
        aria-hidden="true"
      >
        L
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-lg font-bold tracking-tight text-foreground">
          Diário da Tarde
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          O jornal do seu dia
        </span>
      </div>
    </Link>
  );
}
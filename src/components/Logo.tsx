import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="group">
      <div className="rounded-md bg-white px-2 py-1 shadow-[var(--shadow-red-soft)] transition-transform group-hover:scale-[1.02]">
        <img
          src="/Logo.png"
          alt="Diário da Tarde"
          className="h-10 w-auto object-contain"
        />
      </div>
    </Link>
  );
}
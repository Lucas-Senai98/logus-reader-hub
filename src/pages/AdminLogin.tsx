import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { ADMIN_PASS, ADMIN_USER, loginAdmin } from "@/lib/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        loginAdmin();
        navigate("/admin", { replace: true });
      } else {
        setError("Usuário ou senha incorretos");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden grid place-items-center px-4 py-10">
      {/* decorativo */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl shadow-[var(--shadow-deep)]">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="mt-7 text-center">
            <h1 className="font-serif text-3xl text-foreground">
              Acesso Administrativo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Diário da Tarde</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Usuário
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  autoComplete="username"
                  className="h-11 w-full rounded-md border border-border bg-background/60 pl-10 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 w-full rounded-md border border-border bg-background/60 pl-10 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-accent"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                key={error + Date.now()}
                role="alert"
                className="animate-in fade-in slide-in-from-top-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red-soft)] transition-opacity hover:opacity-95 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Lock, LogOut, Plus, Trash2, BookOpen, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Edicao,
  addEdicao,
  formatarData,
  getEdicoes,
  removeEdicao,
  savePdf,
} from "@/lib/storage";
import { toast } from "sonner";

const SESSION_KEY = "logus_admin_session";
const USERNAME = "admin";
const PASSWORD = "logus2025";

export default function Admin() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
  }, []);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return <Dashboard onLogout={() => setAuthed(false)} />;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (user === USERNAME && pass === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onSuccess();
    } else {
      setError("Usuário ou senha inválidos.");
    }
  }

  return (
    <div className="container grid min-h-[70vh] place-items-center py-20">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-deep)]"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-foreground">
              Painel Admin
            </h1>
            <p className="text-xs text-muted-foreground">
              Acesso restrito à redação
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Usuário
            </label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Senha
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-primary">{error}</p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red-soft)]"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [titulo, setTitulo] = useState("");
  const [numero, setNumero] = useState<number | "">("");
  const [data, setData] = useState("");
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [capaDataUrl, setCapaDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    setEdicoes(getEdicoes());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    onLogout();
  }

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF.");
      return;
    }
    const url = await readFile(f);
    setPdfDataUrl(url);
  }

  async function onCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await readFile(f);
    setCapaDataUrl(url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !numero || !data || !pdfDataUrl) {
      toast.error("Preencha todos os campos obrigatórios e selecione o PDF.");
      return;
    }
    setSaving(true);
    try {
      const novo = addEdicao({
        titulo,
        numero: Number(numero),
        data,
        capaBase64: capaDataUrl ?? undefined,
        pdfKey: "", // placeholder
      });
      // grava PDF separadamente para evitar inflar o array
      savePdf(novo.id, pdfDataUrl);
      // atualiza pdfKey
      const list = getEdicoes().map((x) =>
        x.id === novo.id ? { ...x, pdfKey: `logus_pdf_${novo.id}` } : x
      );
      localStorage.setItem("logus_edicoes", JSON.stringify(list));
      toast.success("Edição publicada com sucesso!");
      setTitulo("");
      setNumero("");
      setData("");
      setPdfDataUrl(null);
      setCapaDataUrl(null);
      (document.getElementById("pdf-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("pdf-input") as HTMLInputElement).value = "");
      (document.getElementById("capa-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("capa-input") as HTMLInputElement).value = "");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        "Não foi possível salvar. O PDF pode ter excedido o limite do localStorage."
      );
    } finally {
      setSaving(false);
    }
  }

  function onDelete(id: string) {
    if (!confirm("Excluir esta edição? Esta ação não pode ser desfeita.")) return;
    removeEdicao(id);
    refresh();
    toast.success("Edição removida.");
  }

  return (
    <div className="container py-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-foreground">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as edições publicadas no portal.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Edições cadastradas" value={edicoes.length} />
        <Stat
          label="Edições com PDF"
          value={edicoes.filter((e) => !e.demo).length}
        />
        <Stat
          label="Demonstração"
          value={edicoes.filter((e) => e.demo).length}
        />
      </div>

      <section className="mt-10 grid gap-8 lg:grid-cols-5">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-2"
        >
          <h2 className="flex items-center gap-2 font-serif text-2xl text-foreground">
            <Plus className="h-5 w-5 text-accent" /> Nova edição
          </h2>

          <div className="mt-5 space-y-4">
            <Input label="Título" value={titulo} onChange={setTitulo} placeholder="Edição nº 246" />
            <Input
              label="Número"
              type="number"
              value={numero === "" ? "" : String(numero)}
              onChange={(v) => setNumero(v === "" ? "" : Number(v))}
              placeholder="246"
            />
            <Input
              label="Data de publicação"
              type="date"
              value={data}
              onChange={setData}
            />

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                PDF da edição *
              </label>
              <input
                id="pdf-input"
                type="file"
                accept="application/pdf"
                onChange={onPdf}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
              />
              {pdfDataUrl && (
                <p className="mt-1 text-xs text-accent">PDF carregado ✓</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Imagem de capa (opcional)
              </label>
              <input
                id="capa-input"
                type="file"
                accept="image/*"
                onChange={onCapa}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground"
              />
              {capaDataUrl && (
                <img
                  src={capaDataUrl}
                  alt="Pré-visualização"
                  className="mt-2 h-24 w-auto rounded-md border border-border object-cover"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red-soft)] disabled:opacity-70"
            >
              {saving ? "Publicando…" : "Publicar Edição"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-3">
          <h2 className="font-serif text-2xl text-foreground">
            Edições cadastradas
          </h2>

          {edicoes.length === 0 ? (
            <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
              <Newspaper className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhuma edição ainda. Cadastre a primeira ao lado.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-3 text-left">Nº</th>
                    <th className="py-3 text-left">Título</th>
                    <th className="py-3 text-left">Data</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {edicoes.map((e) => (
                    <tr key={e.id} className="border-b border-border/60">
                      <td className="py-3 font-medium text-foreground">
                        {e.numero}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {e.titulo}
                        {e.demo && (
                          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                            Demo
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatarData(e.data)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/ler/${e.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:text-accent"
                          >
                            <BookOpen className="h-3 w-3" /> Ler
                          </Link>
                          <button
                            onClick={() => onDelete(e.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            <Trash2 className="h-3 w-3" /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-serif text-3xl text-accent">{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
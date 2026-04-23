import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Newspaper,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edicao,
  addEdicao,
  formatarData,
  getEdicoes,
  removeEdicao,
  savePdf,
} from "@/lib/storage";
import { logoutAdmin } from "@/lib/auth";
import Logo from "@/components/Logo";
import { toast } from "sonner";

const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getPdfSizeBytes(id: string): number {
  const raw = localStorage.getItem(`diario_pdf_${id}`);
  if (!raw) return 0;
  // rough size: base64 length * 0.75
  const commaIdx = raw.indexOf(",");
  const b64 = commaIdx >= 0 ? raw.slice(commaIdx + 1) : raw;
  return Math.floor(b64.length * 0.75);
}

export default function Admin() {
  const navigate = useNavigate();
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [now, setNow] = useState(new Date());

  // formulário
  const [titulo, setTitulo] = useState("");
  const [numero, setNumero] = useState<number | "">("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [pdfFileSize, setPdfFileSize] = useState<number>(0);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [pdfReading, setPdfReading] = useState(false);
  const [capaDataUrl, setCapaDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const capaInputRef = useRef<HTMLInputElement>(null);

  // confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<Edicao | null>(null);

  function refresh() {
    setEdicoes(getEdicoes());
  }

  useEffect(() => {
    refresh();
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const sorted = useMemo(
    () => [...edicoes].sort((a, b) => (b.data > a.data ? 1 : -1)),
    [edicoes]
  );
  const ultima = sorted[0];

  function handleLogout() {
    logoutAdmin();
    navigate("/");
  }

  function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF.");
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      toast.error("Arquivo excede o limite de 50MB.");
      e.target.value = "";
      return;
    }
    setPdfFileName(f.name);
    setPdfFileSize(f.size);
    setPdfProgress(0);
    setPdfReading(true);
    setPdfDataUrl(null);

    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setPdfProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    reader.onload = () => {
      setPdfDataUrl(reader.result as string);
      setPdfProgress(100);
      setPdfReading(false);
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo.");
      setPdfReading(false);
    };
    reader.readAsDataURL(f);
  }

  function onCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCapaDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  }

  function resetForm() {
    setTitulo("");
    setNumero("");
    setData(new Date().toISOString().slice(0, 10));
    setPdfDataUrl(null);
    setPdfFileName("");
    setPdfFileSize(0);
    setPdfProgress(0);
    setCapaDataUrl(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (capaInputRef.current) capaInputRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || numero === "" || !data || !pdfDataUrl) {
      toast.error("Preencha todos os campos e anexe o PDF.");
      return;
    }
    setSaving(true);
    try {
      const novo = addEdicao({
        titulo,
        numero: Number(numero),
        data,
        capaBase64: capaDataUrl ?? undefined,
        pdfKey: "",
      });
      savePdf(novo.id, pdfDataUrl);
      const list = getEdicoes().map((x) =>
        x.id === novo.id ? { ...x, pdfKey: `diario_pdf_${novo.id}` } : x
      );
      localStorage.setItem("diario_edicoes", JSON.stringify(list));
      toast.success("Edição publicada com sucesso!");
      resetForm();
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

  function confirmDelete() {
    if (!deleteTarget) return;
    removeEdicao(deleteTarget.id);
    toast.success(`Edição nº ${deleteTarget.numero} excluída.`);
    setDeleteTarget(null);
    refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header do painel */}
      <header className="sticky top-0 z-40 border-b-2 border-primary bg-[#1a1a2e]/95 backdrop-blur">
        <div className="container flex h-[72px] items-center justify-between gap-4">
          <Logo />
          <div className="hidden text-center md:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Painel
            </p>
            <p className="font-serif text-base text-foreground">
              Administrativo
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <main className="container py-10">
        {/* Cards de resumo */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Edições publicadas"
            value={String(edicoes.length)}
            icon={<Newspaper className="h-5 w-5" />}
          />
          <SummaryCard
            label="Última edição"
            value={
              ultima
                ? `Nº ${ultima.numero}`
                : "—"
            }
            sub={ultima ? formatarData(ultima.data) : "Nenhuma"}
            icon={<FileText className="h-5 w-5" />}
          />
          <SummaryCard
            label="Data e hora"
            value={now.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            sub={now.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            icon={<Calendar className="h-5 w-5" />}
          />
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-5">
          {/* Formulário */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border bg-card p-6 lg:col-span-2"
          >
            <h2 className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <Plus className="h-5 w-5 text-accent" /> Publicar Nova Edição
            </h2>

            <div className="mt-5 space-y-4">
              <Field label="Título da edição">
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Edição nº 246"
                  className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Número">
                  <input
                    type="number"
                    value={numero === "" ? "" : numero}
                    onChange={(e) =>
                      setNumero(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="246"
                    className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                  />
                </Field>
                <Field label="Data de publicação">
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                  />
                </Field>
              </div>

              {/* Upload PDF */}
              <Field label="PDF da edição *">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {pdfFileName || "Selecionar arquivo .pdf"}
                  </span>
                  {pdfFileSize > 0 && (
                    <span className="text-xs">{formatBytes(pdfFileSize)}</span>
                  )}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={onPdf}
                    className="hidden"
                  />
                </label>
                {(pdfReading || pdfProgress > 0) && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${pdfProgress}%` }}
                    />
                  </div>
                )}
                {pdfDataUrl && !pdfReading && (
                  <p className="mt-1 text-xs text-accent">Arquivo carregado ✓</p>
                )}
              </Field>

              {/* Upload Capa */}
              <Field label="Imagem de capa (opcional)">
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  <ImageIcon className="h-4 w-4" />
                  <span>Selecionar imagem</span>
                  <input
                    ref={capaInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onCapa}
                    className="hidden"
                  />
                </label>
                {capaDataUrl && (
                  <img
                    src={capaDataUrl}
                    alt="Pré-visualização"
                    className="mt-2 h-24 w-auto rounded-md border border-border object-cover"
                  />
                )}
              </Field>

              <button
                type="submit"
                disabled={saving || pdfReading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-red-soft)] transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publicando…
                  </>
                ) : (
                  "Publicar Edição"
                )}
              </button>
            </div>
          </form>

          {/* Lista de edições */}
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-3">
            <h2 className="font-serif text-2xl text-foreground">
              Edições cadastradas
            </h2>

            {sorted.length === 0 ? (
              <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
                <Newspaper className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhuma edição cadastrada.
                </p>
              </div>
            ) : (
              <>
                {/* Tabela desktop */}
                <div className="mt-5 hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="py-3 text-left">Nº</th>
                        <th className="py-3 text-left">Título</th>
                        <th className="py-3 text-left">Data</th>
                        <th className="py-3 text-left">PDF</th>
                        <th className="py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((e) => {
                        const size = getPdfSizeBytes(e.id);
                        return (
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
                            <td className="py-3 text-muted-foreground">
                              {size > 0 ? formatBytes(size) : "—"}
                            </td>
                            <td className="py-3">
                              <div className="flex justify-end gap-2">
                                <a
                                  href={`#/ler/${e.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:text-accent"
                                >
                                  <Eye className="h-3 w-3" /> Visualizar
                                </a>
                                <button
                                  onClick={() => setDeleteTarget(e)}
                                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                                >
                                  <Trash2 className="h-3 w-3" /> Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards mobile */}
                <div className="mt-5 space-y-3 md:hidden">
                  {sorted.map((e) => {
                    const size = getPdfSizeBytes(e.id);
                    return (
                      <div
                        key={e.id}
                        className="rounded-xl border border-border bg-background/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-accent">
                              Nº {e.numero}
                            </p>
                            <p className="mt-1 font-serif text-lg text-foreground">
                              {e.titulo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatarData(e.data)} · {size > 0 ? formatBytes(size) : "sem PDF"}
                            </p>
                          </div>
                          {e.demo && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <a
                            href={`#/ler/${e.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:border-accent hover:text-accent"
                          >
                            <Eye className="h-3 w-3" /> Visualizar
                          </a>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            <Trash2 className="h-3 w-3" /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Excluir edição
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a Edição nº {deleteTarget?.numero}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="text-accent">{icon}</span>
      </div>
      <div className="mt-3 font-serif text-3xl text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
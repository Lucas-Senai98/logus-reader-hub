import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { PageFlip } from "page-flip";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";
import { getEdicaoById, getPdf, formatarData } from "@/lib/storage";

// Aponta para o worker estático em /public — funciona com base "./" no cPanel
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function Leitor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const flipRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ cur: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    const edicao = getEdicaoById(id);
    if (!edicao) {
      setError("Edição não encontrada.");
      setLoading(false);
      return;
    }

    const pdfData = getPdf(id);
    if (!pdfData) {
      setError(
        edicao.demo
          ? "PDF de demonstração não disponível. Acesse o Admin para publicar edições reais."
          : "PDF não encontrado para esta edição."
      );
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // base64 → Uint8Array
        const base64 = pdfData.split(",")[1];
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setProgress({ cur: 0, total: pdf.numPages });

        // Render every page to a canvas and convert to image data URL
        const pageImages: string[] = [];
        const targetWidth = 900; // resolução

        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / viewport.width;
          const scaled = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = scaled.width;
          canvas.height = scaled.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport: scaled }).promise;
          pageImages.push(canvas.toDataURL("image/jpeg", 0.85));
          if (cancelled) return;
          setProgress({ cur: p, total: pdf.numPages });
        }

        if (cancelled) return;

        // Build flipbook
        await initFlipbook(pageImages);
        setTotalPages(pageImages.length);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar PDF", err);
        setError("Falha ao processar o PDF.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      try {
        pageFlipRef.current?.destroy();
      } catch {}
      pageFlipRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function initFlipbook(images: string[]) {
    if (!flipRef.current || !containerRef.current) return;

    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const isMobile = window.innerWidth < 768;

    // calcula dimensões mantendo proporção A4 (1 / 1.4142)
    const ratio = 1 / 1.4142;
    const usableH = containerH - 40;
    const usableW = containerW - 40;

    let pageH = usableH;
    let pageW = pageH * ratio;

    const spreadW = isMobile ? pageW : pageW * 2;
    if (spreadW > usableW) {
      const scale = usableW / spreadW;
      pageW *= scale;
      pageH *= scale;
    }

    flipRef.current.innerHTML = "";
    images.forEach((src) => {
      const div = document.createElement("div");
      div.className = "page";
      div.style.background = `#fff url(${src}) center/contain no-repeat`;
      flipRef.current!.appendChild(div);
    });

    const pf = new PageFlip(flipRef.current, {
      width: Math.floor(pageW),
      height: Math.floor(pageH),
      size: "fixed" as never,
      maxShadowOpacity: 0.5,
      showCover: true,
      mobileScrollSupport: true,
      usePortrait: isMobile,
      drawShadow: true,
      flippingTime: 700,
    });

    pf.loadFromHTML(flipRef.current.querySelectorAll(".page"));

    pf.on("flip", (e) => {
      setCurrentPage((e.data as number) + 1);
    });

    pageFlipRef.current = pf;
    setCurrentPage(1);
  }

  // Teclado ← →
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") pageFlipRef.current?.flipNext();
      if (e.key === "ArrowLeft") pageFlipRef.current?.flipPrev();
      if (e.key === "Escape" && document.fullscreenElement)
        document.exitFullscreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fullscreen tracking
  useEffect(() => {
    function onFs() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen();
    }
  }

  function downloadPdf() {
    if (!id) return;
    const pdf = getPdf(id);
    if (!pdf) return;
    const a = document.createElement("a");
    a.href = pdf;
    a.download = `${getEdicaoById(id)?.titulo ?? "edicao"}.pdf`;
    a.click();
  }

  function changeZoom(delta: number) {
    setZoom((z) => {
      const next = Math.max(0.6, Math.min(2, z + delta));
      if (flipRef.current) {
        flipRef.current.style.transform = `scale(${next})`;
      }
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0f] text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Diário da Tarde
          </p>
          {id && (
            <p className="font-serif text-base text-foreground">
              {getEdicaoById(id)?.titulo}
              <span className="ml-2 text-xs text-muted-foreground">
                · {formatarData(getEdicaoById(id)?.data ?? "")}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/")}
          aria-label="Voltar para o site"
          className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground hover:text-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Reader */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden"
      >
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#0a0a0f]/95">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="font-serif text-xl text-foreground">
                Preparando sua leitura…
              </p>
              {progress.total > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Carregando página {progress.cur} de {progress.total}
                  </p>
                  <div className="h-1.5 w-64 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(progress.cur / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="grid place-items-center px-6 text-center">
            <p className="max-w-md font-serif text-2xl text-foreground">
              {error}
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Voltar ao site
            </button>
          </div>
        )}

        <div
          ref={flipRef}
          className="paper-tex transition-transform duration-300"
          style={{
            transformOrigin: "center center",
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
          }}
        />
      </div>

      {/* Bottom controls */}
      {!error && (
        <div className="flex items-center justify-center gap-1 border-t border-border/40 bg-[#0a0a0f]/95 px-4 py-3">
          <ToolbarBtn
            onClick={() => pageFlipRef.current?.flipPrev()}
            label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </ToolbarBtn>

          <div className="px-4 text-sm tabular-nums text-muted-foreground">
            Pág. <span className="text-foreground">{currentPage || "—"}</span>{" "}
            / {totalPages || "—"}
          </div>

          <ToolbarBtn
            onClick={() => pageFlipRef.current?.flipNext()}
            label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </ToolbarBtn>

          <span className="mx-2 h-6 w-px bg-border" />

          <ToolbarBtn onClick={() => changeZoom(-0.1)} label="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </ToolbarBtn>
          <div className="w-12 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </div>
          <ToolbarBtn onClick={() => changeZoom(0.1)} label="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </ToolbarBtn>

          <span className="mx-2 h-6 w-px bg-border" />

          <ToolbarBtn onClick={toggleFullscreen} label="Tela cheia">
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </ToolbarBtn>
          <ToolbarBtn onClick={downloadPdf} label="Baixar PDF">
            <Download className="h-4 w-4" />
          </ToolbarBtn>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-accent"
    >
      {children}
    </button>
  );
}
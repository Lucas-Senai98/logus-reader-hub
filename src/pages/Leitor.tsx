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

// Configurar o worker via CDN para evitar problemas de carregamento
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function Leitor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const flipRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Carregando PDF...");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<string[]>([]); // Agora armazenando URLs das imagens
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Função para converter base64 para Uint8Array
  const base64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Função para carregar o PDF
  const loadPDF = async (base64String: string) => {
    // Remover o prefixo data:application/pdf;base64,
    const base64Data = base64String.split(',')[1];
    
    // Converter base64 para Uint8Array
    const bytes = base64ToUint8Array(base64Data);
    
    // Carregar com PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    return pdf;
  };

  // Função para renderizar uma página específica
  const renderPage = async (pdf: any, pageNumber: number): Promise<string> => {
    const page = await pdf.getPage(pageNumber);
    
    // Escala para boa qualidade visual
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context!,
      viewport: viewport,
    }).promise;
    
    // Retornar a URL da imagem em vez do canvas
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  useEffect(() => {
    const initReader = async () => {
      setLoading(true);
      setLoadingMessage("Carregando PDF...");
      
      try {
        // 1. Buscar PDF do localStorage
        const edicao = getEdicaoById(id!);
        const pdfBase64 = getPdf(id!);
        
        if (!pdfBase64) {
          setError('PDF não encontrado.');
          setLoading(false);
          return;
        }
        
        // 2. Carregar PDF
        setLoadingMessage("Processando PDF...");
        const pdf = await loadPDF(pdfBase64);
        const totalPages = pdf.numPages;
        setTotalPages(totalPages);
        
        // 3. Renderizar TODAS as páginas antes de inicializar o flipbook
        const pageImages: string[] = [];
        for (let i = 1; i <= totalPages; i++) {
          setLoadingMessage(`Carregando página ${i} de ${totalPages}...`);
          const imageUrl = await renderPage(pdf, i);
          pageImages.push(imageUrl);
        }
        
        setPages(pageImages); // salvar no estado
        setLoading(false);
        
      } catch (err) {
        console.error('Erro ao carregar PDF:', err);
        setError('Erro ao carregar o PDF. Tente novamente.');
        setLoading(false);
      }
    };
    
    if (id) {
      initReader();
    }
  }, [id]);

  // Inicializar o PageFlip após ter todas as páginas renderizadas
  useEffect(() => {
    if (pages.length === 0 || !flipRef.current) return;
    
    // Limpar instância anterior se existir
    if (pageFlipRef.current) {
      try {
        pageFlipRef.current.destroy();
      } catch {}
    }
    
    // Aguardar um pouco para garantir que o DOM esteja pronto
    setTimeout(() => {
      const containerW = containerRef.current?.clientWidth || 0;
      const containerH = containerRef.current?.clientHeight || 0;
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

      // Limpar o container antes de adicionar novas páginas
      flipRef.current!.innerHTML = "";
      
      // Adiciona cada imagem como elemento de página
      pages.forEach((imgSrc, idx) => {
        const div = document.createElement("div");
        div.className = "page";
        div.innerHTML = `<img src="${imgSrc}" alt="Página ${idx+1}" style="width: 100%; height: 100%; object-fit: contain;" />`;
        flipRef.current!.appendChild(div);
      });

      const pf = new PageFlip(flipRef.current!, {
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

      // Carrega as páginas como elementos HTML
      pf.loadFromHTML(flipRef.current!.querySelectorAll(".page"));

      pf.on("flip", (e) => {
        setCurrentPage((e.data as number) + 1);
      });

      pageFlipRef.current = pf;
      setCurrentPage(1);
    }, 100); // Pequeno delay para garantir que o DOM esteja pronto
  }, [pages]);

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
        className="relative flex flex-1 items-center justify-center overflow-hidden min-h-[70vh]"
      >
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#0a0a0f]/95">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="font-serif text-xl text-foreground">
                Preparando sua leitura…
              </p>
              <p className="text-sm text-muted-foreground">
                {loadingMessage}
              </p>
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
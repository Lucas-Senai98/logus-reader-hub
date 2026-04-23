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

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function Leitor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const flipRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const pageFlipInitTimeoutRef = useRef<number | null>(null);
  const pageFlipSessionRef = useRef(0);
  const currentPageRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Carregando PDF...");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<string[]>([]);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPageFlipReady, setIsPageFlipReady] = useState(false);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const base64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  const toggleZoomMode = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setLastPosition({ x: 0, y: 0 });
      return;
    }

    setScale(1.5);
  };

  const loadPDF = async (base64String: string) => {
    const base64Data = base64String.split(",")[1];
    const bytes = base64ToUint8Array(base64Data);
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    return loadingTask.promise;
  };

  const renderPage = async (pdf: any, pageNumber: number): Promise<string> => {
    const page = await pdf.getPage(pageNumber);
    const renderScale = 1.5;
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context!,
      viewport,
    }).promise;

    return canvas.toDataURL("image/jpeg", 0.85);
  };

  useEffect(() => {
    const initReader = async () => {
      setLoading(true);
      setLoadingMessage("Carregando PDF...");
      setError(null);

      try {
        const pdfBase64 = getPdf(id!);

        if (!pdfBase64) {
          setError("PDF não encontrado.");
          setLoading(false);
          return;
        }

        setLoadingMessage("Processando PDF...");
        const pdf = await loadPDF(pdfBase64);
        const pageCount = pdf.numPages;
        const pageImages: string[] = [];

        setTotalPages(pageCount);

        for (let i = 1; i <= pageCount; i++) {
          setLoadingMessage(`Carregando página ${i} de ${pageCount}...`);
          const imageUrl = await renderPage(pdf, i);
          pageImages.push(imageUrl);
        }

        setPages(pageImages);
        setCurrentPage(pageCount > 0 ? 1 : 0);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar PDF:", err);
        setError("Erro ao carregar o PDF. Tente novamente.");
        setLoading(false);
      }
    };

    if (id) {
      initReader();
    }
  }, [id]);

  const destroyPageFlip = () => {
    pageFlipSessionRef.current += 1;

    if (pageFlipInitTimeoutRef.current !== null) {
      window.clearTimeout(pageFlipInitTimeoutRef.current);
      pageFlipInitTimeoutRef.current = null;
    }

    setIsPageFlipReady(false);

    const instance = pageFlipRef.current;
    pageFlipRef.current = null;

    if (instance) {
      try {
        instance.destroy();
      } catch {
        // Ignora falhas do teardown da biblioteca.
      }
    }

    if (flipRef.current) {
      flipRef.current.innerHTML = "";
    }
  };

  const updatePageFlip = () => {
    destroyPageFlip();

    if (pages.length === 0 || scale > 1 || !flipRef.current || !containerRef.current) {
      return;
    }

    const session = pageFlipSessionRef.current;

    pageFlipInitTimeoutRef.current = window.setTimeout(() => {
      if (
        session !== pageFlipSessionRef.current ||
        scale > 1 ||
        !flipRef.current ||
        !containerRef.current
      ) {
        return;
      }

      const containerW = containerRef.current.clientWidth || 0;
      const containerH = containerRef.current.clientHeight || 0;
      const isMobile = window.innerWidth < 768;

      const ratio = 1 / 1.4142;
      const usableH = containerH - 40;
      const usableW = containerW - 40;

      let pageH = usableH;
      let pageW = pageH * ratio;

      const spreadW = isMobile ? pageW : pageW * 2;
      if (spreadW > usableW) {
        const scaleValue = usableW / spreadW;
        pageW *= scaleValue;
        pageH *= scaleValue;
      }

      flipRef.current.innerHTML = "";

      pages.forEach((imgSrc, idx) => {
        const div = document.createElement("div");
        div.className = "page";
        div.innerHTML = `<img src="${imgSrc}" alt="Página ${idx + 1}" style="width: 100%; height: 100%; object-fit: contain;" />`;
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
        startPage: Math.max(0, currentPageRef.current - 1),
      });

      pf.on("init", () => {
        if (session !== pageFlipSessionRef.current) return;
        setIsPageFlipReady(true);
        setCurrentPage(pf.getCurrentPageIndex() + 1);
      });

      pf.on("flip", (e) => {
        if (session !== pageFlipSessionRef.current) return;
        setCurrentPage((e.data as number) + 1);
      });

      pf.loadFromHTML(Array.from(flipRef.current.children) as HTMLElement[]);

      if (session !== pageFlipSessionRef.current) {
        try {
          pf.destroy();
        } catch {
          // Ignora se a troca de sessão ocorrer durante a inicialização.
        }
        return;
      }

      pageFlipRef.current = pf;
    }, 100);
  };

  useEffect(() => {
    updatePageFlip();
  }, [pages, scale]);

  useEffect(() => {
    return () => {
      destroyPageFlip();
    };
  }, []);

  const handlePageFlipNavigation = (direction: "next" | "prev") => {
    if (scale > 1 || !isPageFlipReady) return false;

    const instance = pageFlipRef.current;
    if (!instance) return false;

    try {
      if (!instance.getFlipController()) {
        return false;
      }

      if (direction === "next") {
        instance.flipNext();
      } else {
        instance.flipPrev();
      }

      return true;
    } catch (error) {
      console.warn(`Erro ao navegar com PageFlip (${direction}):`, error);
      return false;
    }
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        handlePageFlipNavigation("next");
      }

      if (e.key === "ArrowLeft") {
        handlePageFlipNavigation("prev");
      }

      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPageFlipReady, scale]);

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

  const clampPosition = (pos: { x: number; y: number }, currentScale: number) => {
    if (currentScale <= 1) return { x: 0, y: 0 };

    const container = containerRef.current;
    if (!container) return pos;

    const maxX = (container.clientWidth * (currentScale - 1)) / 2 + 100;
    const maxY = (container.clientHeight * (currentScale - 1)) / 2 + 100;

    return {
      x: Math.min(maxX, Math.max(-maxX, pos.x)),
      y: Math.min(maxY, Math.max(-maxY, pos.y)),
    };
  };

  const getPinchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;

    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - lastPosition.x,
      y: e.clientY - lastPosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;

    e.preventDefault();

    const newPos = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };

    setPosition(clampPosition(newPos, scale));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setLastPosition(position);
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (!isDragging) return;

    setLastPosition(position);
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - lastPosition.x,
        y: e.touches[0].clientY - lastPosition.y,
      });
      return;
    }

    if (e.touches.length === 2) {
      setIsDragging(false);
      setLastPinchDistance(getPinchDistance(e.touches));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.touches.length === 1 && isDragging && scale > 1) {
      const newPos = {
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      };

      setPosition(clampPosition(newPos, scale));
      return;
    }

    if (e.touches.length === 2 && lastPinchDistance !== null) {
      const currentDistance = getPinchDistance(e.touches);
      const delta = currentDistance / lastPinchDistance;
      const newScale = Math.min(4, Math.max(1, scale * delta));

      setScale(newScale);
      setLastPinchDistance(currentDistance);

      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
        setLastPosition({ x: 0, y: 0 });
      } else {
        const clamped = clampPosition(position, newScale);
        setPosition(clamped);
        setLastPosition(clamped);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 0) {
      setLastPosition(position);
      setIsDragging(false);
      setLastPinchDistance(null);
      return;
    }

    if (e.touches.length < 2) {
      setLastPinchDistance(null);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(4, parseFloat((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, parseFloat((prev - 0.25).toFixed(2)));

      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
        setLastPosition({ x: 0, y: 0 });
      }

      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    const delta = e.deltaY > 0 ? -0.15 : 0.15;

    setScale((prev) => {
      const next = Math.min(4, Math.max(1, parseFloat((prev + delta).toFixed(2))));

      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
        setLastPosition({ x: 0, y: 0 });
      }

      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0f] text-foreground">
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

      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{
          minHeight: "70vh",
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#0a0a0f]/95">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="font-serif text-xl text-foreground">
                Preparando sua leitura...
              </p>
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="grid place-items-center px-6 text-center">
            <p className="max-w-md font-serif text-2xl text-foreground">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Voltar ao site
            </button>
          </div>
        )}

        <div
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            willChange: "transform",
          }}
        >
          {scale === 1 && (
            <div
              ref={flipRef}
              className="paper-tex transition-transform duration-300"
              style={{
                transformOrigin: "center center",
                filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
              }}
            />
          )}

          {scale > 1 && pages.length > 0 && currentPage > 0 && (
            <div
              className="paper-tex transition-transform duration-300"
              style={{
                transformOrigin: "center center",
                filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={pages[currentPage - 1]}
                alt={`Página ${currentPage}`}
                style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
              />
            </div>
          )}
        </div>
      </div>

      {!error && (
        <div className="flex items-center justify-center gap-1 border-t border-border/40 bg-[#0a0a0f]/95 px-4 py-3">
          <ToolbarBtn
            onClick={() => {
              if (scale <= 1) {
                handlePageFlipNavigation("prev");
              } else if (currentPage > 1) {
                setCurrentPage((prev) => Math.max(1, prev - 1));
              }
            }}
            label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </ToolbarBtn>

          <div className="px-4 text-sm tabular-nums text-muted-foreground">
            Pág. <span className="text-foreground">{currentPage || "—"}</span> /{" "}
            {totalPages || "—"}
          </div>

          <ToolbarBtn
            onClick={() => {
              if (scale <= 1) {
                handlePageFlipNavigation("next");
              } else if (currentPage < totalPages) {
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
              }
            }}
            label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </ToolbarBtn>

          <span className="mx-2 h-6 w-px bg-border" />

          <ToolbarBtn
            onClick={toggleZoomMode}
            label={scale <= 1 ? "Entrar no modo zoom" : "Sair do modo zoom"}
          >
            {scale <= 1 ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
          </ToolbarBtn>

          <ToolbarBtn onClick={handleZoomOut} label="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </ToolbarBtn>

          <div className="w-12 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </div>

          <ToolbarBtn onClick={handleZoomIn} label="Aumentar zoom">
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

import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Set worker Src using a CDN matching the local pdfjs-dist version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setPageNum(1);

    const loadPDF = async () => {
      try {
        console.log("PDFViewer loading URL:", url);
        // Load with CORS support
        const loadingTask = pdfjsLib.getDocument({
          url,
          withCredentials: false,
        });
        const doc = await loadingTask.promise;
        if (active) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("PDF load error:", err);
        if (active) {
          setError(err.message || "Failed to load PDF document.");
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      active = false;
    };
  }, [url]);

  // Render current page when pageNum or scale changes
  useEffect(() => {
    if (!pdfDoc) return;

    let active = true;

    const renderPage = async () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      try {
        const page = await pdfDoc.getPage(pageNum);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (active) {
          renderTaskRef.current = null;
        }
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleFitWidth = async () => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth - 16;
      const viewport = page.getViewport({ scale: 1.0 });
      const fitScale = containerWidth / viewport.width;
      setScale(fitScale);
    } catch (err) {
      console.error("Fit width error:", err);
    }
  };

  const handlePrevPage = () => {
    setPageNum((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNum((prev) => Math.min(prev + 1, numPages));
  };

  if (loading) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center gap-3 bg-muted/20 border border-border/85 rounded-xl">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-semibold">Loading PDF preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h4 className="text-sm font-bold text-foreground mb-1">Unable to preview this PDF.</h4>
        <p className="text-[11px] text-muted-foreground max-w-sm mb-5">
          This could be due to cross-origin security restrictions, standard download settings, or
          network issues. You can still access the file directly.
        </p>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open PDF
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[480px] bg-muted/20 border border-border/80 rounded-xl overflow-hidden">
      {/* Viewer toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-muted/40 border-b border-border/80 text-xs">
        <div className="flex items-center gap-1">
          <button
            disabled={pageNum <= 1}
            onClick={handlePrevPage}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-foreground select-none">
            Page {pageNum} / {numPages}
          </span>
          <button
            disabled={pageNum >= numPages}
            onClick={handleNextPage}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-muted transition cursor-pointer text-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="font-medium text-foreground select-none min-w-[32px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-muted transition cursor-pointer text-foreground"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleFitWidth}
            className="p-1.5 rounded hover:bg-muted transition cursor-pointer text-foreground ml-1"
            title="Fit Width"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-muted transition text-foreground"
            title="Open in New Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={url}
            download
            className="p-1.5 rounded hover:bg-muted transition text-foreground"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Render area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex justify-center items-start bg-zinc-800/25"
      >
        <div className="shadow-lg border border-border bg-white rounded overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

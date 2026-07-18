import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { renderAsync } from "docx-preview";

interface DocxViewerProps {
  url: string;
}

export function DocxViewer({ url }: DocxViewerProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url) return;

    let active = true;
    setLoading(true);
    setError(null);

    const loadDocx = async () => {
      try {
        console.log("DocxViewer loading URL:", url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        if (!active) return;
        if (!containerRef.current) return;

        // Clear previous render
        containerRef.current.innerHTML = "";

        // Render docx using docx-preview
        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          inWrapper: false,
          ignoreWidth: true,
          ignoreHeight: true,
          breakPages: true,
          experimental: true,
        });

        if (active) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Docx render error:", err);
        if (active) {
          setError(err.message || "Failed to load Word document.");
          setLoading(false);
        }
      }
    };

    loadDocx();

    return () => {
      active = false;
    };
  }, [url]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.6));
  };

  if (loading) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center gap-3 bg-muted/20 border border-border/80 rounded-xl">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-semibold">
          Loading document preview...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h4 className="text-sm font-bold text-foreground mb-1">Unable to preview this document.</h4>
        <p className="text-[11px] text-muted-foreground max-w-sm mb-5">
          This could be due to cross-origin security restrictions or network issues. You can still
          access the file directly.
        </p>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Document
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download DOCX
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
          <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="font-semibold text-foreground select-none">Word Document Viewer</span>
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
            title="Download DOCX"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Render area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-zinc-800/25">
        <div
          className="shadow-lg border border-border bg-white rounded overflow-hidden p-6 w-full max-w-4xl min-h-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.1s ease-out",
          }}
        >
          <div ref={containerRef} className="docx-preview-container text-black" />
        </div>
      </div>
    </div>
  );
}

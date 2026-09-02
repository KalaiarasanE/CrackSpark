import React, { useState, useMemo } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FileCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PDFViewerProps {
  url: string;
  examLogo?: string;
  examName?: string;
  docTitle?: string;
  docSubtitle?: string;
}

export function PDFViewer({
  url,
  examLogo = "/logo.png",
  examName = "CrackSpark Government Exam Portal",
  docTitle = "Official Examination Document",
  docSubtitle = "Study Material & Question Paper",
}: PDFViewerProps) {
  const [logoSrc, setLogoSrc] = useState(examLogo);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [viewMode, setViewMode] = useState<"pdf" | "info">("pdf");

  // Normalize URL: resolve storage path to full public URL if needed
  const resolvedUrl = useMemo(() => {
    if (!url || typeof url !== "string") return "";
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://") || cleanUrl.startsWith("blob:")) {
      return cleanUrl;
    }
    const { data } = supabase.storage.from("resources").getPublicUrl(cleanUrl);
    return data?.publicUrl || cleanUrl;
  }, [url]);

  const cleanFileName = useMemo(() => {
    return `${(docTitle || "Study_Material").replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`;
  }, [docTitle]);

  return (
    <div className="flex flex-col h-full min-h-[500px] md:min-h-[640px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Document Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs text-white">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-100 truncate block text-xs sm:text-sm">
              {docTitle}
            </span>
            <span className="text-[10px] text-slate-400 truncate block">
              {examName} {docSubtitle ? `• ${docSubtitle}` : ""}
            </span>
          </div>
        </div>

        {/* View mode toggle & Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode("pdf")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                viewMode === "pdf"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              PDF Document
            </button>
            <button
              onClick={() => setViewMode("info")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                viewMode === "info"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Document Info
            </button>
          </div>

          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-orange-400" />
            <span className="hidden sm:inline">Open in New Tab</span>
            <span className="sm:hidden">Open</span>
          </a>

          <a
            href={resolvedUrl}
            download={cleanFileName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "pdf" && (
        <div className="flex-1 w-full h-full min-h-[500px] md:min-h-[620px] bg-slate-900 relative flex flex-col">
          {/* Iframe Loading Spinner */}
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white gap-2">
              <Loader2 className="h-7 w-7 text-orange-400 animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Loading Study Material PDF...</p>
            </div>
          )}

          {/* Embedded PDF iframe */}
          {resolvedUrl && !iframeError ? (
            <iframe
              src={`${resolvedUrl}#toolbar=1&navpanes=0`}
              title={docTitle}
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeLoading(false);
                setIframeError(true);
              }}
              className="w-full flex-1 min-h-[500px] md:min-h-[620px] border-0 bg-white"
            />
          ) : (
            /* Fallback if iframe fails to render */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white bg-slate-900">
              <FileText className="h-12 w-12 text-orange-400 mb-3" />
              <h4 className="text-base font-bold mb-1">PDF Ready for Viewing</h4>
              <p className="text-xs text-slate-400 max-w-md mb-5">
                Click below to view or download the complete study material document.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition"
                >
                  <ExternalLink className="h-4 w-4" /> Open Full PDF
                </a>
                <a
                  href={resolvedUrl}
                  download={cleanFileName}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info View Mode */}
      {viewMode === "info" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center relative overflow-hidden bg-slate-900">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] bg-center bg-no-repeat bg-[length:60%_auto]"
            style={{ backgroundImage: `url('${logoSrc}')` }}
          />

          <div className="relative mb-5 group">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-slate-950 border-2 border-orange-500/30 shadow-xl p-3 flex items-center justify-center overflow-hidden">
              <img
                src={logoSrc}
                alt={examName}
                className="h-full w-full object-contain rounded-2xl"
                onError={() => {
                  if (logoSrc !== "/logo.png") setLogoSrc("/logo.png");
                }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md border-2 border-slate-900">
              <FileCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-800/60 text-orange-300 text-xs font-bold mb-3">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>{examName}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-display font-extrabold text-white max-w-lg mb-1 leading-snug">
            {docTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {docSubtitle || "Official AI-generated Study Material with comprehensive exam notes."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
            <button
              onClick={() => setViewMode("pdf")}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <FileText className="h-4 w-4" /> View PDF Document
            </button>
            <a
              href={resolvedUrl}
              download={cleanFileName}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

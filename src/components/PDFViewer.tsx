import React, { useState, useMemo } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FileCheck,
  Sparkles,
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

  const resolvedUrl = useMemo(() => {
    if (!url || typeof url !== "string") return "";
    const cleanUrl = url.trim();
    if (
      cleanUrl.startsWith("http://") ||
      cleanUrl.startsWith("https://") ||
      cleanUrl.startsWith("blob:") ||
      cleanUrl.startsWith("data:")
    ) {
      return cleanUrl;
    }
    const { data } = supabase.storage.from("resources").getPublicUrl(cleanUrl);
    return data?.publicUrl || cleanUrl;
  }, [url]);

  return (
    <div className="flex flex-col h-full min-h-[420px] bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-900 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm relative">
      {/* Top document bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {docTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={resolvedUrl || url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
          </a>
          <a
            href={resolvedUrl || url}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition border border-slate-200/80 dark:border-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>

      {/* Main branded Exam Logo card display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Subtle decorative background watermark */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02] bg-center bg-no-repeat bg-[length:60%_auto]"
          style={{ backgroundImage: `url('${logoSrc}')` }}
        />

        {/* Particular Exam Logo Container */}
        <div className="relative mb-5 group">
          <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-white dark:bg-slate-900 border-2 border-orange-500/20 dark:border-orange-500/30 shadow-xl p-3.5 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
            <img
              src={logoSrc}
              alt={examName}
              className="h-full w-full object-contain rounded-2xl"
              onError={() => {
                if (logoSrc !== "/logo.png") {
                  setLogoSrc("/logo.png");
                }
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
            <FileCheck className="h-4 w-4" />
          </div>
        </div>

        {/* Exam Title & Document Meta */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-bold mb-3">
          <Sparkles className="h-3.5 w-3.5 text-orange-500" />
          <span>{examName}</span>
        </div>

        <h3 className="text-lg sm:text-xl font-display font-extrabold text-slate-900 dark:text-white max-w-lg mb-1 leading-snug">
          {docTitle}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {docSubtitle || "Official PDF document ready for examination study and revision."}
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
          <a
            href={resolvedUrl || url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" /> Open PDF in Browser
          </a>
          <a
            href={resolvedUrl || url}
            download
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}

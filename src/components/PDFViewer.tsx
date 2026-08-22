import React, { useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-[520px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Viewer toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            PDF Document Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>

      {/* Embedded Iframe / Native Preview */}
      <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-950">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/80 dark:bg-slate-900/80 z-10">
            <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading document...
            </span>
          </div>
        )}
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          className="w-full h-full border-0"
          title="PDF Document"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}

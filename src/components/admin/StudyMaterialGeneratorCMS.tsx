import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { allExams, categories, type Exam } from "@/data/exams";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  BookOpen,
  Sparkles,
  Upload,
  FileText,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Printer,
  ChevronRight,
  ChevronLeft,
  Search,
  Clock,
  HelpCircle,
  Layers,
  GraduationCap,
  Save,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  StudyMaterialChapter,
  StudyMaterialData,
  StudyMaterialStreamProgress,
  filterEducationalChapters,
  cleanDocumentTitle,
} from "@/lib/study-material.types";
import { StudyMaterialView } from "@/components/StudyMaterialView";
import { StudyMaterialDocument } from "@/components/StudyMaterialDocument";
import {
  generateStudyMaterialPdf,
  generateStudyMaterialWord,
  printStudyMaterialDocument,
} from "@/lib/study-material.pdf";
import { reconstructPdfText, logTamilStage } from "@/lib/tamil-pipeline";

type ChecklistStep = {
  id: string;
  label: string;
  status: "idle" | "running" | "done" | "error";
};

export function StudyMaterialGeneratorCMS() {
  const [stage, setStage] = useState<"upload" | "generating" | "preview">("upload");

  // Selection & Configuration
  const [selectedExamSlug, setSelectedExamSlug] = useState<string>(allExams[0]?.slug || "upsc-cse");
  const [materialTitle, setMaterialTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Auto-Detect");

  // Extracted Document
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docText, setDocText] = useState("");
  const [pageCount, setPageCount] = useState(1);
  const [extracting, setExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Generation & Streaming State
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [genTime, setGenTime] = useState(0);
  const [currentChapterNum, setCurrentChapterNum] = useState<number>(0);
  const [totalChaptersEst, setTotalChaptersEst] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [checklist, setChecklist] = useState<ChecklistStep[]>([
    { id: "analyze", label: "Analyzing full document pages & structure...", status: "idle" },
    { id: "chapters", label: "Detecting Chapters & Units...", status: "idle" },
    { id: "generate", label: "Generating In-Depth Study Notes, Tables & Key Facts...", status: "idle" },
    { id: "finalize", label: "Compiling High-Yield Document...", status: "idle" },
    { id: "complete", label: "Completed.", status: "idle" },
  ]);

  // Finished Study Material Data
  const [generatedMaterial, setGeneratedMaterial] = useState<StudyMaterialData | null>(null);

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Matched target exam
  const selectedExam = useMemo(() => {
    return allExams.find((e) => e.slug === selectedExamSlug) || allExams[0];
  }, [selectedExamSlug]);

  // Set default title when selected exam changes
  useEffect(() => {
    if (!materialTitle || materialTitle.includes("Study Material") || materialTitle.includes("Notes")) {
      setMaterialTitle(`${selectedExam.name} Comprehensive Study Material - ${new Date().getFullYear()}`);
    }
    if (!subject) {
      setSubject("General Studies & Exam Notes");
    }
  }, [selectedExam]);

  const updateStep = (id: string, status: ChecklistStep["status"]) => {
    setChecklist((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const addLog = useCallback((msg: string) => {
    setGenLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Handle File Upload & Extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (fileExt !== "pdf" && fileExt !== "docx" && fileExt !== "doc" && fileExt !== "txt") {
      toast.error("Unsupported file format. Please upload a .pdf, .docx, or .txt file.");
      return;
    }

    setExtracting(true);
    setDocFile(file);
    setDocName(file.name);
    setUploadProgress(0);

    try {
      if (fileExt === "pdf") {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        const arrayBuf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: arrayBuf }).promise;
        const totalP = doc.numPages;
        setPageCount(totalP);

        let fullText = "";
        for (let i = 1; i <= totalP; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const pageText = reconstructPdfText(content);
          fullText += pageText + "\n\n";
          setUploadProgress(Math.round((i / totalP) * 100));
        }

        setDocText(fullText.trim());
        toast.success(`Extracted ${totalP} pages from PDF (${fullText.length} characters)`);
      } else if (fileExt === "docx" || fileExt === "doc") {
        const arrayBuf = await file.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
        const wordCount = result.value.split(/\s+/).length;
        const estPages = Math.max(1, Math.ceil(wordCount / 500));
        setPageCount(estPages);
        setDocText(result.value.trim());
        toast.success(`Extracted document text (${result.value.length} characters)`);
      } else {
        const text = await file.text();
        setDocText(text.trim());
        setPageCount(1);
        toast.success(`Loaded text file (${text.length} characters)`);
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      toast.error(`File extraction failed: ${err.message}`);
    } finally {
      setExtracting(false);
      setUploadProgress(null);
    }
  };

  // Start Generation
  const handleStartGeneration = async () => {
    if (!docText.trim() || docText.trim().length < 30) {
      toast.error("Please upload a document or enter source material text first.");
      return;
    }

    setStage("generating");
    setGenLogs([]);
    setGenTime(0);
    setCurrentChapterNum(0);
    setTotalChaptersEst(0);
    setChecklist([
      { id: "analyze", label: `Analyzing all ${pageCount} pages...`, status: "running" },
      { id: "chapters", label: "Detecting Chapters & Units...", status: "idle" },
      { id: "generate", label: "Generating In-Depth Study Notes, Tables & Key Facts...", status: "idle" },
      { id: "finalize", label: "Compiling High-Yield Document...", status: "idle" },
      { id: "complete", label: "Completed.", status: "idle" },
    ]);

    const timerInterval = setInterval(() => {
      setGenTime((t) => t + 1);
    }, 1000);

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      addLog(`Starting AI Study Material generation for ${selectedExam.name}...`);
      updateStep("analyze", "running");

      const effectiveLang = selectedLanguage === "Auto-Detect" ? undefined : selectedLanguage;

      const response = await fetch("/api/generate-study-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: docText,
          totalPages: pageCount,
          pdfName: docName || materialTitle,
          selectedLanguage: effectiveLang,
        }),
        signal: abortCtrl.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream body received.");
      }

      updateStep("analyze", "done");
      updateStep("chapters", "running");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalMaterial: StudyMaterialData | null = null;
      let latestCompletedChapters: StudyMaterialChapter[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIdx;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (!line) continue;

          let update: StudyMaterialStreamProgress | null = null;
          try {
            update = JSON.parse(line);
          } catch {
            continue;
          }

          if (!update) continue;

          if (Array.isArray(update.completedChapters) && update.completedChapters.length > 0) {
            latestCompletedChapters = update.completedChapters;
          }

          if (update.error) {
            if (latestCompletedChapters.length > 0) {
              console.warn("Stream reported error but partial chapters exist:", update.error);
              break;
            }
            clearInterval(timerInterval);
            throw new Error(update.error);
          }

          if (update.message) {
            addLog(update.message);
          }

          if (update.stage === "detecting_chapters") {
            updateStep("chapters", "done");
            updateStep("generate", "running");
            if (update.totalChapters) {
              setTotalChaptersEst(update.totalChapters);
            }
          }

          if (update.stage === "generating_chapter") {
            if (update.currentChapter) setCurrentChapterNum(update.currentChapter);
            if (update.totalChapters) setTotalChaptersEst(update.totalChapters);
            updateStep("generate", "running");
          }

          if (update.stage === "finalizing") {
            updateStep("generate", "done");
            updateStep("finalize", "running");
          }

          if (update.stage === "completed" && update.studyMaterial) {
            finalMaterial = update.studyMaterial;
            updateStep("finalize", "done");
            updateStep("complete", "done");
            break;
          }
        }
      }

      clearInterval(timerInterval);

      if (!finalMaterial && latestCompletedChapters.length > 0) {
        finalMaterial = {
          id: `sm_${Date.now()}`,
          pdf_name: docName || "Document",
          title: materialTitle || cleanDocumentTitle(docName || "Study Material", latestCompletedChapters[0]?.chapterTitle),
          subtitle: subject || "Comprehensive Educational Study Material",
          language: selectedLanguage,
          totalPages: pageCount,
          created_at: new Date().toISOString(),
          chapters: latestCompletedChapters,
          total_points: latestCompletedChapters.reduce((acc, ch) => acc + (ch.sections?.length || 0) * 4, 0),
          estimated_read_time_minutes: Math.max(5, Math.ceil(pageCount * 2.5)),
        };
      }

      if (!finalMaterial) {
        throw new Error("Could not construct study material from the AI stream.");
      }

      setGeneratedMaterial(finalMaterial);
      setStage("preview");
      toast.success("Study Material generated successfully!");
    } catch (err: any) {
      clearInterval(timerInterval);
      if (err.name === "AbortError") {
        toast.info("Generation stopped by admin.");
        setStage("upload");
      } else {
        console.error("Study Material Generation error:", err);
        toast.error(`Generation error: ${err.message}`);
        setStage("upload");
      }
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Helper to upload file to storage
  const uploadMaterialToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop() || "pdf";
    const uniqueId = Math.random().toString(36).substring(2, 12);
    const filePath = `materials/${uniqueId}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from("resources").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.warn("Storage upload notice:", error.message);
      return "";
    }

    const { data } = supabase.storage.from("resources").getPublicUrl(filePath);
    return data?.publicUrl || "";
  };

  // Publish / Save Study Material to selected exam
  const handlePublishToExam = async () => {
    if (!generatedMaterial) {
      toast.error("No study material to publish.");
      return;
    }

    setIsPublishing(true);
    const finalTitle = materialTitle.trim() || generatedMaterial.title || `${selectedExam.name} Study Material`;
    const finalSubject = subject.trim() || generatedMaterial.subtitle || "Study Material";

    try {
      let uploadedPdfUrl = "";

      // 1. If we have the source file, upload it as the downloadable resource
      if (docFile) {
        try {
          uploadedPdfUrl = await uploadMaterialToStorage(docFile);
        } catch (upErr) {
          console.warn("Source file upload warning:", upErr);
        }
      }

      // 2. Insert record into study_materials table linked to selectedExam.slug
      const payload = {
        title: finalTitle,
        subject: finalSubject,
        exam_id: selectedExam.slug,
        pdf_url: uploadedPdfUrl || "",
        size: docFile ? `${(docFile.size / (1024 * 1024)).toFixed(1)} MB` : "2.4 MB",
        created_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from("study_materials").insert(payload);
      if (insertErr) throw insertErr;

      // 3. Post notification to notifications table
      await supabase.from("notifications").insert({
        title: `New Study Material: ${finalTitle}`,
        category: selectedExam.category.toUpperCase(),
        description: `Comprehensive study notes for ${selectedExam.fullName} (${finalSubject}) are now available.`,
        publish_date: new Date().toISOString(),
        important_links: [],
        is_pinned: false,
      });

      // 4. Send broadcast notification
      try {
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: `📚 New Study Material Published`,
          message: `Study material "${finalTitle}" has been added to ${selectedExam.fullName}.`,
          type: "study_material",
          link_to: `/exams`,
          notification_type: "study_material",
          related_exam: selectedExam.slug,
          redirect_url: `/exams`,
          is_read: false,
        });
      } catch (notifErr) {
        console.warn("User notification insert notice:", notifErr);
      }

      setPublishedSuccess(true);
      toast.success(
        `🎉 Successfully published "${finalTitle}" to ${selectedExam.fullName}'s Study Materials!`
      );
    } catch (err: any) {
      console.error("Publishing study material failed:", err);
      toast.error(`Failed to publish study material: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <BookOpen className="h-4 w-4" /> AI Study Material Engine
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Study Material Generator & Publisher
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Convert long textbooks and reference PDFs into beautifully formatted multi-chapter notes, key facts, tables, and revision points, then assign directly to any exam portal.
          </p>
        </div>

        {stage === "preview" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStage("upload")}
              className="text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Start New Document
            </Button>
          </div>
        )}
      </div>

      {/* STAGE 1: UPLOAD & CONFIGURE */}
      {stage === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Target Exam & Document Upload */}
          <div className="lg:col-span-7 space-y-5">
            {/* 🎯 TARGET EXAM SELECTOR */}
            <Card className="p-5 border-primary/30 bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Target Exam Assignment</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Select the exact exam where this study material will be published.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                  {selectedExam.category}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material-exam-select" className="text-xs font-semibold">
                  Select Exam Portal
                </Label>
                <select
                  id="material-exam-select"
                  value={selectedExamSlug}
                  onChange={(e) => setSelectedExamSlug(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map((cat) => (
                    <optgroup key={cat.slug} label={`--- ${cat.name} (${cat.fullName}) ---`}>
                      {allExams
                        .filter((ex) => ex.category.toLowerCase() === cat.slug.toLowerCase())
                        .map((ex) => (
                          <option key={ex.slug} value={ex.slug}>
                            {ex.fullName} ({ex.name})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Will be published directly to:{" "}
                    <strong className="text-foreground">{selectedExam.fullName}</strong> Study Materials
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mat-title" className="text-xs font-semibold">
                    Study Material Title
                  </Label>
                  <Input
                    id="mat-title"
                    placeholder="e.g. Indian Polity & Governance Complete Notes"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    className="text-xs sm:text-sm h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mat-subject" className="text-xs font-semibold">
                    Subject / Topic Tag
                  </Label>
                  <Input
                    id="mat-subject"
                    placeholder="e.g. Polity, History, General Science"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-xs sm:text-sm h-10"
                  />
                </div>
              </div>
            </Card>

            {/* 📄 DOCUMENT UPLOAD ZONE */}
            <Card className="p-5 bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Source Document</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Upload a reference book, notes PDF, or DOCX document to transform.
                  </p>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition bg-muted/10 group">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  disabled={extracting}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    {extracting ? (
                      <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-foreground">
                      {extracting ? "Extracting document pages..." : "Click or drag document to upload"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Supports PDF, DOCX, DOC, and TXT files
                    </div>
                  </div>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>Extracting Text...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              {/* Text Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="doc-content" className="text-xs font-semibold">
                    Extracted Text Preview
                  </Label>
                  {docText && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {docText.length} chars • {pageCount} page(s)
                    </span>
                  )}
                </div>
                <Textarea
                  id="doc-content"
                  rows={6}
                  placeholder="Extracted document text will appear here automatically, or paste study material directly..."
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Generation Settings */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-5 bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Generation Options</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Language, structure, and AI provider settings.
                  </p>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <Label htmlFor="lang-select" className="text-xs font-semibold">
                  Document Language
                </Label>
                <select
                  id="lang-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none"
                >
                  <option value="Auto-Detect">Auto-Detect (Match Document)</option>
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Tanglish">Tanglish (Tamil in English)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>

                {(selectedLanguage === "Tamil" || (docText && /[\u0B80-\u0BFF]/.test(docText))) && (
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          <span>TamilLlama 3.0 Engine</span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-orange-500/40 text-orange-600 bg-orange-500/5">
                            Active
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Zero-symbol corruption, authentic grammar, and Tamil Unicode validation enabled.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                disabled={!docText || extracting}
                onClick={handleStartGeneration}
                className="w-full h-11 text-xs sm:text-sm font-bold shadow-md cursor-pointer mt-2"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Generate Complete Study Material
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* STAGE 2: STREAMING GENERATION PROGRESS */}
      {stage === "generating" && (
        <Card className="p-8 text-center space-y-6 max-w-3xl mx-auto shadow-md">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <BookOpen className="h-6 w-6 text-primary absolute inset-0 m-auto" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Synthesizing Study Material for {selectedExam.name}...
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Deep multi-pass analysis generating chapter summaries, comparison tables, and quick-revision flash points.
              </p>
            </div>
          </div>

          {/* Checklist progress steps */}
          <div className="bg-muted/30 border border-border rounded-2xl p-5 text-left space-y-3 max-w-md mx-auto">
            {checklist.map((st) => (
              <div key={st.id} className="flex items-center gap-3 text-xs">
                {st.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                {st.status === "running" && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
                {st.status === "idle" && <div className="h-4 w-4 rounded-full border border-border shrink-0" />}
                {st.status === "error" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                <span
                  className={
                    st.status === "running"
                      ? "font-bold text-foreground"
                      : st.status === "done"
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                  }
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>

          {/* Live Log Stream */}
          <div className="bg-muted/50 border border-border rounded-xl p-4 text-left font-mono text-[11px] max-h-44 overflow-y-auto space-y-1">
            {genLogs.map((log, i) => (
              <div key={i} className="text-muted-foreground">
                {log}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="destructive" size="sm" onClick={handleStopGeneration}>
              <X className="h-4 w-4 mr-1.5" /> Stop Generation
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE 3: INTERACTIVE PREVIEW & PUBLISH */}
      {stage === "preview" && generatedMaterial && (
        <div className="space-y-6">
          {/* Top Action Bar */}
          <Card className="p-4 sm:p-5 border-primary/40 bg-gradient-to-r from-primary/5 via-card to-primary/5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    {generatedMaterial.chapters.length} Chapters Generated
                  </Badge>
                  <Badge variant="outline" className="text-xs font-semibold">
                    Target: {selectedExam.fullName}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    Subject: {subject}
                  </Badge>
                </div>
                <h3 className="font-bold text-base text-foreground mt-1">
                  {generatedMaterial.title}
                </h3>
              </div>

              {/* Action Buttons: Export + Publish */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateStudyMaterialPdf(generatedMaterial)}
                  className="text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5 text-rose-500" /> Export PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateStudyMaterialWord(generatedMaterial)}
                  className="text-xs"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-sky-500" /> Export Word
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printStudyMaterialDocument()}
                  className="text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> Print
                </Button>

                {/* 🚀 PRIMARY PUBLISH BUTTON */}
                <Button
                  size="sm"
                  disabled={isPublishing}
                  onClick={handlePublishToExam}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {isPublishing ? (
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Publish to {selectedExam.name} Study Materials
                </Button>
              </div>
            </div>

            {publishedSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    <strong>Success!</strong> Study Material has been saved to database and is now live on the{" "}
                    <strong>{selectedExam.fullName}</strong> exam page.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 border-emerald-500/40 text-emerald-600"
                  onClick={() => {
                    setStage("upload");
                    setPublishedSuccess(false);
                  }}
                >
                  Create Another
                </Button>
              </div>
            )}
          </Card>

          {/* Render Full StudyMaterialView */}
          <StudyMaterialView
            material={generatedMaterial}
            onBack={() => setStage("upload")}
            onUpdateMaterial={(updated) => setGeneratedMaterial(updated)}
          />
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { allExams, categories, type Exam } from "@/data/exams";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Sparkles,
  Upload,
  FileText,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Plus,
  Download,
  Copy,
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
  Shuffle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  reconstructPdfText,
  normalizeTamilUnicode,
  cleanUnwantedTamilSymbols,
  logTamilStage,
} from "@/lib/tamil-pipeline";
import type { MCQ } from "@/lib/ai-stream.server";

const generateUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const cleanQuestionText = (raw: string) => {
  if (!raw) return "";
  let text = cleanUnwantedTamilSymbols(normalizeTamilUnicode(raw.trim()));
  text = text.replace(/^(?:Q|Question|Q\s*No)?\s*\d*\s*[-.:)]\s*/i, "").trim();
  text = text.replace(/^Q\d+\s*/i, "").trim();
  return text;
};

const cleanOptionText = (opt: string) => {
  if (!opt) return "";
  const cleaned = cleanUnwantedTamilSymbols(normalizeTamilUnicode(opt.trim()));
  return cleaned.replace(/^[A-D1-4][\.\)\:\-]\s*/i, "").trim();
};

const getAnswerLetter = (correctAnswer: string, options: string[]) => {
  if (!options || options.length === 0) return "A";
  const cleanCorrect = cleanOptionText(correctAnswer || "");
  const idx = options.findIndex(
    (o) => cleanOptionText(o) === cleanCorrect || o === correctAnswer
  );
  return idx !== -1 ? String.fromCharCode(65 + idx) : "A";
};

const getAnswerIndex = (correctAnswer: string, options: string[]): number => {
  if (!options || options.length === 0) return 0;
  const cleanCorrect = cleanOptionText(correctAnswer || "");
  const idx = options.findIndex(
    (o) => cleanOptionText(o) === cleanCorrect || o === correctAnswer
  );
  return idx !== -1 ? idx : 0;
};

// Export to PDF
const generateExamPdf = (
  examTitle: string,
  questionsList: MCQ[],
  includeExplanations: boolean = true,
) => {
  if (!questionsList || questionsList.length === 0) {
    toast.error("Please select at least one question to download.");
    return;
  }

  const fullQuestionsText =
    examTitle +
    " " +
    questionsList
      .map(
        (m) =>
          (m.question || "") +
          " " +
          (m.options ? m.options.join(" ") : "") +
          " " +
          (m.correctAnswer || "") +
          " " +
          (m.explanation || "")
      )
      .join(" ");

  let fontName = "helvetica";
  let fontFileName = "";
  let fontUrls: string[] = [];

  if (/[\u0B80-\u0BFF]/.test(fullQuestionsText)) {
    fontName = "NotoSansTamil";
    fontFileName = "NotoSansTamil.ttf";
    fontUrls = [
      "/fonts/NotoSansTamil.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstamil/NotoSansTamil%5Bwdth%2Cwght%5D.ttf",
    ];
  }

  const renderPdf = (base64Font?: string) => {
    try {
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
        compress: true,
      });

      if (base64Font && fontFileName && fontName) {
        doc.addFileToVFS(fontFileName, base64Font);
        doc.addFont(fontFileName, fontName, "normal", "Identity-H");
        doc.setFont(fontName, "normal");
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 50;
      const marginY = 50;
      const contentWidth = pageWidth - marginX * 2;

      let y = marginY;

      const setFont = (bold: boolean = false) => {
        if (fontName === "helvetica") {
          doc.setFont("helvetica", bold ? "bold" : "normal");
        } else {
          doc.setFont(fontName, "normal");
        }
      };

      const qFontSize = 13;
      const optFontSize = 11;
      const qLineHeight = 18;
      const optLineHeight = 16;

      // Header
      setFont(true);
      doc.setFontSize(16);
      doc.text(examTitle, marginX, y);
      y += 24;
      setFont(false);
      doc.setFontSize(10);
      doc.text(`Total Questions: ${questionsList.length} | Generated by CrackSpark CMS`, marginX, y);
      y += 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 25;

      questionsList.forEach((m, idx) => {
        const rawQuestion = cleanQuestionText(m.question);
        const questionStr = `${idx + 1}. ${rawQuestion}`;

        const opts = m.options || ["", "", "", ""];
        const optAStr = `A. ${cleanOptionText(opts[0])}`;
        const optBStr = `B. ${cleanOptionText(opts[1])}`;
        const optCStr = `C. ${cleanOptionText(opts[2])}`;
        const optDStr = `D. ${cleanOptionText(opts[3])}`;

        const ansLetter = getAnswerLetter(m.correctAnswer || "", opts);
        const answerStr = `Correct Answer: Option ${ansLetter}`;
        const expText = includeExplanations ? (m.explanation || "").trim() : "";

        setFont(true);
        doc.setFontSize(qFontSize);
        const questionLines = doc.splitTextToSize(questionStr, contentWidth) as string[];

        setFont(false);
        doc.setFontSize(optFontSize);
        const optALines = doc.splitTextToSize(optAStr, contentWidth) as string[];
        const optBLines = doc.splitTextToSize(optBStr, contentWidth) as string[];
        const optCLines = doc.splitTextToSize(optCStr, contentWidth) as string[];
        const optDLines = doc.splitTextToSize(optDStr, contentWidth) as string[];

        setFont(true);
        const answerLines = doc.splitTextToSize(answerStr, contentWidth) as string[];

        setFont(false);
        const explanationLines = expText ? (doc.splitTextToSize(`Explanation: ${expText}`, contentWidth) as string[]) : [];

        let blockHeight = 0;
        blockHeight += questionLines.length * qLineHeight + 8;
        blockHeight += optALines.length * optLineHeight + 4;
        blockHeight += optBLines.length * optLineHeight + 4;
        blockHeight += optCLines.length * optLineHeight + 4;
        blockHeight += optDLines.length * optLineHeight + 8;
        blockHeight += answerLines.length * optLineHeight;

        if (expText) {
          blockHeight += 6;
          blockHeight += explanationLines.length * optLineHeight;
        }
        blockHeight += 18;

        if (y + blockHeight > pageHeight - marginY && y > marginY) {
          doc.addPage();
          if (base64Font && fontFileName && fontName) {
            doc.setFont(fontName, "normal");
          }
          y = marginY;
        }

        setFont(true);
        doc.setFontSize(qFontSize);
        questionLines.forEach((line) => {
          doc.text(line, marginX, y);
          y += qLineHeight;
        });
        y += 4;

        setFont(false);
        doc.setFontSize(optFontSize);
        [optALines, optBLines, optCLines, optDLines].forEach((lines) => {
          lines.forEach((line) => {
            doc.text(line, marginX + 10, y);
            y += optLineHeight;
          });
          y += 2;
        });
        y += 4;

        setFont(true);
        doc.setTextColor(22, 101, 52); // green
        answerLines.forEach((line) => {
          doc.text(line, marginX + 10, y);
          y += optLineHeight;
        });
        doc.setTextColor(0, 0, 0);

        if (expText && explanationLines.length > 0) {
          setFont(false);
          doc.setTextColor(71, 85, 105);
          explanationLines.forEach((line) => {
            doc.text(line, marginX + 10, y);
            y += optLineHeight;
          });
          doc.setTextColor(0, 0, 0);
        }

        y += 16;
      });

      const cleanName = examTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
      doc.save(`${cleanName}_MCQs.pdf`);
      toast.success("PDF document downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("PDF generation failed. Try downloading again.");
    }
  };

  if (fontUrls.length > 0) {
    const fetchFont = async () => {
      for (const url of fontUrls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const arrayBuffer = await res.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(arrayBuffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return typeof btoa !== "undefined"
            ? btoa(binary)
            : typeof Buffer !== "undefined"
            ? Buffer.from(binary, "binary").toString("base64")
            : null;
        } catch {}
      }
      return null;
    };

    fetchFont().then((base64Font) => {
      renderPdf(base64Font || undefined);
    });
  } else {
    renderPdf();
  }
};

// Export to Word
const generateWordDocument = async (
  examTitle: string,
  questionsList: MCQ[],
  includeExplanations: boolean = true
) => {
  if (!questionsList || questionsList.length === 0) {
    toast.error("Please select at least one question to download.");
    return;
  }

  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: examTitle,
                  bold: true,
                  size: 32, // 16pt
                }),
              ],
              spacing: { after: 200 },
            }),
            ...questionsList.flatMap((m, idx) => {
              const rawQuestion = cleanQuestionText(m.question);
              const opts = m.options || ["", "", "", ""];
              const ansLetter = getAnswerLetter(m.correctAnswer || "", opts);
              const expText = includeExplanations ? (m.explanation || "").trim() : "";

              const children: Paragraph[] = [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${idx + 1}. ${rawQuestion}`,
                      bold: true,
                      size: 26,
                    }),
                  ],
                  spacing: { before: idx === 0 ? 0 : 250, after: 100 },
                }),
                ...opts.map(
                  (opt, oi) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${String.fromCharCode(65 + oi)}. ${cleanOptionText(opt)}`,
                          size: 22,
                        }),
                      ],
                      spacing: { after: 60 },
                    })
                ),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Correct Answer: Option ${ansLetter}`,
                      bold: true,
                      color: "15803D",
                      size: 22,
                    }),
                  ],
                  spacing: { before: 80, after: 60 },
                }),
              ];

              if (expText) {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Explanation: `,
                        bold: true,
                        size: 20,
                        color: "475569",
                      }),
                      new TextRun({
                        text: expText,
                        size: 20,
                        color: "475569",
                      }),
                    ],
                    spacing: { after: 120 },
                  })
                );
              }

              return children;
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const cleanName = examTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    saveAs(blob, `${cleanName}_MCQs.docx`);
    toast.success("Word Document downloaded successfully!");
  } catch (err) {
    console.error("Word export failed:", err);
    toast.error("Word export failed. Please try again.");
  }
};

// Export to Excel
const exportToExcel = async (examTitle: string, questionsList: MCQ[]) => {
  if (!questionsList || questionsList.length === 0) {
    toast.error("No questions to export.");
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("MCQs");

    worksheet.columns = [
      { header: "Q.No", key: "qno", width: 8 },
      { header: "Question", key: "question", width: 50 },
      { header: "Option A", key: "optA", width: 25 },
      { header: "Option B", key: "optB", width: 25 },
      { header: "Option C", key: "optC", width: 25 },
      { header: "Option D", key: "optD", width: 25 },
      { header: "Correct Answer", key: "correct", width: 16 },
      { header: "Difficulty", key: "difficulty", width: 14 },
      { header: "Explanation", key: "explanation", width: 45 },
    ];

    worksheet.getRow(1).font = { bold: true };

    questionsList.forEach((q, idx) => {
      const opts = q.options || ["", "", "", ""];
      const ansLetter = getAnswerLetter(q.correctAnswer, opts);
      worksheet.addRow({
        qno: idx + 1,
        question: cleanQuestionText(q.question),
        optA: cleanOptionText(opts[0]),
        optB: cleanOptionText(opts[1]),
        optC: cleanOptionText(opts[2]),
        optD: cleanOptionText(opts[3]),
        correct: `Option ${ansLetter}`,
        difficulty: q.difficulty || "Medium",
        explanation: q.explanation || "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const cleanName = examTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    saveAs(blob, `${cleanName}_MCQs.xlsx`);
    toast.success("Excel Spreadsheet downloaded successfully!");
  } catch (err) {
    console.error("Excel export failed:", err);
    toast.error("Excel export failed.");
  }
};

export function MCQGeneratorCMS() {
  const [stage, setStage] = useState<"upload" | "generating" | "review">("upload");

  // Selection & Configuration
  const [selectedExamSlug, setSelectedExamSlug] = useState<string>(allExams[0]?.slug || "upsc-cse");
  const [testTitle, setTestTitle] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Mixed");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Auto-Detect");
  const [duration, setDuration] = useState("45 mins");

  // Extracted Document
  const [docText, setDocText] = useState("");
  const [docName, setDocName] = useState("");
  const [pageCount, setPageCount] = useState(1);
  const [extracting, setExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Generation & Streaming
  const [liveQuestions, setLiveQuestions] = useState<MCQ[]>([]);
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [genTime, setGenTime] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Review Stage & Editing
  const [reviewQuestions, setReviewQuestions] = useState<MCQ[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [editQModal, setEditQModal] = useState<MCQ | null>(null);

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Matched target exam
  const selectedExam = useMemo(() => {
    return allExams.find((e) => e.slug === selectedExamSlug) || allExams[0];
  }, [selectedExamSlug]);

  // Set default title when selected exam changes
  useEffect(() => {
    if (!testTitle || testTitle.includes("Mock Test")) {
      setTestTitle(`${selectedExam.name} Comprehensive Mock Test - ${new Date().getFullYear()}`);
    }
  }, [selectedExam]);

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
    setDocName(file.name);
    setUploadProgress(0);
    setGenError(null);

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

        const trimmed = fullText.trim();
        setDocText(trimmed);
        if (/[\u0B80-\u0BFF]/.test(trimmed)) {
          setSelectedLanguage("Tamil");
          logTamilStage("A", "Detected Tamil Content in Uploaded Document", trimmed.slice(0, 200));
        }
        toast.success(`Extracted ${totalP} pages from PDF (${trimmed.length.toLocaleString()} characters)`);
      } else if (fileExt === "docx" || fileExt === "doc") {
        const arrayBuf = await file.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
        const wordCount = result.value.split(/\s+/).length;
        const estPages = Math.max(1, Math.ceil(wordCount / 500));
        setPageCount(estPages);
        const trimmed = result.value.trim();
        setDocText(trimmed);
        if (/[\u0B80-\u0BFF]/.test(trimmed)) {
          setSelectedLanguage("Tamil");
          logTamilStage("A", "Detected Tamil Content in Uploaded Document", trimmed.slice(0, 200));
        }
        toast.success(`Extracted document text (${trimmed.length.toLocaleString()} characters)`);
      } else {
        const text = await file.text();
        const trimmed = text.trim();
        setDocText(trimmed);
        setPageCount(1);
        if (/[\u0B80-\u0BFF]/.test(trimmed)) {
          setSelectedLanguage("Tamil");
          logTamilStage("A", "Detected Tamil Content in Uploaded Document", trimmed.slice(0, 200));
        }
        toast.success(`Loaded text file (${trimmed.length.toLocaleString()} characters)`);
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
      toast.error("Please upload a document (PDF, DOCX, TXT) first.");
      return;
    }

    setStage("generating");
    setLiveQuestions([]);
    setGenLogs([]);
    setGenTime(0);
    setGenError(null);

    const timerInterval = setInterval(() => {
      setGenTime((t) => t + 1);
    }, 1000);

    const questionsList: MCQ[] = [];
    const seenQuestions = new Set<string>();

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const effectiveLang = selectedLanguage === "Auto-Detect" ? undefined : selectedLanguage;

      let continuationAttempts = 0;
      const MAX_CONTINUATIONS = 6;

      while (questionsList.length < questionCount && continuationAttempts < MAX_CONTINUATIONS) {
        if (abortCtrl.signal.aborted) break;

        const neededCount = questionCount - questionsList.length;
        if (continuationAttempts > 0) {
          setGenLogs((prev) => [
            ...prev,
            `[Continuation] Reached ${questionsList.length}/${questionCount}. Generating remaining ${neededCount} questions...`,
          ]);
        }

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: docText,
            count: neededCount,
            difficulty,
            selectedLanguage: effectiveLang,
            avoidQuestions: questionsList.map((q) => q.question),
          }),
          signal: abortCtrl.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          let errMsg = `Generation failed (${response.status})`;
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error) errMsg = parsed.error;
          } catch {}
          if (questionsList.length === 0) {
            throw new Error(errMsg);
          } else {
            console.warn("Continuation batch error:", errMsg);
            break;
          }
        }

        if (!response.body) throw new Error("No response stream body received from server.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          let nlIdx;
          while ((nlIdx = streamBuffer.indexOf("\n")) !== -1) {
            const line = streamBuffer.slice(0, nlIdx).trim();
            streamBuffer = streamBuffer.slice(nlIdx + 1);
            if (!line) continue;

            try {
              const parsed = JSON.parse(line);
              if (parsed.error) {
                console.warn("Stream error notice:", parsed.error);
                continue;
              }
              if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
                const cleanQ = cleanQuestionText(parsed.question);
                const qKey = cleanQ.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, "").trim();

                if (!seenQuestions.has(qKey) && qKey.length >= 5) {
                  seenQuestions.add(qKey);
                  const newMcq: MCQ = {
                    question: cleanQ,
                    options: parsed.options.map((o: string) => cleanOptionText(o)),
                    correctAnswer: parsed.correctAnswer || parsed.options[0],
                    explanation: parsed.explanation || "",
                    difficulty: parsed.difficulty || (difficulty === "Mixed" ? "Medium" : difficulty),
                    category: parsed.category || "General",
                  };
                  questionsList.push(newMcq);
                  setLiveQuestions([...questionsList]);
                  setGenLogs((prev) => [
                    ...prev,
                    `[Q${questionsList.length}/${questionCount}] ${cleanQ.slice(0, 55)}...`,
                  ]);

                  if (questionsList.length >= questionCount) {
                    try {
                      reader.cancel();
                    } catch {}
                    break;
                  }
                }
              }
            } catch (parseErr: any) {
              if (parseErr.message && !parseErr.message.includes("Unexpected token")) {
                console.warn("Parse notice:", parseErr);
              }
            }
          }
          if (questionsList.length >= questionCount) break;
        }

        continuationAttempts++;
      }

      if (questionsList.length < questionCount) {
        throw new Error(
          `Generated ${questionsList.length} of requested ${questionCount} MCQs. Please provide additional study text or click 'Retry Generation'.`
        );
      }

      clearInterval(timerInterval);
      const exactSet = questionsList.slice(0, questionCount);
      setReviewQuestions(exactSet);
      setStage("review");
      toast.success(`Successfully generated all ${exactSet.length} MCQs!`);
    } catch (err: any) {
      clearInterval(timerInterval);
      if (err.name === "AbortError") {
        toast.info("Generation stopped by admin.");
        if (questionsList.length >= questionCount) {
          setReviewQuestions(questionsList.slice(0, questionCount));
          setStage("review");
        } else {
          setStage("upload");
        }
      } else {
        console.error("MCQ Generation error:", err);
        const errMsg = err.message || "Failed to generate MCQs. Please check server AI configuration.";
        setGenError(errMsg);
        toast.error(errMsg);
      }
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Publish / Save to selected exam
  const handlePublishToExam = async () => {
    if (reviewQuestions.length === 0) {
      toast.error("No questions to publish.");
      return;
    }

    setIsPublishing(true);
    const testId = generateUUID();
    const finalTitle = testTitle.trim() || `${selectedExam.name} Full Mock Test`;
    const targetExamId = selectedExam.slug.toLowerCase().trim();

    try {
      // 1. Prepare questions JSON payload for mock_tests
      const questionsJson = reviewQuestions.map((q, idx) => ({
        q: q.question,
        o: q.options,
        a: getAnswerIndex(q.correctAnswer, q.options),
        exp: q.explanation || "",
      }));

      // 2. Insert into mock_tests table linked strictly to targetExamId
      const mockPayload = {
        id: testId,
        exam_id: targetExamId,
        title: finalTitle,
        questions_count: reviewQuestions.length,
        duration: duration || "60 mins",
        difficulty: difficulty || "Mixed",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        is_enabled: true,
        questions_json: questionsJson,
        created_at: new Date().toISOString(),
      };

      const { error: mockError } = await supabase.from("mock_tests").insert(mockPayload);
      if (mockError) throw mockError;

      // 3. Insert individual questions into mock_questions table for relational queries
      const questionsPayload = reviewQuestions.map((q, idx) => {
        const ansLetter = getAnswerLetter(q.correctAnswer, q.options);
        return {
          mock_test_id: testId,
          question_number: idx + 1,
          question: q.question,
          option_a: q.options[0] || "",
          option_b: q.options[1] || "",
          option_c: q.options[2] || "",
          option_d: q.options[3] || "",
          correct_answer: ansLetter,
          explanation: q.explanation || "",
          marks: 1,
        };
      });

      try {
        await supabase.from("mock_questions").insert(questionsPayload);
      } catch (qErr) {
        console.warn("mock_questions insert notice:", qErr);
      }

      // 4. Post broadcast notification
      await supabase.from("notifications").insert({
        title: `New Mock Test: ${finalTitle}`,
        category: selectedExam.category.toUpperCase(),
        description: `${reviewQuestions.length} practice questions now live for ${selectedExam.fullName}.`,
        publish_date: new Date().toISOString(),
        important_links: [],
        is_pinned: false,
      });

      try {
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: `📝 New CBT Mock Test Published`,
          message: `"${finalTitle}" with ${reviewQuestions.length} questions is now available in ${selectedExam.fullName}.`,
          type: "mock_test",
          link_to: `/${selectedExam.category}/${selectedExam.slug}`,
          notification_type: "mock_test",
          related_exam: targetExamId,
          related_resource_id: testId,
          redirect_url: `/mock-test/${testId}/exam`,
          is_read: false,
        });
      } catch (notifErr) {
        console.warn("Notification insert fallback:", notifErr);
      }

      setPublishedSuccess(true);
      toast.success(
        `🎉 Successfully published all ${reviewQuestions.length} MCQs to ${selectedExam.fullName}'s Mock Tests!`
      );
    } catch (err: any) {
      console.error("Publishing error:", err);
      toast.error(`Failed to publish mock test: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Filtered Questions for Review
  const filteredQuestions = useMemo(() => {
    return reviewQuestions.filter((q) => {
      const matchesSearch =
        !searchQuery.trim() ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDiff =
        filterDifficulty === "all" ||
        q.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
      return matchesSearch && matchesDiff;
    });
  }, [reviewQuestions, searchQuery, filterDifficulty]);

  // Edit Question Handlers
  const handleOpenEdit = (index: number) => {
    setEditingQuestionIdx(index);
    setEditQModal({ ...reviewQuestions[index] });
  };

  const handleSaveEdit = () => {
    if (editingQuestionIdx !== null && editQModal) {
      const updated = [...reviewQuestions];
      updated[editingQuestionIdx] = editQModal;
      setReviewQuestions(updated);
      setEditingQuestionIdx(null);
      setEditQModal(null);
      toast.success("Question updated.");
    }
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = reviewQuestions.filter((_, i) => i !== index);
    setReviewQuestions(updated);
    toast.success("Question removed.");
  };

  const handleAddManualQuestion = () => {
    const newQ: MCQ = {
      question: "Enter question title here...",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "Explanation here...",
      difficulty: "Medium",
      category: "General",
    };
    setReviewQuestions([...reviewQuestions, newQ]);
    setEditingQuestionIdx(reviewQuestions.length);
    setEditQModal(newQ);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Sparkles className="h-4 w-4" /> AI Question Bank Engine
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            MCQ Generator & Exam Publisher
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Upload study PDFs or lecture notes to automatically generate high-yield MCQs with explanations, then publish them directly to any exam portal.
          </p>
        </div>

        {stage === "review" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStage("upload")}
              className="text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Start New Generation
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
                      Select the exact exam where this mock test will be published.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                  {selectedExam.category}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam-select" className="text-xs font-semibold">
                  Select Exam Portal
                </Label>
                <select
                  id="exam-select"
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
                    <strong className="text-foreground">{selectedExam.fullName}</strong> Mock Tests
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="test-title" className="text-xs font-semibold">
                  Mock Test Title
                </Label>
                <Input
                  id="test-title"
                  placeholder="e.g. UPSC CSAT Paper II Full Mock Test"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="text-xs sm:text-sm h-10"
                />
              </div>
            </Card>

            {/* 📄 DOCUMENT UPLOAD ZONE */}
            <Card className="p-5 bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Source Study Material</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Upload a syllabus PDF, past paper, book chapter, or paste raw study notes.
                  </p>
                </div>
              </div>

              {/* Upload Input */}
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
                      {extracting ? "Extracting document content..." : "Click or drag document to upload"}
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

              {/* Document Ready Card (No Textarea) */}
              {docName && docText && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-foreground truncate">{docName}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{pageCount} page{pageCount > 1 ? "s" : ""}</span>
                        <span>•</span>
                        <span>{docText.length.toLocaleString()} characters</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">Processed & Ready</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDocText("");
                      setDocName("");
                      setPageCount(1);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Generation Configuration */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-5 bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Quiz & AI Parameters</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Configure question distribution, difficulty, and language.
                  </p>
                </div>
              </div>

              {/* Number of questions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Question Count</Label>
                  <span className="text-xs font-bold text-primary font-mono">{questionCount} MCQs</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[5, 10, 15, 20, 25].map((cnt) => (
                    <Button
                      key={cnt}
                      type="button"
                      variant={questionCount === cnt ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuestionCount(cnt)}
                      className="text-xs h-8"
                    >
                      {cnt}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[30, 50, 100].map((cnt) => (
                    <Button
                      key={cnt}
                      type="button"
                      variant={questionCount === cnt ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuestionCount(cnt)}
                      className="text-xs h-8"
                    >
                      {cnt} MCQs
                    </Button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Difficulty Level</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Easy", "Medium", "Hard", "Mixed"] as const).map((diff) => (
                    <Button
                      key={diff}
                      type="button"
                      variant={difficulty === diff ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDifficulty(diff)}
                      className="text-xs h-8"
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="lang-select" className="text-xs font-semibold">
                  Language
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

              {/* Duration */}
              <div className="space-y-1.5">
                <Label htmlFor="duration-select" className="text-xs font-semibold">
                  Test Duration (for CBT Online Exam)
                </Label>
                <select
                  id="duration-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none"
                >
                  <option value="15 mins">15 mins</option>
                  <option value="30 mins">30 mins</option>
                  <option value="45 mins">45 mins</option>
                  <option value="60 mins">60 mins (1 Hour)</option>
                  <option value="90 mins">90 mins (1.5 Hours)</option>
                  <option value="120 mins">120 mins (2 Hours)</option>
                  <option value="180 mins">180 mins (3 Hours)</option>
                </select>
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                disabled={!docText || extracting}
                onClick={handleStartGeneration}
                className="w-full h-11 text-xs sm:text-sm font-bold shadow-md cursor-pointer mt-2"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Generate {questionCount} MCQs with AI
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* STAGE 2: GENERATING / STREAMING PROGRESS */}
      {stage === "generating" && (
        <Card className="p-8 text-center space-y-6 max-w-3xl mx-auto shadow-md">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className={`h-16 w-16 rounded-full border-4 ${genError ? "border-destructive" : "border-primary border-t-transparent animate-spin"}`} />
              <Sparkles className={`h-6 w-6 absolute inset-0 m-auto ${genError ? "text-destructive" : "text-primary"}`} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">
                {genError ? "MCQ Generation Failed" : `Generating Questions for ${selectedExam.name}...`}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {genError
                  ? "An error occurred during generation. Review details below or retry."
                  : "Streaming high-yield questions with 4 verified options and educational explanations."}
              </p>
            </div>
          </div>

          {/* Error Banner with Retry */}
          {genError && (
            <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-left space-y-3.5 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Error Details</span>
              </div>
              <p className="text-xs text-foreground/90 font-mono break-words leading-relaxed">{genError}</p>

              <div className="flex gap-2 pt-2">
                <Button variant="default" size="sm" onClick={handleStartGeneration} className="text-xs flex-1">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retry Generation
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStage("upload")} className="text-xs">
                  Back to Settings
                </Button>
              </div>
            </div>
          )}

          {/* Progress Bar & Live Counter */}
          {!genError && (
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Elapsed: {genTime}s
                </span>
                <span className="text-primary font-mono">
                  {liveQuestions.length} / {questionCount} Generated (
                  {Math.round((liveQuestions.length / questionCount) * 100)}%)
                </span>
              </div>
              <Progress
                value={Math.round((liveQuestions.length / questionCount) * 100)}
                className="h-2.5"
              />
            </div>
          )}

          {/* Live Log Stream */}
          <div className="bg-muted/50 border border-border rounded-xl p-4 text-left font-mono text-[11px] max-h-48 overflow-y-auto space-y-1">
            {genLogs.map((log, i) => (
              <div key={i} className="text-muted-foreground">
                {log}
              </div>
            ))}
            {genLogs.length === 0 && !genError && (
              <div className="text-muted-foreground animate-pulse">
                Connecting to AI stream and parsing questions...
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant={liveQuestions.length > 0 ? "default" : "destructive"}
              size="sm"
              onClick={handleStopGeneration}
              className="text-xs"
            >
              <X className="h-4 w-4 mr-1.5" /> {liveQuestions.length > 0 ? `Use Generated (${liveQuestions.length} MCQs)` : "Cancel Generation"}
            </Button>
            {genError && (
              <Button variant="outline" size="sm" onClick={() => setStage("upload")} className="text-xs">
                Return to Upload
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* STAGE 3: REVIEW, EDIT & PUBLISH */}
      {stage === "review" && (
        <div className="space-y-6">
          {/* Top Control Bar: Publishing Banner */}
          <Card className="p-4 sm:p-5 border-primary/40 bg-gradient-to-r from-primary/5 via-card to-primary/5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    {reviewQuestions.length} Questions Ready
                  </Badge>
                  <Badge variant="outline" className="text-xs font-semibold uppercase">
                    {selectedExam.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    Duration: {duration}
                  </Badge>
                </div>
                <h3 className="font-bold text-base text-foreground truncate">{testTitle}</h3>

                {/* Exam Target Selector in Review */}
                <div className="flex items-center gap-2 pt-1 max-w-md">
                  <Label htmlFor="review-exam-select" className="text-[11px] font-bold text-muted-foreground shrink-0">
                    Assign To Exam:
                  </Label>
                  <select
                    id="review-exam-select"
                    value={selectedExamSlug}
                    onChange={(e) => setSelectedExamSlug(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary w-full"
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
                </div>
              </div>

              {/* Action Buttons: Export + Publish */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateExamPdf(testTitle, reviewQuestions, true)}
                  className="text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5 text-rose-500" /> Download PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateWordDocument(testTitle, reviewQuestions, true)}
                  className="text-xs"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-sky-500" /> Word DOCX
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel(testTitle, reviewQuestions)}
                  className="text-xs"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Excel
                </Button>

                {/* 🚀 PRIMARY PUBLISH BUTTON */}
                <Button
                  size="sm"
                  disabled={isPublishing || reviewQuestions.length === 0}
                  onClick={handlePublishToExam}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                >
                  {isPublishing ? (
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Publish to {selectedExam.name} Mock Tests
                </Button>
              </div>
            </div>

            {publishedSuccess && (
              <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Published!</strong> Saved to database and assigned exclusively to{" "}
                    <strong>{selectedExam.fullName}</strong>.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/${selectedExam.category}/${selectedExam.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
                  >
                    View on {selectedExam.name} Portal ↗
                  </a>
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
              </div>
            )}
          </Card>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search questions, options, or explanations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddManualQuestion}
                className="text-xs h-9"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
              </Button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const originalIndex = reviewQuestions.indexOf(q);
              const ansLetter = getAnswerLetter(q.correctAnswer, q.options);

              return (
                <Card
                  key={originalIndex}
                  className="p-5 bg-card border-border hover:border-primary/40 transition shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {originalIndex + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              q.difficulty === "Easy"
                                ? "text-emerald-500 border-emerald-500/20"
                                : q.difficulty === "Hard"
                                ? "text-rose-500 border-rose-500/20"
                                : "text-amber-500 border-amber-500/20"
                            }`}
                          >
                            {q.difficulty}
                          </Badge>
                          {q.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {q.category}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm text-foreground leading-relaxed">
                          {q.question}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(originalIndex)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(originalIndex)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-10">
                    {q.options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const isCorrect = letter === ansLetter;
                      return (
                        <div
                          key={oi}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition ${
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "bg-muted/20 border-border text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="truncate">{cleanOptionText(opt)}</span>
                          {isCorrect && (
                            <Check className="h-3.5 w-3.5 text-emerald-500 ml-auto shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="pl-10 text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/60">
                      <strong className="text-foreground">Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="p-12 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border">
                No questions matching the search query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {editingQuestionIdx !== null && editQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-2xl bg-card border-border shadow-2xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground">
                Edit Question #{editingQuestionIdx + 1}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingQuestionIdx(null)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Question Text</Label>
                <Textarea
                  rows={3}
                  value={editQModal.question}
                  onChange={(e) =>
                    setEditQModal({ ...editQModal, question: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Options & Correct Answer (Click letter to select correct)
                </Label>
                {editQModal.options.map((opt, oi) => {
                  const letter = String.fromCharCode(65 + oi);
                  const isCorrect = getAnswerLetter(editQModal.correctAnswer, editQModal.options) === letter;

                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isCorrect ? "default" : "outline"}
                        onClick={() =>
                          setEditQModal({
                            ...editQModal,
                            correctAnswer: editQModal.options[oi],
                          })
                        }
                        className={`h-9 w-9 shrink-0 font-bold ${
                          isCorrect ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                        }`}
                      >
                        {letter}
                      </Button>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const updatedOpts = [...editQModal.options];
                          updatedOpts[oi] = e.target.value;
                          setEditQModal({ ...editQModal, options: updatedOpts });
                        }}
                        className="text-xs h-9"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Explanation</Label>
                <Textarea
                  rows={2}
                  value={editQModal.explanation || ""}
                  onChange={(e) =>
                    setEditQModal({ ...editQModal, explanation: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              {/* Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Difficulty</Label>
                  <select
                    value={editQModal.difficulty}
                    onChange={(e) =>
                      setEditQModal({ ...editQModal, difficulty: e.target.value as any })
                    }
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Category / Topic</Label>
                  <Input
                    value={editQModal.category || ""}
                    onChange={(e) =>
                      setEditQModal({ ...editQModal, category: e.target.value })
                    }
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingQuestionIdx(null)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="font-bold">
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import {
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Play,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { mockQuestionsData } from "@/data/mockQuestions";

export const Route = createFileRoute("/mock-test/$testId/exam")({
  head: () => ({
    meta: [
      { title: "CBT Online Exam Portal — CrackSpark" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExamPortalPage,
});
function getCorrectAnswerIndex(q: any): number {
  if (!q) return 0;
  let ansVal = q.a;

  // Try to parse answer key from explanation if current value is unassigned
  if (ansVal === undefined || ansVal === null || ansVal === -1) {
    if (q.exp) {
      const expMatch = String(q.exp).match(/(?:Correct\s+)?(?:Answer|Ans|Option)(?:\s+is)?\s*[:\-\.\s\)]+\s*\(?([A-Da-d]|\d)\)?(?:\b|[\)\.\-\s]|$)/i);
      if (expMatch) {
        const char = expMatch[1].toUpperCase();
        if (char >= 'A' && char <= 'D') {
          ansVal = char.charCodeAt(0) - 65;
        } else {
          const val = parseInt(char);
          if (!isNaN(val) && val >= 1 && val <= 4) {
            ansVal = val - 1;
          }
        }
      }
    }
  }

  // Fallback to Option A (0) instead of -1 so there's never a No Answer Available state
  if (ansVal === undefined || ansVal === null || ansVal === -1) {
    return 0;
  }

  if (typeof ansVal === 'number') {
    return ansVal;
  }
  const cleanA = String(ansVal).trim().toUpperCase();
  if (cleanA === 'A' || cleanA === '0') return 0;
  if (cleanA === 'B' || cleanA === '1') return 1;
  if (cleanA === 'C' || cleanA === '2') return 2;
  if (cleanA === 'D' || cleanA === '3') return 3;

  if (Array.isArray(q.o)) {
    const textIdx = q.o.findIndex((opt: any) => String(opt).trim().toLowerCase() === cleanA.toLowerCase());
    if (textIdx !== -1) return textIdx;
  }
  return 0;
}

function ExamPortalPage() {
  const { user, loading: authLoading, isSubscribed, subscriptionDetails } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams({ from: "/mock-test/$testId/exam" });

  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // Taker States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [testResult, setTestResult] = useState<any>(null);

  // Popup & Fullscreen warnings
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [showStartOverlay, setShowStartOverlay] = useState(true);

  // Exit warning state
  const isFirstMount = useRef(true);

  // Fetch Test Details from database
  useEffect(() => {
    async function loadTest() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("id", testId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast.error("Mock test not found.");
          navigate({ to: "/exams" });
          return;
        }

        // Check premium status
        const isLocked = data.isLocked || false;
        if (isLocked && !isSubscribed) {
          if (subscriptionDetails?.payment_status === "pending") {
            toast.warning("Your subscription is waiting for admin verification. Premium access will be enabled once your payment is approved.");
            navigate({ to: "/dashboard" });
          } else if (subscriptionDetails?.payment_status === "rejected") {
            toast.error("Your payment verification was rejected. Please check the admin remarks and upload a valid payment screenshot.");
            navigate({ to: "/subscription" });
          } else {
            toast.info("This is a Premium feature. Redirecting to subscription...");
            navigate({ to: "/subscription" });
          }
          return;
        }

        setActiveTest(data);
        const testQuestions = data.questions_json && data.questions_json.length > 0
          ? data.questions_json
          : (mockQuestionsData[data.exam_id] || mockQuestionsData.default);
        setQuestions(testQuestions);

        const totalDuration = data.duration ? (parseInt(data.duration) * 60 || 600) : 600;
        setTimerSeconds(totalDuration);
      } catch (err: any) {
        console.error("Error loading mock test:", err);
        toast.error("Failed to load mock test.");
      } finally {
        setLoading(false);
      }
    }

    if (user && !authLoading) {
      loadTest();
    } else if (!user && !authLoading) {
      navigate({
        to: "/user-login",
        search: { redirect: window.location.pathname, message: "Please login to start the exam." },
      });
    }
  }, [testId, user, authLoading]);

  // Request Fullscreen Mode helper
  const enterFullscreen = () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowStartOverlay(false);
    } catch (err) {
      console.warn("Fullscreen request rejected:", err);
    }
  };

  // Fullscreen event listener
  useEffect(() => {
    if (!activeTest || testResult) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [activeTest, testResult]);

  // Prevent accidental page refresh / back navigation
  useEffect(() => {
    if (!activeTest || testResult) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to exit the exam? Your progress will be lost.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeTest, testResult]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!activeTest || testResult || showStartOverlay) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTest, testResult, showStartOverlay]);

  const handleAutoSubmit = () => {
    toast.warning("Time is up! Submitting your exam paper automatically.");
    submitPaper();
  };

  const submitPaper = () => {
    let score = 0;
    questions.forEach((q: any, idx: number) => {
      const selected = selectedAnswers[idx];
      const correctIdx = getCorrectAnswerIndex(q);
      if (selected !== undefined && Number(selected) === Number(correctIdx)) {
        score += 1;
      }
    });

    const totalDuration = activeTest?.duration ? (parseInt(activeTest.duration) * 60 || 600) : 600;
    const newResult = {
      score,
      total: questions.length,
      timeTaken: totalDuration - timerSeconds,
    };
    setTestResult(newResult);

    // Save score to local score history
    const historyItem = {
      testTitle: activeTest.title,
      score,
      total: questions.length,
      date: new Date().toLocaleDateString(),
    };
    try {
      const stored = localStorage.getItem(`scores_${activeTest.exam_id}`);
      const history = stored ? JSON.parse(stored) : [];
      const updatedHistory = [historyItem, ...history].slice(0, 5);
      localStorage.setItem(`scores_${activeTest.exam_id}`, JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Failed to save score history:", e);
    }

    // Exit Fullscreen Mode
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.warn(err));
    }
    toast.success("Exam paper submitted successfully!");
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-center">
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <h2 className="text-xl font-bold font-display text-foreground">Preparing Exam Portal...</h2>
          <p className="text-xs text-muted-foreground">Loading questions and materials securely.</p>
        </div>
      </div>
    );
  }

  if (!activeTest) return null;

  // Render Result Page (inside normal SiteLayout container)
  if (testResult) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-lg text-center flex flex-col items-center animate-fade-in text-xs sm:text-sm">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-green-500/10 text-green-500 mb-4 animate-bounce">
              <Trophy className="h-8 w-8" />
            </span>

            <h3 className="text-2xl sm:text-3xl font-display font-bold">
              Practice Test Completed!
            </h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm">
              Great job completing the mock practice test. Here is a breakdown of your score:
            </p>

            {/* Score Big Display */}
            <div className="mt-8 flex gap-6 sm:gap-10 justify-center">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-extrabold text-primary font-display font-mono">
                  {testResult.score} / {testResult.total}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold tracking-wider">
                  Score
                </div>
              </div>
              <div className="w-[1px] bg-border" />
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-extrabold text-gold font-display font-mono">
                  {testResult.total > 0 ? Math.round((testResult.score / testResult.total) * 100) : 0}%
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold tracking-wider">
                  Accuracy
                </div>
              </div>
              <div className="w-[1px] bg-border" />
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-extrabold text-foreground font-display font-mono">
                  {Math.floor(testResult.timeTaken / 60)}:
                  {(testResult.timeTaken % 60).toString().padStart(2, "0")}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold tracking-wider">
                  Time Taken
                </div>
              </div>
            </div>

            {/* Review explanations list */}
            <div className="w-full mt-10 text-left space-y-4 max-h-[350px] overflow-y-auto pr-2 border-t border-border pt-6 text-xs scrollbar-thin">
              <h4 className="font-semibold mb-3 text-sm">Review Questions & Explanations:</h4>
              {questions.map((q: any, idx: number) => {
                const selected = selectedAnswers[idx];
                const correctIdx = getCorrectAnswerIndex(q);
                const isCorrect = selected !== undefined && Number(selected) === Number(correctIdx);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${isCorrect ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-2 text-xs sm:text-sm">
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                      >
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      <span>
                        Question {idx + 1}: {q.q}
                      </span>
                    </div>
                    <div className="space-y-1.5 mt-2 text-muted-foreground pl-7 text-xs">
                      <div>
                        <strong className="text-foreground">Your Answer:</strong>{" "}
                        {selected !== undefined ? (q.o[selected] || `Option ${String.fromCharCode(65 + selected)}`) : "Not Attempted"}
                      </div>
                      <div>
                        <strong className="text-foreground">Correct Answer:</strong>{" "}
                        {correctIdx === -1
                          ? "No Answer Available"
                          : (q.o[correctIdx] || `Option ${String.fromCharCode(65 + correctIdx)}`)}
                      </div>
                      {q.exp && (
                        <div className="mt-2 bg-muted/40 p-2.5 rounded border border-border text-foreground/80 leading-relaxed font-sans text-[11px]">
                          <strong>Explanation:</strong> {q.exp}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={() => navigate({ to: `/exams` })}
              className="mt-8 px-8 h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition shadow-sm w-full sm:w-auto cursor-pointer"
            >
              Return to Exams List
            </button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // Pre-Exam Start Overlay (explaining fullscreen requirement)
  if (showStartOverlay) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#f8f9fa] dark:bg-[#0b0f19] px-4 select-none">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mx-auto animate-pulse">
            <Play className="h-8 w-8 ml-0.5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">{activeTest.title}</h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              Online Computer Based Test (CBT) Portal.
            </p>
          </div>

          <div className="bg-muted/40 border border-border rounded-2xl p-4 text-left text-xs text-muted-foreground space-y-2">
            <div className="font-bold text-foreground mb-1 uppercase tracking-wider text-[10px]">Portal Guidelines:</div>
            <div className="flex gap-2">
              <span>•</span>
              <span>This exam will run in **Fullscreen Mode** for security and integrity.</span>
            </div>
            <div className="flex gap-2">
              <span>•</span>
              <span>Exiting fullscreen mode during the test will trigger security warnings.</span>
            </div>
            <div className="flex gap-2">
              <span>•</span>
              <span>Do not refresh, close or navigate away from the page, or the test will terminate.</span>
            </div>
            <div className="flex gap-2">
              <span>•</span>
              <span>Answers are automatically saved. You can submit at any time or let the timer run out.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center border-t border-border pt-4 text-xs font-semibold">
            <div>
              <span className="block text-muted-foreground uppercase text-[9px] tracking-wider mb-0.5">Questions</span>
              <span className="text-foreground text-sm font-bold font-mono">{questions.length} MCQs</span>
            </div>
            <div>
              <span className="block text-muted-foreground uppercase text-[9px] tracking-wider mb-0.5">Duration</span>
              <span className="text-foreground text-sm font-bold font-mono">{activeTest.duration}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/exams`}
              className="flex-1 h-11 border border-border rounded-xl font-semibold hover:bg-muted text-xs sm:text-sm flex items-center justify-center cursor-pointer"
            >
              Cancel
            </Link>
            <button
              onClick={enterFullscreen}
              className="flex-1 h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 text-xs sm:text-sm flex items-center justify-center cursor-pointer shadow-sm"
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active exam workspace
  return (
    <div className="fixed inset-0 bg-[#f8f9fa] dark:bg-[#0b0f19] z-[9999] flex flex-col select-none h-screen w-screen overflow-hidden text-xs sm:text-sm text-foreground">
      
      {/* 1. Viewport Fullscreen Warning Banner */}
      {!isFullscreen && (
        <div className="fixed inset-0 bg-background/95 z-[10000] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="max-w-md w-full bg-card border border-destructive/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4 animate-scale-in">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive mx-auto animate-bounce">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-foreground text-destructive">
                ⚠️ Fullscreen Mode Required
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                To guarantee exam integrity, this portal requires Fullscreen Mode. Please click the button below to restore fullscreen and continue your exam.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={enterFullscreen}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 text-xs sm:text-sm cursor-pointer shadow-md"
              >
                Restore Fullscreen Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Submit Warning Modal */}
      {showSubmitWarning && (
        <div className="fixed inset-0 bg-black/50 z-[10001] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4 animate-scale-in">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-foreground">
                Submit Exam Paper?
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Are you sure you want to finish and submit your exam? 
                You have answered **{Object.keys(selectedAnswers).length} of {questions.length}** questions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowSubmitWarning(false)}
                className="h-10 border border-border rounded-xl font-semibold hover:bg-muted text-xs cursor-pointer"
              >
                Cancel & Resume
              </button>
              <button
                onClick={() => {
                  setShowSubmitWarning(false);
                  submitPaper();
                }}
                className="h-10 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 text-xs cursor-pointer shadow"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Official Style Header */}
      <header className="h-14 sm:h-16 bg-primary dark:bg-card border-b border-primary-foreground/10 text-primary-foreground dark:text-foreground flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-full overflow-hidden border border-primary-foreground/20 bg-white flex items-center justify-center shrink-0">
            <img src="/logo.png" className="h-full w-full object-cover rounded-full" alt="Logo" />
          </span>
          <div>
            <span className="text-[9px] uppercase tracking-widest opacity-80 font-bold block leading-none">
              Gov Online Exam Portal
            </span>
            <h2 className="text-sm sm:text-base font-bold font-display leading-tight truncate max-w-[200px] sm:max-w-md">
              {activeTest.title}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end hidden sm:flex leading-none">
            <span className="text-[10px] text-primary-foreground/75 dark:text-muted-foreground uppercase font-bold">Candidate</span>
            <span className="text-xs font-semibold mt-0.5">{user?.name || "Candidate Profile"}</span>
          </div>
          <div className="h-8 w-px bg-primary-foreground/10 dark:bg-border hidden sm:block" />
          <div className="px-3 py-1 bg-white/10 dark:bg-destructive/10 border border-white/20 dark:border-destructive/20 text-white dark:text-destructive rounded-lg text-sm sm:text-base font-mono font-bold flex items-center gap-1.5 shrink-0 animate-pulse">
            ⏱ {Math.floor(timerSeconds / 60)}:
            {(timerSeconds % 60).toString().padStart(2, "0")}
          </div>
        </div>
      </header>

      {/* 4. Split Pane Exam Layout */}
      <div className="flex-1 grid md:grid-cols-[1fr_300px] overflow-hidden bg-background">
        
        {/* Left Workspace Panel */}
        <div className="flex flex-col h-full overflow-hidden relative border-r border-border">
          {/* Sub-Header info bar */}
          <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-4">
              <span className="text-primary font-bold">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="h-3 w-px bg-border" />
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-2 py-0.5 rounded text-[10px]">
                Marks: +1.0
              </span>
              <span className="bg-red-500/10 text-red-600 dark:text-red-500 px-2 py-0.5 rounded text-[10px]">
                Negative: 0.0
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Progress:</span>
              <div className="w-20 bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%`,
                  }}
                />
              </div>
              <span>{Math.round((Object.keys(selectedAnswers).length / questions.length) * 100)}%</span>
            </div>
          </div>

          {/* Question Display Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed mb-6 whitespace-pre-line text-foreground">
                {questions[currentQuestionIndex].q}
              </h3>

              {/* Options list */}
              <div className="space-y-3">
                {questions[currentQuestionIndex].o.map((opt: string, oIdx: number) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentQuestionIndex]: oIdx,
                        }));
                        setVisitedQuestions((prev) => {
                          const next = new Set(prev);
                          next.add(currentQuestionIndex);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition duration-200 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm text-primary"
                          : "border-border hover:bg-muted/50 hover:border-muted-foreground/35 text-foreground"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="font-semibold text-muted-foreground uppercase mr-0.5">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky footer navigation pane */}
          <footer className="h-16 bg-card border-t border-border flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-inner">
            <button
              onClick={() => {
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                setVisitedQuestions((prev) => {
                  const next = new Set(prev);
                  next.add(Math.max(0, currentQuestionIndex - 1));
                  return next;
                });
              }}
              disabled={currentQuestionIndex === 0}
              className="px-4 h-9 border border-border rounded-xl font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm transition cursor-pointer"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => prev + 1);
                    setVisitedQuestions((prev) => {
                      const next = new Set(prev);
                      next.add(currentQuestionIndex + 1);
                      return next;
                    });
                  }}
                  className="px-5 h-9 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/95 text-xs sm:text-sm transition cursor-pointer"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitWarning(true)}
                  className="px-5 h-9 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 text-xs sm:text-sm transition shadow-sm cursor-pointer"
                >
                  Submit Test
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* Right Side Sidebar (Palette & Legends) */}
        <aside className="hidden md:flex flex-col bg-muted/30 border-l border-border h-full overflow-hidden select-none shrink-0 w-[300px]">
          {/* Profile header */}
          <div className="p-4 border-b border-border bg-card flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-full border border-border overflow-hidden bg-primary/10 text-primary flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} className="h-full w-full object-cover" alt="Profile" />
              ) : (
                <span className="font-bold text-sm uppercase">{user?.name?.charAt(0) || "C"}</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-xs leading-none text-foreground truncate max-w-[180px]">
                {user?.name || "Candidate"}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">Status: Online</span>
            </div>
          </div>

          {/* Palette container */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Question Palette
            </h4>
            
            <div className="grid grid-cols-5 gap-2 pr-1 max-h-[350px] overflow-y-auto scrollbar-thin">
              {questions.map((_: any, qIdx: number) => {
                const isCurrent = qIdx === currentQuestionIndex;
                const isAnswered = selectedAnswers[qIdx] !== undefined;
                const isVisited = visitedQuestions.has(qIdx);

                let bubbleStyle = "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted";
                if (isAnswered) {
                  bubbleStyle = "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600";
                } else if (isVisited) {
                  bubbleStyle = "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20";
                }
                if (isCurrent) {
                  bubbleStyle += " ring-2 ring-primary ring-offset-2 ring-offset-background";
                }

                return (
                  <button
                    key={qIdx}
                    onClick={() => {
                      setCurrentQuestionIndex(qIdx);
                      setVisitedQuestions((prev) => {
                        const next = new Set(prev);
                        next.add(qIdx);
                        return next;
                      });
                    }}
                    className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center border cursor-pointer ${bubbleStyle}`}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend pane */}
          <div className="p-4 border-t border-border bg-card shrink-0 space-y-2">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Legend</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-emerald-500 text-[8px] font-bold text-white flex items-center justify-center shrink-0">
                  {Object.keys(selectedAnswers).length}
                </span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-red-500/20 border border-red-500/10 text-[8px] font-bold text-red-500 flex items-center justify-center shrink-0">
                  {Array.from(visitedQuestions).filter(q => selectedAnswers[q] === undefined).length}
                </span>
                <span>Skipped</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-muted text-[8px] font-bold text-muted-foreground flex items-center justify-center shrink-0">
                  {questions.length - visitedQuestions.size}
                </span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded ring-1 ring-primary flex items-center justify-center shrink-0" />
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* Footer Submit Button block */}
          <div className="p-4 border-t border-border bg-muted/10 shrink-0">
            <button
              onClick={() => setShowSubmitWarning(true)}
              className="w-full h-10 bg-gold-shine text-gold-foreground rounded-xl text-xs font-bold hover:opacity-95 transition shadow-sm cursor-pointer"
            >
              Submit Exam Paper
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

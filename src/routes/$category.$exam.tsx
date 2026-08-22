import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import type { Exam, ExamCategory } from "@/data/exams";
import { getCategory, getExam } from "@/data/exams";
import { mockQuestionsData } from "@/data/mockQuestions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  ListChecks,
  Play,
  Bell,
  HelpCircle,
  BookOpen,
  Trophy,
  Newspaper,
  Check,
  Eye,
  Calendar,
  Clock,
  Award,
  BookOpenCheck,
  Globe,
  Lock,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ScrollReveal, FloatingParticles } from "@/components/ui/animations";
import { toast } from "@/components/ui/sonner";
import {
  getSecureStudyMaterials,
  getSecurePapers,
  getSecureMockTests,
  getSecureCurrentAffairs,
  getSecureNotifications,
} from "@/lib/api";

export const Route = createFileRoute("/$category/$exam")({
  loader: async ({ params }) => {
    const cat = getCategory(params.category);
    const exam = getExam(params.category, params.exam);
    if (!cat || !exam) throw notFound();
    return { cat, exam };
  },
  head: ({ params }) => {
    const exam = getExam(params.category, params.exam);
    return {
      meta: [
        { title: exam ? `${exam.fullName} — CrackSpark` : "Exam — CrackSpark" },
        { name: "description", content: exam?.description ?? "" },
      ],
    };
  },
  component: ExamPage,
});

function ExamPage() {
  const { cat, exam } = Route.useLoaderData() as { cat: ExamCategory; exam: Exam };
  const { user, loading, bookmarks, toggleBookmark, isSubscribed, subscriptionDetails } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/user-login",
        search: {
          redirect: location.pathname,
          message: "Please login to continue.",
        },
      });
    }
  }, [user, loading, navigate, location]);

  const handlePremiumClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (subscriptionDetails?.payment_status === "pending") {
      toast.warning(
        "Your subscription is waiting for admin verification. Premium access will be enabled once your payment is approved.",
      );
    } else if (subscriptionDetails?.payment_status === "rejected") {
      toast.error(
        "Your payment verification was rejected. Please check the admin remarks and upload a valid payment screenshot.",
      );
      navigate({ to: "/subscription" });
    } else {
      toast.info("This is a Premium feature. Redirecting to subscription...");
      navigate({
        to: "/subscription",
        search: { redirect: location.pathname },
      });
    }
  };

  const bookmarkKey = `${cat.slug}/${exam.slug}`;
  const isBookmarked = bookmarks.includes(bookmarkKey);
  const isTnpsc = cat.slug === "tnpsc";
  const isUpsc = cat.slug === "upsc";
  const isSsc = cat.slug === "ssc";
  const isRrb = cat.slug === "rrb";
  const isBanking = cat.slug === "ibps" || cat.slug === "sbi";
  const isDefence = cat.slug === "defence";

  // Supabase dynamic resources state
  const [dbOfficialUrl, setDbOfficialUrl] = useState<string | null>(null);
  const [dbFaqs, setDbFaqs] = useState<{ q: string; a: string }[]>([]);
  const [dbMockTests, setDbMockTests] = useState<any[]>([]);
  const [dbPapers, setDbPapers] = useState<{ year: string; name: string; url?: string }[]>([]);
  const [dbMaterials, setDbMaterials] = useState<
    { title: string; type: string; size: string; url?: string }[]
  >([]);
  const [dbAffairs, setDbAffairs] = useState<
    {
      title: string;
      date: string;
      content?: string;
      pdf_url?: string;
      image_url?: string;
      period: string;
    }[]
  >([]);

  // Roadmap & Checklists (Supabase linked)
  const [completedWeeks, setCompletedWeeks] = useState<string[]>([]);
  const [completedRoadmapSteps, setCompletedRoadmapSteps] = useState<number[]>([]);

  // Modals & Engine
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<
    { testTitle: string; score: number; total: number; date: string }[]
  >([]);

  // Current Affairs active periodicity filter ('daily', 'weekly', 'monthly')
  const [affairsPeriod, setAffairsPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Custom banner and notifications states
  const [bannerBg, setBannerBg] = useState("");
  const [dbNotifications, setDbNotifications] = useState<
    { title: string; date: string; tag: string }[]
  >([]);

  useEffect(() => {
    async function fetchBanner() {
      try {
        const key = cat.slug === "sbi" ? "banner:ibps" : `banner:${cat.slug}`;
        console.log(`[Exam Page] Fetching custom banner for: ${key}`);
        const { data, error } = await supabase
          .from("exam_details")
          .select("official_website_url")
          .eq("exam_key", key)
          .maybeSingle();
        if (error) {
          console.error("[Exam Page] Error fetching banner:", error);
        }
        if (!error && data?.official_website_url) {
          console.log("[Exam Page] Found custom banner URL:", data.official_website_url);
          // Append cache-busting timestamp
          const busted =
            data.official_website_url +
            (data.official_website_url.includes("?") ? "&" : "?") +
            "t=" +
            Date.now();
          setBannerBg(busted);
        } else {
          // Default fallbacks
          const fallbacks: Record<string, string> = {
            upsc: "/upsc_banner.jpg",
            tnpsc: "/tnpsc_banner.jpg",
            ssc: "/ssc_banner.jpg",
            ibps: "/banking_banner.jpg",
            sbi: "/banking_banner.jpg",
            rrb: "/railways_banner.jpg",
            defence: "/hero_background.jpg",
          };
          const fallback = fallbacks[cat.slug] || "/hero_background.jpg";
          console.log("[Exam Page] No custom banner in DB, using fallback:", fallback);
          setBannerBg(fallback);
        }
      } catch (e) {
        console.warn("Failed to load custom banner:", e);
      }
    }
    async function fetchNotifs() {
      if (!user) return;
      try {
        const data = await getSecureNotifications({
          data: { categoryName: cat.name, userId: user.id },
        });
        setDbNotifications(data);
      } catch (err) {
        console.warn("Failed to load custom notifications:", err);
      }
    }
    fetchBanner();
    fetchNotifs();
  }, [cat, user]);

  useEffect(() => {
    // Load score history from local storage
    const stored = localStorage.getItem(`scores_${exam.slug}`);
    if (stored) {
      try {
        setScoreHistory(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    }
  }, [exam]);

  useEffect(() => {
    const fetchResources = async () => {
      if (!exam || !user) return;
      try {
        console.log(
          `[Exam Page Fetch] Loading resources securely for exam: "${exam.slug}" / "${exam.fullName}"...`,
        );

        // Clean up any default seeded files from the database
        try {
          await Promise.all([
            supabase.from("study_materials").delete().eq("pdf_url", "/placeholder.pdf"),
            supabase.from("previous_papers").delete().eq("pdf_url", "/placeholder.pdf"),
            supabase.from("current_affairs").delete().eq("pdf_url", "/placeholder.pdf"),
          ]);
        } catch (cleanupErr) {
          console.warn("Database cleanup of default PDFs failed:", cleanupErr);
        }

        // 1. Official website URL
        const { data: dbDetails, error: detailsErr } = await supabase
          .from("exam_details")
          .select("official_website_url")
          .eq("exam_key", exam.slug)
          .maybeSingle();

        if (detailsErr) {
          console.error(
            `[Exam Page Fetch] Error fetching official website URL for ${exam.slug}:`,
            detailsErr,
          );
        }

        if (dbDetails?.official_website_url) {
          setDbOfficialUrl(dbDetails.official_website_url);
        } else {
          await supabase.from("exam_details").upsert({
            exam_key: exam.slug,
            official_website_url: exam.officialUrl,
          });
          setDbOfficialUrl(exam.officialUrl);
        }

        const { data: dbFaqDataResult, error: faqErr } = await supabase
          .from("faqs")
          .select("question, answer, category")
          .eq("exam_id", exam.slug);
        let dbFaqData = dbFaqDataResult;

        if (!dbFaqData || dbFaqData.length === 0) {
          const defaultFaqs = exam.faq.map((f) => ({
            exam_id: exam.slug,
            question: f.q,
            answer: f.a,
            category: cat.name,
          }));
          await supabase.from("faqs").insert(defaultFaqs);
          const { data } = await supabase
            .from("faqs")
            .select("question, answer, category")
            .eq("exam_id", exam.slug);
          dbFaqData = data;
        }
        if (dbFaqData) {
          setDbFaqs(dbFaqData.map((f: any) => ({ q: f.question, a: f.answer })));
        }

        // 3. Mock Tests (Secure backend API)
        try {
          const mocks = await getSecureMockTests({
            data: { examId: exam.slug, userId: user.id },
          });
          setDbMockTests(mocks || []);
        } catch (err) {
          console.error("Mock tests fetch failed:", err);
          setDbMockTests([]);
        }

        // 4. Previous Year Papers (Secure backend API)
        try {
          const papers = await getSecurePapers({
            data: { examFullName: exam.fullName, userId: user.id },
          });
          setDbPapers(papers || []);
        } catch (err) {
          console.error("Papers fetch failed:", err);
          setDbPapers([]);
        }

        // 5. Study Materials (Secure backend API)
        try {
          const materials = await getSecureStudyMaterials({
            data: { examId: exam.slug, userId: user.id },
          });
          setDbMaterials(materials || []);
        } catch (err) {
          console.error("Study materials fetch failed:", err);
          setDbMaterials([]);
        }

        // 6. Current Affairs (Secure backend API)
        try {
          const affairs = await getSecureCurrentAffairs({
            data: { categoryName: cat.name, userId: user.id },
          });
          setDbAffairs(affairs || []);
        } catch (err) {
          console.error("Current affairs fetch failed:", err);
          setDbAffairs([]);
        }
      } catch (err) {
        console.error("[Exam Page Fetch] Critical error loading resources:", err);
      }
    };

    fetchResources();
  }, [exam, cat, user]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setCompletedWeeks([]);
        setCompletedRoadmapSteps([]);
        return;
      }
      try {
        const { data: dbWeeks, error: errWeeks } = await supabase
          .from("weekly_progress")
          .select("week_name")
          .eq("user_id", user.id)
          .eq("exam_id", exam.slug);

        if (!errWeeks && dbWeeks) {
          setCompletedWeeks(dbWeeks.map((w: any) => w.week_name));
        }

        const { data: dbSteps, error: errSteps } = await supabase
          .from("roadmap_progress")
          .select("step_number")
          .eq("user_id", user.id)
          .eq("exam_id", exam.slug);

        if (!errSteps && dbSteps) {
          setCompletedRoadmapSteps(dbSteps.map((s: any) => s.step_number));
        }
      } catch (e) {
        console.warn("Failed to fetch progress from Supabase:", e);
      }
    };
    fetchProgress();
  }, [exam, user]);

  const examLogoMap: Record<string, string> = {
    upsc: "/upsc_watermark.jpeg",
    ssc: "/ssc_watermark.jpeg",
    rrb: "/rrb_watermark.jpeg",
    ibps: "/banking_watermark.jpeg",
    sbi: "/banking_watermark.jpeg",
    tnpsc: "/tnpsc_watermark.png",
    defence: "/defence_watermark.jpeg",
  };

  const officialWebsiteUrl = dbOfficialUrl || exam.officialUrl;
  const displayedFaqs = dbFaqs.length > 0 ? [...dbFaqs, ...exam.faq] : exam.faq;

  const displayedMockTests: {
    id: string;
    title: string;
    questions: number;
    duration: string;
    isLocked?: boolean;
  }[] = dbMockTests;

  const displayedMaterials: {
    title: string;
    type: string;
    size: string;
    url?: string;
    isLocked?: boolean;
  }[] =
    dbMaterials.length > 0
      ? dbMaterials
      : exam.materials.map((m) => ({
          ...m,
          url: m.url || "/placeholder.pdf",
        }));

  const displayedPapers: { year: string; name: string; url?: string; isLocked?: boolean }[] =
    dbPapers.length > 0
      ? dbPapers
      : exam.previousPapers.map((p) => ({
          ...p,
          url: p.url || "/placeholder.pdf",
        }));

  const displayedAffairs: {
    title: string;
    date: string;
    content?: string;
    pdf_url?: string;
    image_url?: string;
    period: string;
    isLocked?: boolean;
  }[] = dbAffairs;

  const displayedNotifications: { title: string; date: string; tag: string; isLocked?: boolean }[] =
    dbNotifications.length > 0
      ? dbNotifications.map((n, idx) => ({ ...n, isLocked: !isSubscribed && idx >= 3 }))
      : exam.notifications.map((n, idx) => ({ ...n, isLocked: !isSubscribed && idx >= 3 }));

  // Progress Calculations
  const roadmapStepsCount = 8;
  const progressPercent = Math.round((completedRoadmapSteps.length / roadmapStepsCount) * 100);

  const toggleWeek = async (week: string) => {
    if (!user) return;
    const isCompleted = completedWeeks.includes(week);
    const next = isCompleted ? completedWeeks.filter((w) => w !== week) : [...completedWeeks, week];
    setCompletedWeeks(next);
    try {
      if (isCompleted) {
        await supabase
          .from("weekly_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("exam_id", exam.slug)
          .eq("week_name", week);
      } else {
        await supabase
          .from("weekly_progress")
          .insert({ user_id: user.id, exam_id: exam.slug, week_name: week });
      }
    } catch (err) {
      console.warn("Failed to sync weekly progress:", err);
    }
  };

  const toggleRoadmapStep = async (stepNum: number) => {
    if (!user) return;
    const isCompleted = completedRoadmapSteps.includes(stepNum);
    const next = isCompleted
      ? completedRoadmapSteps.filter((s) => s !== stepNum)
      : [...completedRoadmapSteps, stepNum];
    setCompletedRoadmapSteps(next);
    try {
      if (isCompleted) {
        await supabase
          .from("roadmap_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("exam_id", exam.slug)
          .eq("step_number", stepNum);
      } else {
        await supabase
          .from("roadmap_progress")
          .insert({ user_id: user.id, exam_id: exam.slug, step_number: stepNum });
      }
    } catch (err) {
      console.warn("Failed to sync roadmap progress:", err);
    }
  };

  if (!user) return null;

  return (
    <SiteLayout>
      {/* 1. EXAM IDENTITY & LOGO HERO */}
      <section
        className="relative text-white overflow-hidden bg-cover bg-center border-b border-slate-200 dark:border-slate-800"
        style={{ backgroundImage: `url('${bannerBg}')` }}
      >
        {/* Dark gradient overlay for readability and depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/75 backdrop-blur-[1px]" />
        <FloatingParticles color="rgba(249, 115, 22, 0.08)" count={25} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 relative z-10">
          <nav className="text-xs text-white/60 flex items-center gap-1.5 mb-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-white/40" />
            <Link to="/$category" params={{ category: cat.slug }} className="hover:text-white transition-colors">
              {cat.name}
            </Link>
            <ChevronRight className="h-3 w-3 text-white/40" />
            <span className="text-orange-400 font-semibold">{exam.name}</span>
          </nav>

          <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
            {/* EXAM LOGO / EMBLEM CONTAINER */}
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border-2 border-white/20 dark:border-white/10 shadow-xl flex items-center justify-center p-3 shrink-0 overflow-hidden backdrop-blur-md">
              <img
                src={examLogoMap[cat.slug] || "/logo.png"}
                alt={`${exam.name} Official Logo`}
                className="h-full w-full object-contain rounded-xl"
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
              />
            </div>

            {/* EXAM TITLE & INFO */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm text-orange-300">
                <GraduationCap className="h-3.5 w-3.5" /> {cat.fullName}
              </div>
              <h1 className="mt-3 font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {exam.fullName}
              </h1>
              <div className="mt-1.5 text-xs sm:text-sm font-semibold text-orange-400">
                {cat.name} • {exam.name}
              </div>
              <p className="mt-3 max-w-2xl text-slate-200/90 text-xs sm:text-sm leading-relaxed font-normal">
                {exam.description}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-3 lg:w-56 text-xs sm:text-sm shrink-0">
              <a
                href={officialWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25 transition h-11 font-bold cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" /> Official Website
              </a>
              <button
                onClick={(e) => {
                  if (!isSubscribed) {
                    handlePremiumClick(e);
                  } else {
                    toggleBookmark(bookmarkKey);
                  }
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 font-semibold border transition backdrop-blur-sm cursor-pointer ${
                  isBookmarked
                    ? "bg-white text-orange-600 border-white shadow-sm"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-orange-600" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" /> Bookmark Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DIRECT PDF RESOURCES & STUDY WORKSPACE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* A. STUDY MATERIAL PDFS */}
        {displayedMaterials.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-1">
                  <FileText className="h-3.5 w-3.5" /> Official Syllabus & Notes
                </div>
                <h2 className="text-xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Study Material
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {displayedMaterials.length} documents available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {displayedMaterials.map((m, idx) => {
                const isLocked = m.isLocked;
                const fileUrl = m.url || "/placeholder.pdf";
                const isDocx = fileUrl.toLowerCase().endsWith(".docx");
                const docTitle = m.title.endsWith(".pdf") || m.title.endsWith(".docx") ? m.title : `${m.title}.pdf`;

                return (
                  <a
                    key={idx}
                    href={isLocked ? "#" : fileUrl}
                    target={isLocked ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (isLocked) {
                        handlePremiumClick(e);
                      }
                    }}
                    className={cn(
                      "group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-orange-400 dark:hover:border-orange-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden",
                      isLocked && "hover:border-amber-500/50"
                    )}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      {/* Orange PDF/Doc Icon */}
                      <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-200 shadow-2xs">
                        <FileText className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                            {docTitle}
                          </h4>
                          {isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold shrink-0">
                              <Star className="h-2.5 w-2.5 fill-current text-amber-500" /> PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>{isDocx ? "DOCX" : "PDF"} • Study Material</span>
                          {m.size && <span>• {m.size}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-2">
                      {isLocked ? (
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <Lock className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white text-xs font-bold transition-colors">
                          <span>Open {isDocx ? "DOCX" : "PDF"}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* B. PREVIOUS YEAR QUESTION PAPERS PDFS */}
        {displayedPapers.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-1">
                  <Newspaper className="h-3.5 w-3.5" /> Solved Past Year Papers
                </div>
                <h2 className="text-xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Previous Year Question Papers
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {displayedPapers.length} papers available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {displayedPapers.map((p, idx) => {
                const isLocked = p.isLocked;
                const fileUrl = p.url || "/placeholder.pdf";
                const isDocx = fileUrl.toLowerCase().endsWith(".docx");
                const docTitle = p.name.endsWith(".pdf") || p.name.endsWith(".docx") ? p.name : `${p.name}.pdf`;

                return (
                  <a
                    key={idx}
                    href={isLocked ? "#" : fileUrl}
                    target={isLocked ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (isLocked) {
                        handlePremiumClick(e);
                      }
                    }}
                    className={cn(
                      "group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-orange-400 dark:hover:border-orange-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden",
                      isLocked && "hover:border-amber-500/50"
                    )}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      {/* Orange PDF/Doc Icon */}
                      <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-200 shadow-2xs">
                        <FileText className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                            {docTitle}
                          </h4>
                          {isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold shrink-0">
                              <Star className="h-2.5 w-2.5 fill-current text-amber-500" /> PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>{isDocx ? "DOCX" : "PDF"} • Previous Year Paper</span>
                          {p.year && (
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                              • Year {p.year}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-2">
                      {isLocked ? (
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <Lock className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white text-xs font-bold transition-colors">
                          <span>Open {isDocx ? "DOCX" : "PDF"}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* C. MOCK TESTS SECTION */}
        {displayedMockTests.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-1">
                  <Play className="h-3.5 w-3.5 fill-current" /> Live Practice Engine
                </div>
                <h2 className="text-xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Mock Tests
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {displayedMockTests.length} tests available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {displayedMockTests.map((t, idx) => {
                const isLocked = t.isLocked;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-orange-400 dark:hover:border-orange-500/50 hover:-translate-y-0.5 transition-all duration-200",
                      isLocked && "hover:border-amber-500/50"
                    )}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-200 shadow-2xs">
                        <Play className="h-6 w-6 fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
                            {t.title}
                          </h4>
                          {isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold shrink-0">
                              <Star className="h-2.5 w-2.5 fill-current text-amber-500" /> PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>⏱ {t.duration}</span>
                          <span>• 📝 {t.questions} Questions</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        if (isLocked) {
                          handlePremiumClick(e);
                        } else {
                          navigate({
                            to: "/mock-test/$testId/exam",
                            params: { testId: t.id },
                          });
                        }
                      }}
                      className={cn(
                        "h-9 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer",
                        isLocked
                          ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25"
                      )}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Locked
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" /> Start Test
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* D. CURRENT AFFAIRS SECTION */}
        {displayedAffairs.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-1">
                  <Globe className="h-3.5 w-3.5" /> Exam-Specific Digest
                </div>
                <h2 className="text-xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Current Affairs
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {displayedAffairs.length} capsules available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {displayedAffairs.map((a, idx) => {
                const isLocked = a.isLocked;
                const fileUrl = a.pdf_url || "/placeholder.pdf";
                return (
                  <a
                    key={idx}
                    href={isLocked ? "#" : fileUrl}
                    target={isLocked ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (isLocked) {
                        handlePremiumClick(e);
                      }
                    }}
                    className={cn(
                      "group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-orange-400 dark:hover:border-orange-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden",
                      isLocked && "hover:border-amber-500/50"
                    )}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-200 shadow-2xs">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                            {a.title}
                          </h4>
                          {isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold shrink-0">
                              <Star className="h-2.5 w-2.5 fill-current text-amber-500" /> PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>{a.date}</span>
                          {a.period && <span className="uppercase font-bold text-orange-600">• {a.period}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-2">
                      {isLocked ? (
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <Lock className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white text-xs font-bold transition-colors">
                          <span>Open PDF</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* E. INTERACTIVE STUDY ROADMAP & MILESTONES */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-5 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/80 dark:border-orange-800/60">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Study Roadmap & Readiness Score
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Week-by-week structured preparation milestone tracker designed by top rankers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Readiness</div>
                <div className="text-xl font-display font-black text-orange-500">{progressPercent}%</div>
              </div>
              <button
                onClick={() => setRoadmapModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition cursor-pointer"
              >
                Track Milestones <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {exam.studyPlan.map((s, idx) => {
              const isDone = completedWeeks.includes(s.week);
              return (
                <button
                  key={s.week}
                  onClick={() => toggleWeek(s.week)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between min-h-[90px] transition cursor-pointer ${
                    isDone
                      ? "border-orange-400 bg-orange-50/70 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 shadow-2xs"
                      : "border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">{s.week}</span>
                    <span className={`h-4 w-4 rounded-full border text-[10px] flex items-center justify-center font-bold ${isDone ? "bg-orange-500 border-orange-500 text-white" : "border-slate-300 dark:border-slate-700 text-transparent"}`}>
                      ✓
                    </span>
                  </div>
                  <span className="text-xs font-semibold line-clamp-2 mt-2 leading-snug">{s.focus}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* F. EXAM PATTERN & SYLLABUS DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Examination Stages
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
                Pattern & Stages
              </h3>
              <div className="space-y-3">
                {exam.pattern.map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-bold shrink-0">
                      {p.stage}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {p.details}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Core Curriculum
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
                Syllabus Breakdown
              </h3>
              <div className="space-y-2.5">
                {exam.syllabus.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAQ ACCORDION DISPLAY */}
      {displayedFaqs.length > 0 && (
        <section id="faq-section" className="mx-auto max-w-4xl px-4 sm:px-6 pb-20 pt-4">
          <div className="border-t border-slate-200/90 dark:border-slate-800 pt-10">
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold mb-6 text-center text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {displayedFaqs.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-5 open:bg-slate-50/50 dark:open:bg-slate-900/50 transition duration-300 shadow-2xs"
                >
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-bold text-sm select-none text-slate-900 dark:text-white">
                    <span>{f.q}</span>
                    <ChevronRight className="h-4 w-4 mt-1 text-orange-500 transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. INTERACTIVE STUDY ROADMAP MODAL */}
      {roadmapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl w-full max-w-xl p-6 shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Interactive Study Roadmap</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Toggle completed steps and weekly progress schedules.
                </p>
              </div>
              <button
                onClick={() => setRoadmapModalOpen(false)}
                className="h-8 w-8 grid place-items-center hover:bg-muted rounded-full text-muted-foreground font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Weeks list */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-primary mb-2">
                  Weekly Checkpoints
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {exam.studyPlan.map((s) => {
                    const isDone = completedWeeks.includes(s.week);
                    return (
                      <button
                        key={s.week}
                        onClick={() => toggleWeek(s.week)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition cursor-pointer ${
                          isDone
                            ? "border-primary/30 bg-primary/5 text-primary"
                            : "border-border bg-muted/10 text-muted-foreground hover:border-primary/20"
                        }`}
                      >
                        <span className="font-mono text-[9px] font-bold">{s.week}</span>
                        <span className="text-[10px] font-bold line-clamp-1">{s.focus}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Steps list */}
              <div className="border-t border-border pt-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-primary mb-3">
                  Roadmap Milestones
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      step: 1,
                      title: "Understand Exam Pattern",
                      desc: "Analyze syllabus depth and mark allocations.",
                    },
                    {
                      step: 2,
                      title: "Accumulate Reference Materials",
                      desc: "Gather standard textbook notes and files.",
                    },
                    {
                      step: 3,
                      title: "Solve Past Year Papers",
                      desc: "Solve minimum 5 original previous years documents.",
                    },
                    {
                      step: 4,
                      title: "Formulate Study Routine",
                      desc: "Create calendar schedules and hours planner logs.",
                    },
                    {
                      step: 5,
                      title: "Mock Test Practice Sprints",
                      desc: "Initiate daily MCQs solving and weekly testing.",
                    },
                    {
                      step: 6,
                      title: "Subject Sprints & Revisions",
                      desc: "Consolidate study hours on weak topics.",
                    },
                    {
                      step: 7,
                      title: "Admit Card & Registration",
                      desc: "Verify dates, centres and download admit cards.",
                    },
                    {
                      step: 8,
                      title: "Final Boarding Assessment",
                      desc: "Take core simulation full mocks before exam day.",
                    },
                  ].map((item) => {
                    const isDone = completedRoadmapSteps.includes(item.step);
                    return (
                      <div
                        key={item.step}
                        onClick={() => toggleRoadmapStep(item.step)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition ${
                          isDone
                            ? "border-primary/20 bg-primary/5"
                            : "border-border bg-muted/10 hover:bg-muted/15"
                        }`}
                      >
                        <div className="min-w-0">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            Step {item.step}
                          </span>
                          <div
                            className={`font-semibold mt-1 ${isDone && "line-through text-muted-foreground"}`}
                          >
                            {item.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                            isDone
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

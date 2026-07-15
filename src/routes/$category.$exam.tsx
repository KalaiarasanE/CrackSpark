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
  getSecureNotifications
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
      toast.warning("Your subscription is waiting for admin verification. Premium access will be enabled once your payment is approved.");
    } else if (subscriptionDetails?.payment_status === "rejected") {
      toast.error("Your payment verification was rejected. Please check the admin remarks and upload a valid payment screenshot.");
      navigate({ to: "/subscription" });
    } else {
      toast.info("This is a Premium feature. Redirecting to subscription...");
      navigate({
        to: "/subscription",
        search: { redirect: location.pathname }
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
  const [dbNotifications, setDbNotifications] = useState<{ title: string; date: string; tag: string }[]>([]);

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
          const busted = data.official_website_url + (data.official_website_url.includes('?') ? '&' : '?') + 't=' + Date.now();
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
          data: { categoryName: cat.name, userId: user.id }
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
        console.log(`[Exam Page Fetch] Loading resources securely for exam: "${exam.slug}" / "${exam.fullName}"...`);

        // Clean up any default seeded files from the database
        try {
          await Promise.all([
            supabase.from("study_materials").delete().eq("pdf_url", "/placeholder.pdf"),
            supabase.from("previous_papers").delete().eq("pdf_url", "/placeholder.pdf"),
            supabase.from("current_affairs").delete().eq("pdf_url", "/placeholder.pdf")
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
          console.error(`[Exam Page Fetch] Error fetching official website URL for ${exam.slug}:`, detailsErr);
        }

        if (dbDetails?.official_website_url) {
          setDbOfficialUrl(dbDetails.official_website_url);
        } else {
          await supabase.from("exam_details").upsert({
            exam_key: exam.slug,
            official_website_url: exam.officialUrl
          });
          setDbOfficialUrl(exam.officialUrl);
        }

        const { data: dbFaqDataResult, error: faqErr } = await supabase
          .from("faqs")
          .select("question, answer, category")
          .eq("exam_id", exam.slug);
        let dbFaqData = dbFaqDataResult;

        if (!dbFaqData || dbFaqData.length === 0) {
          const defaultFaqs = exam.faq.map(f => ({
            exam_id: exam.slug,
            question: f.q,
            answer: f.a,
            category: cat.name
          }));
          await supabase.from("faqs").insert(defaultFaqs);
          const { data } = await supabase.from("faqs").select("question, answer, category").eq("exam_id", exam.slug);
          dbFaqData = data;
        }
        if (dbFaqData) {
          setDbFaqs(dbFaqData.map((f: any) => ({ q: f.question, a: f.answer })));
        }

        // 3. Mock Tests (Secure backend API)
        try {
          const mocks = await getSecureMockTests({
            data: { examId: exam.slug, userId: user.id }
          });
          setDbMockTests(mocks || []);
        } catch (err) {
          console.error("Mock tests fetch failed:", err);
          setDbMockTests([]);
        }

        // 4. Previous Year Papers (Secure backend API)
        try {
          const papers = await getSecurePapers({
            data: { examFullName: exam.fullName, userId: user.id }
          });
          setDbPapers(papers || []);
        } catch (err) {
          console.error("Papers fetch failed:", err);
          setDbPapers([]);
        }

        // 5. Study Materials (Secure backend API)
        try {
          const materials = await getSecureStudyMaterials({
            data: { examId: exam.slug, userId: user.id }
          });
          setDbMaterials(materials || []);
        } catch (err) {
          console.error("Study materials fetch failed:", err);
          setDbMaterials([]);
        }

        // 6. Current Affairs (Secure backend API)
        try {
          const affairs = await getSecureCurrentAffairs({
            data: { categoryName: cat.name, userId: user.id }
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

  const officialWebsiteUrl = dbOfficialUrl || exam.officialUrl;
  const displayedFaqs = dbFaqs.length > 0 ? [...dbFaqs, ...exam.faq] : exam.faq;
  
  const displayedMockTests: { id: string; title: string; questions: number; duration: string; isLocked?: boolean }[] = dbMockTests;

  const displayedMaterials: { title: string; type: string; size: string; url?: string; isLocked?: boolean }[] = dbMaterials;

  const displayedPapers: { year: string; name: string; url?: string; isLocked?: boolean }[] = dbPapers;

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
      {/* 1. HERO SECTION */}
      <section
        className="relative text-white overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('${bannerBg}')` }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[0.5px]" />
        <FloatingParticles color="rgba(255, 255, 255, 0.06)" count={25} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 relative z-10">
          <nav className="text-xs text-white/60 flex items-center gap-1 mb-6">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/$category" params={{ category: cat.slug }} className="hover:text-white">
              {cat.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{exam.name}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <GraduationCap className="h-3.5 w-3.5 text-gold" /> {cat.fullName}
              </div>
              <h1 className="mt-5 font-display text-3xl sm:text-5xl font-bold">{exam.fullName}</h1>
              <div className="mt-1 text-sm text-gold font-medium">
                {cat.name} • {exam.name}
              </div>
              <p className="mt-4 max-w-2xl text-white/75 text-xs sm:text-sm">{exam.description}</p>
            </div>

            <div className="flex flex-wrap gap-3 lg:flex-col lg:w-56 text-xs sm:text-sm">
              <a
                href={officialWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/95 transition h-11 font-bold"
              >
                <ExternalLink className="h-4 w-4" /> Visit Official Website
              </a>
              <button
                onClick={(e) => {
                  if (!isSubscribed) {
                    handlePremiumClick(e);
                  } else {
                    toggleBookmark(bookmarkKey);
                  }
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 font-semibold border transition ${isBookmarked ? "bg-white text-primary border-white" : "border-white/30 hover:bg-white/10"}`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" /> Bookmark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NINE-CARD DASHBOARD GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* CARD 1: 📚 STUDY ROADMAP */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Study Road Map</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Preparation Tracker
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                Streamline your exam preparation with a complete week-by-week step progress system designed by toppers.
              </p>

              {/* Progress bar */}
              <div className="bg-muted/40 p-4 border border-border rounded-xl mb-4">
                <div className="flex justify-between items-center text-xs font-bold text-foreground mb-1.5">
                  <span>Readiness Score</span>
                  <span className="text-primary font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setRoadmapModalOpen(true)}
              className="w-full inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition shadow-sm relative z-10"
            >
              Interactive Tracker <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* CARD 2: 📖 STUDY MATERIALS */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Study Materials</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Notes & Syllabus PDFs
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Subject-wise summaries, toppers study notes, and syllabus references.
              </p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                {displayedMaterials.map((m, idx) => {
                  const isLocked = m.isLocked;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => {
                        if (isLocked) {
                          handlePremiumClick(e);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-border/70 transition-all duration-200 text-xs",
                        isLocked && "cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/15 hover:border-amber-500/30"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="font-semibold truncate text-foreground">{m.title}</div>
                          {isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-bold shrink-0">
                              <Star className="h-2 w-2 fill-current text-amber-500" /> PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">
                          {m.type} • {m.size}
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        {isLocked ? (
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          m.url && (
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-200 shadow-sm"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
                {displayedMaterials.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-muted-foreground">
                    No study documents available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 3: 📄 PREVIOUS YEAR PAPERS */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Previous Year Papers</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Solved Papers
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Practice official previous year questions to master core exam trends.
              </p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                {displayedPapers.map((p, idx) => {
                  const isLocked = p.isLocked;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => {
                        if (isLocked) {
                          handlePremiumClick(e);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-border/70 transition-all duration-200 text-xs",
                        isLocked && "cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/15 hover:border-amber-500/30"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="font-semibold truncate text-foreground">{p.name}</div>
                          {isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-bold shrink-0">
                              <Star className="h-2 w-2 fill-current text-amber-500" /> PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-primary font-bold uppercase mt-0.5">
                          Year: {p.year}
                        </div>
                      </div>
                      <div className="shrink-0 ml-3">
                        {isLocked ? (
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-200 shadow-sm"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
                {displayedPapers.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-muted-foreground">
                    No previous papers available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 4: 📝 MOCK TESTS */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <Play className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Mock Tests</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Practice Engine
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
                  {displayedMockTests.map((t, idx) => {
                    const isLocked = t.isLocked;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 bg-muted/20 border border-border/50 rounded-xl flex items-center justify-between gap-2",
                          isLocked && "hover:bg-amber-500/5 hover:border-amber-500/20"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="text-xs font-semibold truncate">{t.title}</div>
                            {isLocked && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-bold shrink-0">
                                <Star className="h-2 w-2 fill-current text-amber-500" /> PRO
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">
                            ⏱ {t.duration} • 📝 {t.questions} Qs
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            if (isLocked) {
                              handlePremiumClick(e);
                            } else {
                              navigate({
                                to: "/mock-test/$testId/exam",
                                params: { testId: t.id }
                              });
                            }
                          }}
                          className={cn(
                            "h-7 px-2.5 rounded text-[10px] font-bold transition flex items-center gap-1.5 shrink-0",
                            isLocked
                              ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                              : "bg-primary text-primary-foreground hover:bg-primary/95"
                          )}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="h-2.5 w-2.5" /> Locked
                            </>
                          ) : (
                            <>
                              <Play className="h-2.5 w-2.5 fill-current" /> Start
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                  {displayedMockTests.length === 0 && (
                    <div className="text-center py-4 text-[11px] text-muted-foreground">
                      No mock tests configured.
                    </div>
                  )}
                </div>

                {/* Score History */}
                {scoreHistory.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Score History:
                    </div>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {scoreHistory.map((sh, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex justify-between items-center text-[10px] text-muted-foreground bg-muted/40 p-1.5 rounded border border-border/40"
                        >
                          <span className="truncate max-w-[120px] font-semibold text-foreground">
                            {sh.testTitle}
                          </span>
                          <span className="font-mono font-bold text-primary">
                            {sh.score} / {sh.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 5: 📰 CURRENT AFFAIRS */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Current Affairs</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Daily/Weekly/Monthly
                  </div>
                </div>
              </div>

              {/* Period Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-lg text-[10px] font-bold mb-3">
                {(["daily", "weekly", "monthly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setAffairsPeriod(p)}
                    className={`py-1.5 rounded uppercase tracking-wider transition ${affairsPeriod === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Filtering affairs list */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                {displayedAffairs
                  .filter((a) => a.period === affairsPeriod)
                  .map((a, idx) => {
                    const isLocked = a.isLocked;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs",
                          isLocked && "hover:bg-amber-500/5 hover:border-amber-500/20"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="font-semibold text-foreground truncate">{a.title}</div>
                          {isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-bold shrink-0">
                              <Star className="h-2 w-2 fill-current text-amber-500" /> PRO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {a.date}
                          </span>
                          {isLocked ? (
                            <button
                              onClick={(e) => handlePremiumClick(e)}
                              className="text-[9px] text-amber-600 font-bold hover:underline flex items-center gap-0.5"
                            >
                              <Lock className="h-2.5 w-2.5" /> Locked
                            </button>
                          ) : (
                            a.pdf_url && (
                              <a
                                href={a.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-primary font-bold hover:underline flex items-center gap-0.5"
                              >
                                <Download className="h-2.5 w-2.5" /> PDF
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                {displayedAffairs.filter((a) => a.period === affairsPeriod).length === 0 && (
                  <div className="text-center py-4 text-[11px] text-muted-foreground">
                    No current affairs for this category.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 6: 🔔 LATEST NOTIFICATIONS */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Latest Notifications</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Recruitments & News
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Active notifications, dates, and details for this exam.
              </p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                {displayedNotifications.map((n, idx) => {
                  const isLocked = n.isLocked;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs",
                        isLocked && "hover:bg-amber-500/5 hover:border-amber-500/20"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="font-semibold text-foreground truncate">{n.title}</div>
                        {isLocked && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-bold shrink-0">
                            <Star className="h-2 w-2 fill-current text-amber-500" /> PRO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {n.date}
                        </span>
                        {isLocked ? (
                          <button
                            onClick={() => {
                              navigate({
                                to: "/subscription",
                                search: { redirect: location.pathname }
                              });
                              toast.info("This is a Premium feature. Redirecting to subscription...");
                            }}
                            className="text-[9px] text-amber-600 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Lock className="h-2.5 w-2.5" /> Locked
                          </button>
                        ) : (
                          <span className="text-[9px] text-primary font-bold uppercase">
                            {n.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {displayedNotifications.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-muted-foreground">
                    No notifications listed.
                  </div>
                )}
              </div>
            </div>

            <Link
              to="/notifications"
              className="w-full inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition relative z-10"
            >
              All Notifications
            </Link>
          </div>

          {/* CARD 7: ❓ FAQ PREVIEW */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Frequently Asked Qs</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    FAQ Overview
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Quick answers to eligibility, age criteria, exam process, and documents.
              </p>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {displayedFaqs.slice(0, 2).map((f, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs font-semibold"
                  >
                    <div className="text-foreground truncate">{f.q}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const element = document.getElementById("faq-section");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-full inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition relative z-10"
            >
              Browse FAQs
            </button>
          </div>

          {/* CARD 8: 🔖 BOOKMARK EXAM */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  {isBookmarked ? (
                    <BookmarkCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Bookmark Exam</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Aspirant Workspace
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                {isBookmarked
                  ? "This exam is saved to your workspace. You can access it anytime from the Dashboard."
                  : "Save this exam to your personal bookmarks to track study progress and get updates."}
              </p>

              <div className="p-3.5 bg-muted/30 border border-border rounded-2xl flex items-center justify-between text-xs mb-4">
                <span className="font-semibold text-muted-foreground">Status</span>
                <span className={`font-bold ${isBookmarked ? "text-primary" : "text-muted-foreground"}`}>
                  {isBookmarked ? "Saved to Profile" : "Not Bookmarked"}
                </span>
              </div>
            </div>

            <button
              onClick={() => toggleBookmark(bookmarkKey)}
              className={`w-full inline-flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition relative z-10 ${
                isBookmarked
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/25"
                  : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm"
              }`}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="h-4 w-4" /> Remove Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" /> Bookmark Exam
                </>
              )}
            </button>
          </div>

          {/* CARD 9: 🌐 OFFICIAL WEBSITE */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 card-tile relative overflow-hidden">
            {isTnpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
              />
            )}
            {isUpsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
              />
            )}
            {isSsc && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
              />
            )}
            {isRrb && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
              />
            )}
            {isBanking && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
              />
            )}
            {isDefence && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Official Website</h3>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Official Portal
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Visit the official recruitment board for online registrations, updates, and verify hall tickets.
              </p>

              <div className="p-3 bg-muted/40 rounded-xl border border-border text-[10px] font-mono text-primary truncate mb-4 select-all">
                {officialWebsiteUrl}
              </div>
            </div>

            <a
              href={officialWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition shadow-sm relative z-10"
            >
              Visit Portal <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. FAQ ACCORDION DISPLAY */}
      {displayedFaqs.length > 0 && (
        <section id="faq-section" className="mx-auto max-w-3xl px-4 sm:px-6 pb-20 pt-10">
          <div className="border-t border-border pt-10">
            <h3 className="font-display text-2xl font-bold mb-6 text-center">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {displayedFaqs.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-border p-4 open:bg-muted/40 transition duration-300"
                >
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-semibold text-sm select-none">
                    <span>{f.q}</span>
                    <ChevronRight className="h-4 w-4 mt-1 text-primary transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed animate-fade-in pl-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
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
                className="h-8 w-8 grid place-items-center hover:bg-muted rounded-full text-muted-foreground font-semibold"
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
                  {exam.studyPlan.map((s, idx) => {
                    const isDone = completedWeeks.includes(s.week);
                    return (
                      <button
                        key={s.week}
                        onClick={() => toggleWeek(s.week)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition ${
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

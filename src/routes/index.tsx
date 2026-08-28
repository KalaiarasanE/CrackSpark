import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { categories, allNotifications } from "@/data/exams";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchCategoryImages,
  fetchHeroImage,
  defaultCategoryImages,
  defaultSupabaseCategoryImages,
  preloadImages,
} from "@/lib/portal-assets";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Sparkles,
  Trophy,
  GraduationCap,
  Building2,
  Train,
  Landmark,
  Banknote,
  ShieldCheck,
  MapPin,
  Shield,
  Calendar,
  Clock,
  Timer,
  Zap,
  Quote,
  Star,
  HelpCircle,
  FileText,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  X,
  Globe,
  Award,
} from "lucide-react";
import {
  CountUp,
  ScrollReveal,
  Magnetic,
  TiltCard,
  FloatingParticles,
} from "@/components/ui/animations";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [categoryImages, heroBg] = await Promise.all([
        fetchCategoryImages(),
        fetchHeroImage(),
      ]);
      return {
        categoryImages,
        heroBg,
      };
    } catch (err) {
      console.warn("[Home Route Loader] Error prefetching portal assets:", err);
      return {
        categoryImages: defaultSupabaseCategoryImages,
        heroBg: "/hero_background.jpg",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "CrackSpark — Premium Prep Portal for Government Exams" },
      {
        name: "description",
        content:
          "India's premier prep portal for UPSC, SSC, RRB, IBPS, SBI, TNPSC. Curated study materials, syllabus breakdowns, active countdowns, and topper roadmaps.",
      },
    ],
  }),
  component: Home,
});

const iconMap: Record<string, typeof Landmark> = {
  upsc: Landmark,
  ssc: Building2,
  rrb: Train,
  ibps: Banknote,
  sbi: ShieldCheck,
  tnpsc: MapPin,
  defence: Shield,
};

function CategoryCardImage({
  src,
  fallbackSrc,
  alt,
}: {
  src?: string;
  fallbackSrc: string;
  alt: string;
}) {
  const targetSrc = src || fallbackSrc;
  const [imgSrc, setImgSrc] = useState(targetSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (targetSrc && targetSrc !== imgSrc) {
      setImgSrc(targetSrc);
      setIsLoaded(false);
    }
  }, [targetSrc]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Sleek dark shimmer loading skeleton */}
      <div
        className={cn(
          "absolute inset-0 bg-slate-900 transition-opacity duration-500",
          isLoaded
            ? "opacity-0 pointer-events-none"
            : "opacity-100 animate-pulse bg-gradient-to-r from-slate-950 via-slate-800/80 to-slate-950"
        )}
      />

      {/* Supabase Hosted Category Image */}
      <img
        src={imgSrc}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
        }}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Gradient Overlay for crisp text contrast */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-900/60 to-slate-900/30 group-hover:from-slate-950/95 group-hover:via-slate-900/70 transition-all duration-300 pointer-events-none z-0" />
    </div>
  );
}

const defaultCountdowns = [
  {
    exam_name: "UPSC IAS Prelims",
    exam_category: "upsc",
    exam_datetime: "2026-05-31T09:00:00.000Z",
    badge: "HIGH PREP",
    color: "#f97316",
    is_active: true,
    display_order: 1,
  },
  {
    exam_name: "TNPSC Group 1 Prelims",
    exam_category: "tnpsc",
    exam_datetime: "2026-07-12T10:00:00.000Z",
    badge: "TRENDING",
    color: "#f59e0b",
    is_active: true,
    display_order: 2,
  },
  {
    exam_name: "SSC CGL Tier 1",
    exam_category: "ssc",
    exam_datetime: "2026-09-10T10:00:00.000Z",
    badge: "5,000+ VACANCIES",
    color: "#ea580c",
    is_active: true,
    display_order: 3,
  },
];

const officialPortalsList = [
  {
    name: "UPSC (Union Public Service Commission)",
    url: "https://upsc.gov.in",
    desc: "Civil Services (IAS/IPS/IFS), NDA, CDS, CAPF, Engineering Services",
    badge: "Central",
  },
  {
    name: "SSC (Staff Selection Commission)",
    url: "https://ssc.gov.in",
    desc: "CGL, CHSL, MTS, GD Constable, CPO, Stenographer",
    badge: "Central",
  },
  {
    name: "Indian Railways Recruitment (RRB)",
    url: "https://www.rrbcdg.gov.in",
    desc: "RRB NTPC, Group D, ALP, Junior Engineer, Paramedical",
    badge: "Railways",
  },
  {
    name: "IBPS (Banking Personnel Selection)",
    url: "https://ibps.in",
    desc: "Public Sector Banks PO, Clerk, Specialist Officer & RRBs",
    badge: "Banking",
  },
  {
    name: "State Bank of India (SBI Careers)",
    url: "https://sbi.co.in/web/careers",
    desc: "SBI Probationary Officer, Junior Associates (Clerk), Specialist Cadre",
    badge: "Banking",
  },
  {
    name: "TNPSC (Tamil Nadu Public Service)",
    url: "https://tnpsc.gov.in",
    desc: "Group 1, Group 2/2A, Group 4, VAO, Combined Technical Services",
    badge: "State",
  },
  {
    name: "Indian Armed Forces (Join Indian Army)",
    url: "https://joinindianarmy.nic.in",
    desc: "Officer Cadre, Agniveer, NDA, CDS, Technical Graduate Course",
    badge: "Defence",
  },
];

function Home() {
  const loaderData = Route.useLoaderData();
  const [heroBg, setHeroBg] = useState<string>(
    loaderData?.heroBg || "/hero_background.jpg"
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause video when intersecting (scrolled out of view)
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const video = videoRef.current;
    if (!video) return;

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        },
        { threshold: 0.1 },
      );

      observer.observe(video);
      return () => {
        observer.disconnect();
      };
    } catch (e) {
      console.warn("IntersectionObserver error:", e);
    }
  }, []);

  const [latestNotifs, setLatestNotifs] = useState<any[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(
    loaderData?.categoryImages || defaultSupabaseCategoryImages
  );
  const [countdowns, setCountdowns] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const [menuOpen, setMenuOpen] = useState(false);
  const [officialModalOpen, setOfficialModalOpen] = useState(false);

  // Preload all category images in browser memory immediately
  useEffect(() => {
    preloadImages([heroBg, ...Object.values(categoryImages)]);
  }, [heroBg, categoryImages]);

  // Load and subscribe to approved user reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("user_reviews")
          .select("id, user_name, user_avatar, rating, comment, exam_name, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data) {
          setReviews(data);
        }
      } catch (err) {
        console.warn("Failed to load reviews:", err);
      }
    };

    fetchReviews();

    const channel = supabase
      .channel("public_reviews_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_reviews" }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load and subscribe to countdown tickers
  useEffect(() => {
    const fetchCountdowns = async () => {
      try {
        const { data, error } = await supabase
          .from("exam_countdowns")
          .select("id, exam_name, exam_category, exam_datetime, badge, color, is_active, display_order")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error || !data) {
          setCountdowns([]);
        } else {
          setCountdowns(data);
        }
      } catch (err) {
        console.warn("Failed to load countdowns:", err);
        setCountdowns([]);
      }
    };

    fetchCountdowns();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public_countdowns_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "exam_countdowns" }, () => {
        fetchCountdowns();
      })
      .subscribe();

    // Single interval timer for all countdown cards
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("id, title, publish_date, category")
          .order("is_pinned", { ascending: false })
          .order("publish_date", { ascending: false })
          .limit(5);

        if (error || !data) {
          setLatestNotifs([]);
          return;
        }

        setLatestNotifs(
          data.map((n: any) => ({
            id: n.id,
            title: n.title,
            date: n.publish_date ? new Date(n.publish_date).toLocaleDateString() : "Recent",
            exam: n.category || "General",
            category: (n.category || "general").toLowerCase(),
            examSlug: "",
          })),
        );
      } catch (e) {
        console.error("[Home Page] Error fetching notifications:", e);
        setLatestNotifs([]);
      }
    }

    fetchNotifs();
  }, []);

  return (
    <SiteLayout>
      {/* Ambient background soft subtle warm glow */}
      <div className="absolute top-12 left-1/4 h-[350px] w-[350px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-80 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none -z-10" />

      {/* HERO BENTO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-3 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 auto-rows-[minmax(0,auto)]">
          {/* Main hero tile with clear background video */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="col-span-1 lg:col-span-8 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-lg border border-slate-200/80 dark:border-white/15 bg-slate-950 flex flex-col justify-between"
          >
            {/* Autoplaying background video - clearly visible, crisp and bright */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-3xl">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover object-[70%_center] md:object-[80%_center] opacity-90 sm:opacity-95 brightness-[1.03] contrast-[1.02]"
                style={{ objectPosition: "75% 50%" }}
                src="/hero_video.mp4"
                poster={heroBg}
                preload="auto"
                autoPlay
                loop
                muted
                playsInline
              />
              {/* Subtle directional gradient overlay only over text area for contrast without obscuring the video */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
            </div>

            <FloatingParticles color="rgba(249, 115, 22, 0.12)" count={20} />

            <div className="relative z-10 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 text-white border border-white/20 px-3.5 py-1 text-xs font-bold shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                <span>India's Premier Gov Prep Platform</span>
              </div>

              <h1 className="mt-4 sm:mt-7 text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold font-display text-white text-balance leading-[1.15] sm:leading-[1.1] tracking-tight drop-shadow-md">
                Crack Government
                <br className="hidden sm:inline" />
                Exams with{" "}
                <span className="text-orange-400 font-black drop-shadow-sm">
                  Ease.
                </span>
              </h1>

              <p className="mt-3 sm:mt-5 max-w-xl text-sm sm:text-base lg:text-lg text-slate-100/95 leading-relaxed font-medium drop-shadow-xs">
                CrackSpark brings notifications, syllabus, mocks, current affairs, and
                topper-curated study plans for every major Indian government exam — in one premium
                focused workspace.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-3.5">
                <Magnetic>
                  <a
                    href="#categories"
                    className="w-full sm:w-auto min-h-[46px] h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-6 text-sm font-bold text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition duration-300 cursor-pointer"
                  >
                    Explore Exams <ArrowRight className="h-4 w-4" />
                  </a>
                </Magnetic>
                <Magnetic>
                  <Link
                    to="/notifications"
                    className="w-full sm:w-auto min-h-[46px] h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-6 text-sm font-semibold shadow-xs hover:border-orange-300 transition group cursor-pointer"
                  >
                    <Bell className="h-4 w-4 text-orange-300 group-hover:animate-bell-shake transition-transform" />{" "}
                    Notifications
                  </Link>
                </Magnetic>
              </div>

              {/* Statistics Cards at the bottom of the hero */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/20 max-w-xl">
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  {[
                    { val: 19, suff: "+", l: "Exams Tracked" },
                    { val: 100, suff: "K+", l: "Aspirants" },
                    { val: 24, suff: "/7", l: "Active Updates" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-center h-full w-full shadow-xs hover:bg-black/45 hover:border-orange-400/60 transition-all duration-200"
                    >
                      <div className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-orange-400 tracking-tight text-center drop-shadow-xs">
                        <CountUp end={s.val} suffix={s.suff} />
                      </div>
                      <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-200 mt-1 tracking-wider text-center leading-tight">
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side Feature Cards: Stacked vertically on Desktop, Tablet, and Mobile */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 sm:gap-4 justify-between">
            {/* 1. TOP CARD -> SAFFRON / ORANGE */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl sm:rounded-3xl bg-[#FFF7ED] dark:bg-[#281308] border border-orange-200/90 dark:border-orange-800/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 flex flex-col justify-between min-h-[148px] relative overflow-hidden group"
            >
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/80 dark:border-orange-800/80 shadow-2xs">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-orange-500/15 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-300/60 dark:border-orange-700/60 rounded-full px-2.5 py-0.5">
                    CURATED
                  </span>
                </div>
                <div className="mt-3.5 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-orange-50 leading-tight">
                  Topper-grade study plans
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-orange-200/70 leading-relaxed font-medium">
                  Week-by-week roadmap designed by top officers.
                </p>
              </div>
              <Link
                to="/exams"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 self-start group/link"
              >
                <span>View Roadmaps</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* 2. MIDDLE CARD -> WHITE / LIGHT GREY */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-300 flex flex-col justify-between min-h-[148px] relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-orange-500 dark:text-orange-400 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-2xs">
                    <BookOpen className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-full px-2.5 py-0.5">
                    100% FREE
                  </span>
                </div>
                <div className="mt-3.5 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  Free study material
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Syllabus lists, formula sheets, key summaries.
                </p>
              </div>
              <Link
                to="/exams"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-orange-600 dark:text-slate-100 dark:hover:text-orange-400 self-start group/btn relative z-10"
              >
                <span>Browse library</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* 3. BOTTOM CARD -> GREEN */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl sm:rounded-3xl bg-[#F0FDF4] dark:bg-[#072B18] border border-emerald-200/90 dark:border-emerald-800/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between min-h-[148px] relative overflow-hidden group"
            >
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center shadow-2xs">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 rounded-full px-2.5 py-0.5">
                    LIVE ENGINE
                  </span>
                </div>
                <div className="mt-3.5 font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-emerald-50 leading-tight">
                  Mock test engine
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-emerald-200/70 leading-relaxed font-medium">
                  Real exam interface, detailed readiness score, and solutions.
                </p>
              </div>
              <Link
                to="/exams"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 self-start group/link"
              >
                <span>Explore Mock Tests</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* QUICK ACCESS HIGHLIGHTS (Latest Notifications, Previous Year Papers, Current Affairs, Bookmark Exam) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 sm:mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Latest Notifications */}
          <Link to="/notifications" className="group block">
            <div className="h-full p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20 shadow-2xs">
                    <Bell className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200/80 rounded-full px-2.5 py-0.5">
                    Live Alerts
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Latest Notifications
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Real-time updates, exam dates, admit cards, and official circulars.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                <span>View Alerts</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* 2. Previous Year Papers */}
          <Link to="/exams" className="group block">
            <div className="h-full p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20 shadow-2xs">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 rounded-full px-2.5 py-0.5">
                    10+ Years
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Previous Year Papers
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Solved question papers with answer keys, cutoff analysis, and PDFs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                <span>Download Papers</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* 3. Current Affairs */}
          <Link to="/notifications" className="group block">
            <div className="h-full p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20 shadow-2xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 rounded-full px-2.5 py-0.5">
                    Daily Digest
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Current Affairs
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Daily summaries, monthly compilations, and national & international digests.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                <span>Read Compilations</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* 4. Bookmark Exam */}
          <Link to="/bookmarks" className="group block">
            <div className="h-full p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20 shadow-2xs">
                    <Bookmark className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 rounded-full px-2.5 py-0.5">
                    Saved
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Bookmark Exam
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Save target exams, syllabus modules, and track personalized progress.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                <span>Open Bookmarks</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* EXAM COUNTDOWNS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-20">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400 rounded-full px-3.5 py-1.5 border border-orange-200/80 dark:border-orange-800/50 shadow-2xs">
              Exam countdown tickers
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4">
              Real-time Upcoming Deadlines
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {countdowns.map((timer) => {
              const targetTime = timer.exam_datetime ? new Date(timer.exam_datetime).getTime() : 0;
              const diff = targetTime > 0 ? targetTime - now : 0;
              const isExpired = diff <= 0;
              const cardColor = timer.color || "#f97316";

              const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
              const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
              const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
              const seconds = Math.max(0, Math.floor((diff / 1000) % 60));

              const isToday = days === 0 && !isExpired;

              let formattedDateUpper = "TBA";
              let monthStr = "EXAM";
              if (timer.exam_datetime) {
                try {
                  const dateObj = new Date(timer.exam_datetime);
                  if (!isNaN(dateObj.getTime())) {
                    const dayNum = dateObj.getDate();
                    monthStr = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
                    const yearNum = dateObj.getFullYear();
                    formattedDateUpper = `${dayNum} ${monthStr} ${yearNum}`;
                  }
                } catch {}
              }

              return (
                <div
                  key={timer.id || timer.exam_name}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full min-h-[220px]"
                >
                  {/* Header Info */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {/* Date Pill with Calendar Icon */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-bold font-mono shadow-2xs">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        {formattedDateUpper}
                      </div>

                      {/* Badge / Status */}
                      {timer.badge && (
                        <span
                          className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors duration-300 font-sans shadow-2xs"
                          style={{
                            backgroundColor: isExpired
                              ? "rgba(16, 185, 129, 0.1)"
                              : isToday
                                ? "rgba(249, 115, 22, 0.15)"
                                : `${cardColor}15`,
                            color: isExpired ? "#10b981" : isToday ? "#f97316" : cardColor,
                            borderColor: isExpired ? "rgba(16, 185, 129, 0.3)" : `${cardColor}35`,
                          }}
                        >
                          {isExpired ? "Started" : isToday ? "Exam Today!" : timer.badge}
                        </span>
                      )}
                    </div>

                    {/* Exam Name */}
                    <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      {timer.exam_name}
                    </h3>
                  </div>

                  {/* Countdown 4-Box Grid or Expired View */}
                  <div className="mt-4">
                    {isExpired ? (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col items-center justify-center gap-1">
                        <div className="font-display text-lg sm:text-xl font-black text-emerald-500 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                          Exam Started
                        </div>
                        <div className="text-[10px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest">
                          Live / Registration Closed
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 items-stretch">
                        {/* Tear-Off Calendar Card for DAYS */}
                        <div className="relative flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:scale-[1.02] group/cal h-full">
                          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[9px] sm:text-[11px] tracking-wider uppercase text-center py-1 px-1 shadow-2xs select-none">
                            {monthStr}
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center py-1 px-1 bg-white dark:bg-slate-900">
                            <div className="font-display font-black text-lg sm:text-2xl tracking-tight text-slate-900 dark:text-white leading-none">
                              {days < 10 ? `0${days}` : days}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 text-center py-0.5 px-0.5 select-none">
                            DAYS LEFT
                          </div>
                        </div>

                        {/* Hours Box */}
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 transition-transform group-hover:scale-[1.02]">
                          <div className="flex items-center gap-0.5 font-display font-black text-base sm:text-xl text-orange-600 dark:text-orange-400 tracking-tight">
                            <Clock className="h-3 w-3 text-orange-500" />
                            {hours.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                            Hours
                          </span>
                        </div>

                        {/* Minutes Box */}
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 transition-transform group-hover:scale-[1.02]">
                          <div className="flex items-center gap-0.5 font-display font-black text-base sm:text-xl text-orange-600 dark:text-orange-400 tracking-tight">
                            <Timer className="h-3 w-3 text-orange-500" />
                            {minutes.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                            Minutes
                          </span>
                        </div>

                        {/* Seconds Box */}
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 transition-transform group-hover:scale-[1.02]">
                          <div className="flex items-center gap-0.5 font-display font-black text-base sm:text-xl text-orange-600 dark:text-orange-400 tracking-tight">
                            <Zap className="h-3 w-3 text-orange-500" />
                            {seconds.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-orange-600/90 dark:text-orange-400 mt-0.5">
                            Seconds
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {countdowns.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
                No active exam countdown tickers are scheduled at the moment.
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* CATEGORIES BENTO */}
      <section id="categories" className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-20">
        <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400 mb-2">
              Exam categories
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pick your path. Begin today.
            </h2>
          </div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:gap-2 transition-all self-start sm:self-auto"
          >
            All exams <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 sm:gap-5">
          {categories.map((cat, i) => {
            const Icon = iconMap[cat.slug] || Landmark;
            const sizeClass =
              i === 0
                ? "col-span-1 sm:col-span-2 md:col-span-7"
                : i === 1
                  ? "col-span-1 sm:col-span-2 md:col-span-5"
                  : i === 5
                    ? "col-span-1 sm:col-span-2 md:col-span-7"
                    : i === 6
                      ? "col-span-1 sm:col-span-2 md:col-span-5"
                      : "col-span-1 sm:col-span-1 md:col-span-4";

            const customImg =
              categoryImages[cat.slug] ||
              (cat.slug === "ibps" ? categoryImages["sbi"] : undefined) ||
              (cat.slug === "sbi" ? categoryImages["ibps"] : undefined);
            const fallbackBg = defaultCategoryImages[cat.slug] || "/hero_background.jpg";

            return (
              <Link
                key={cat.slug}
                to="/$category"
                params={{ category: cat.slug }}
                className={`${sizeClass} block`}
              >
                <ScrollReveal delay={i * 50} className="h-full">
                  <TiltCard className="h-full group relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 min-h-[200px] sm:min-h-[240px] flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-500">
                    {/* Background image with skeleton and smooth fade-in */}
                    <CategoryCardImage
                      src={customImg}
                      fallbackSrc={fallbackBg}
                      alt={`${cat.name} Exam Category`}
                    />

                    <div className="relative z-10 flex flex-col h-full justify-between flex-1">
                      <div className="flex items-start justify-between">
                        <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md text-white shadow-xs">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/15 border border-white/20 backdrop-blur-md text-white">
                          {cat.examCount} exams
                        </span>
                      </div>

                      <div className="mt-6 sm:mt-8 text-white">
                        <div className="font-display text-xl sm:text-3xl font-bold tracking-tight">
                          {cat.name}
                        </div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-wider mt-1 text-white/80 font-semibold">
                          {cat.fullName}
                        </div>
                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm max-w-md text-white/80 line-clamp-2 leading-relaxed font-normal">
                          {cat.description}
                        </p>
                        <div className="mt-4 sm:mt-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-300 group-hover:text-white group-hover:gap-2.5 transition-all">
                          Explore Pipeline <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </ScrollReveal>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TRUSTED BY 100K+ ASPIRANTS & OFFICIAL WEBSITES SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 sm:mt-24">
        <ScrollReveal>
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#F8FAFC] to-white dark:from-card dark:to-card/80 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 lg:p-12 shadow-xs text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 px-3.5 py-1 text-xs font-bold mb-4 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              Verified Government Exam Resource Hub
            </div>

            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Trusted by 100K+ Aspirants Across India
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              From syllabus breakdowns to live countdowns and previous year papers — all top central and state government recruitment portals at your fingertips.
            </p>

            {/* Compact Exam-Category Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-3xl mx-auto">
              {[
                { name: "UPSC", desc: "Civil Services", slug: "upsc" },
                { name: "SSC", desc: "CGL & CHSL", slug: "ssc" },
                { name: "RRB", desc: "NTPC & Group D", slug: "rrb" },
                { name: "IBPS", desc: "PO & Clerk", slug: "ibps" },
                { name: "SBI", desc: "PO & Clerk", slug: "sbi" },
                { name: "TNPSC", desc: "Group 1, 2, 4", slug: "tnpsc" },
                { name: "Defence", desc: "NDA & CDS", slug: "defence" },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  to="/$category"
                  params={{ category: cat.slug }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:border-orange-400 hover:bg-orange-50/60 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 transition-all shadow-2xs hover:shadow-xs group hover:-translate-y-0.5"
                >
                  <span className="font-bold text-orange-500 group-hover:scale-105 transition-transform">{cat.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    ({cat.desc})
                  </span>
                </Link>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => setOfficialModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold text-sm px-6 py-3.5 shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Globe className="h-4 w-4 text-orange-400 dark:text-orange-500" />
                <span>Official Websites →</span>
              </button>

              <Link
                to="/exams"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-card border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-foreground font-semibold text-sm px-6 py-3.5 shadow-2xs hover:border-orange-300 transition cursor-pointer"
              >
                Explore All Exams
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-20">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400 rounded-full px-3.5 py-1.5 border border-orange-200/80 dark:border-orange-800/50 shadow-2xs">
              Aspirants feedback
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4">
              Loved by Thousands of Achievers
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {reviews.map((rev) => {
              const rating = Math.max(1, Math.min(5, Number(rev.rating) || 5));
              const userName = rev.user_name || "Verified Aspirant";
              const userInitial = userName.charAt(0).toUpperCase();
              const dateStr = rev.created_at
                ? new Date(rev.created_at).toLocaleDateString()
                : new Date().toLocaleDateString();

              return (
                <div
                  key={rev.id || userName}
                  className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 hover:-translate-y-1"
                >
                  <Quote className="absolute top-6 right-6 h-8 w-8 sm:h-10 sm:w-10 text-slate-200 dark:text-slate-800 pointer-events-none" />
                  <div className="space-y-3 sm:space-y-4 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(rating)].map((_, rIdx) => (
                          <Star
                            key={rIdx}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dateStr}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm sm:text-base leading-tight text-slate-900 dark:text-white">
                      {rev.review_title || "Top-rated Experience"}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal line-clamp-4">
                      "{rev.review_description || "CrackSpark makes preparation organized and easy."}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3.5 sm:pt-4 relative z-10">
                    {rev.profile_image ? (
                      <img
                        src={rev.profile_image}
                        alt={userName}
                        className="h-10 w-10 rounded-full object-cover border border-orange-200 dark:border-orange-800"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 flex items-center justify-center font-bold text-sm uppercase border border-orange-200 dark:border-orange-800">
                        {userInitial}
                      </div>
                    )}
                    <div>
                      <div className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {userName}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Verified Aspirant
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {reviews.length === 0 && (
              <div className="col-span-1 md:col-span-3 py-12 sm:py-16 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-2xl mx-auto shadow-xs">
                No user reviews available yet. Be the first to share your experience.
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* NOTIFICATIONS STRIP */}
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-20">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-5 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-2 group cursor-default">
                <Bell className="h-3.5 w-3.5 group-hover:animate-bell-shake transition-transform" />{" "}
                Updates
              </div>
              <h3 className="text-xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                Latest notifications
              </h3>
            </div>
            <Link
              to="/notifications"
              className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:underline self-start sm:self-auto"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {latestNotifs.map((n, i) => (
              <li
                key={i}
                className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition duration-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="inline-flex h-5 items-center rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 px-2.5 font-bold uppercase tracking-wider text-[9px] border border-orange-200/80 dark:border-orange-800/60">
                      {n.exam}
                    </span>
                    <span className="font-medium text-[10px] text-slate-400">{n.date}</span>
                  </div>
                  <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                    {n.title}
                  </div>
                </div>
                {n.category && n.examSlug ? (
                  <Link
                    to="/$category/$exam"
                    params={{ category: n.category, exam: n.examSlug }}
                    className="w-full sm:w-auto text-center shrink-0 text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 px-4 py-2 rounded-lg border border-orange-200/80 dark:border-orange-800/60 min-h-[40px] flex items-center justify-center transition-colors"
                  >
                    Open Details
                  </Link>
                ) : (
                  <Link
                    to="/notifications"
                    className="w-full sm:w-auto text-center shrink-0 text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 px-4 py-2 rounded-lg border border-orange-200/80 dark:border-orange-800/60 min-h-[40px] flex items-center justify-center transition-colors"
                  >
                    Open Details
                  </Link>
                )}
              </li>
            ))}
            {latestNotifs.length === 0 && (
              <li className="py-8 text-center text-xs text-muted-foreground">
                No notifications published yet.
              </li>
            )}
          </ul>
        </div>
      </ScrollReveal>

      {/* OFFICIAL WEBSITES DIRECTORY MODAL */}
      <AnimatePresence>
        {officialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOfficialModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    <Globe className="h-3.5 w-3.5" /> Direct Access
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white mt-1">
                    Official Exam Portals
                  </h3>
                </div>
                <button
                  onClick={() => setOfficialModalOpen(false)}
                  className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {officialPortalsList.map((portal) => (
                  <a
                    key={portal.name}
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-orange-300 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-2 py-0.5 rounded">
                          {portal.badge}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {portal.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {portal.desc}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-500 group-hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Always verify official notification brochures directly from authentic government domains (.gov.in / .nic.in).
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXPANDABLE STICKY QUICK MENU FAB */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-1.5 bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl backdrop-blur-xl"
            >
              <Link
                to="/exams"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-800 text-xs font-bold transition text-slate-800 dark:text-slate-200"
              >
                <GraduationCap className="h-4 w-4 text-orange-500" />
                Prep Library
              </Link>
              <Link
                to="/notifications"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-800 text-xs font-bold transition text-slate-800 dark:text-slate-200"
              >
                <Bell className="h-4 w-4 text-orange-500" />
                Active Alerts
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-800 text-xs font-bold transition text-slate-800 dark:text-slate-200"
              >
                <HelpCircle className="h-4 w-4 text-orange-500" />
                Support Hub
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-white/20"
          aria-label="Expand quick menu"
        >
          <motion.div
            animate={{ rotate: menuOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
        </button>
      </div>

      <div className="h-12 sm:h-16" />
    </SiteLayout>
  );
}

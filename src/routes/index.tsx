import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { categories, allNotifications } from "@/data/exams";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";
import {
  CountUp,
  ScrollReveal,
  Magnetic,
  TiltCard,
  FloatingParticles,
} from "@/components/ui/animations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CrackSpark — Premium Prep Portal for Government Exams" },
      {
        name: "description",
        content:
          "Redesigned premium prep portal for UPSC, SSC, RRB, IBPS, SBI, TNPSC. Curved layouts, glassmorphism, active countdowns, and topper guides.",
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

const defaultCategoryImages: Record<string, string> = {
  upsc: "/upsc_banner.jpg",
  ssc: "/ssc_banner.jpg",
  rrb: "/railways_banner.jpg",
  ibps: "/banking_banner.jpg",
  sbi: "/banking_banner.jpg",
  tnpsc: "/tnpsc_banner.jpg",
  defence: "/hero_background.jpg",
};

const defaultCountdowns = [
  {
    exam_name: "UPSC IAS Prelims",
    exam_category: "upsc",
    exam_datetime: "2026-05-31T09:00:00.000Z",
    badge: "HIGH PREP",
    color: "#d4af37",
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
    color: "#ef4444",
    is_active: true,
    display_order: 3,
  },
];

function Home() {
  const [heroBg, setHeroBg] = useState("/hero_background.jpg");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause video when intersecting (scrolled out of view)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
  }, []);

  const [latestNotifs, setLatestNotifs] = useState<any[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [countdowns, setCountdowns] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const [menuOpen, setMenuOpen] = useState(false);

  // Load and subscribe to approved user reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("user_reviews")
          .select("*")
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

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
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          setCountdowns(defaultCountdowns);
        } else if (data && data.length > 0) {
          setCountdowns(data);
        } else {
          // Auto-seed table if it exists but is empty
          try {
            await supabase.from("exam_countdowns").insert(defaultCountdowns);
            const { data: refetched } = await supabase
              .from("exam_countdowns")
              .select("*")
              .eq("is_active", true)
              .order("display_order", { ascending: true });
            if (refetched && refetched.length > 0) {
              setCountdowns(refetched);
            } else {
              setCountdowns(defaultCountdowns);
            }
          } catch (seedErr) {
            setCountdowns(defaultCountdowns);
          }
        }
      } catch (err) {
        console.warn("Failed to load countdowns:", err);
        setCountdowns(defaultCountdowns);
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
    async function fetchHero() {
      try {
        const { data, error } = await supabase
          .from("exam_details")
          .select("official_website_url")
          .eq("exam_key", "settings:home_hero")
          .maybeSingle();
        if (!error && data?.official_website_url) {
          setHeroBg(data.official_website_url + "?t=" + Date.now());
        }
      } catch (e) {
        console.warn("Failed to load custom hero image:", e);
      }
    }

    async function fetchCategoryImages() {
      try {
        const { data, error } = await supabase
          .from("exam_details")
          .select("*")
          .like("exam_key", "category_image:%");
        if (!error && data) {
          const mapping: Record<string, string> = {};
          data.forEach((row: any) => {
            const catSlug = row.exam_key.replace("category_image:", "");
            mapping[catSlug] = row.official_website_url;
          });
          setCategoryImages(mapping);
        }
      } catch (e) {
        console.warn("Failed to load category images:", e);
      }
    }

    async function fetchNotifs() {
      try {
        const { data: initialData, error } = await supabase
          .from("notifications")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("publish_date", { ascending: false });
        let data = initialData;

        if (error) throw error;

        if (!data || data.length === 0) {
          const seedData = allNotifications.map((n) => ({
            title: n.title,
            description: n.title,
            category: n.exam,
            publish_date: new Date().toISOString(),
            important_links: [],
            is_pinned: false,
          }));
          const { error: seedErr } = await supabase.from("notifications").insert(seedData);
          if (seedErr) throw seedErr;

          const { data: refetched } = await supabase
            .from("notifications")
            .select("*")
            .order("is_pinned", { ascending: false })
            .order("publish_date", { ascending: false });
          data = refetched;
        }

        if (data) {
          setLatestNotifs(
            data.slice(0, 5).map((n: any) => ({
              title: n.title,
              date: new Date(n.publish_date).toLocaleDateString(),
              exam: n.category,
              category: n.category.toLowerCase(),
              examSlug: "",
            })),
          );
        }
      } catch (e) {
        console.error("[Home Page] Error fetching notifications:", e);
        setLatestNotifs(
          allNotifications.slice(0, 5).map((n) => ({
            title: n.title,
            date: n.date,
            exam: n.exam,
            category: n.category,
            examSlug: n.examSlug,
          })),
        );
      }
    }

    fetchHero();
    fetchCategoryImages();
    fetchNotifs();
  }, []);

  return (
    <SiteLayout>
      {/* Ambient background blur circles */}
      <div className="absolute top-20 left-1/4 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-96 right-1/4 h-[400px] w-[400px] rounded-full bg-gold/10 blur-[150px] pointer-events-none -z-10" />

      {/* HERO BENTO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 auto-rows-[minmax(0,auto)]">
          {/* Main hero tile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="col-span-1 lg:col-span-8 rounded-2xl sm:rounded-3xl p-5 sm:p-10 lg:p-12 text-white bg-black/40 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-2xl"
          >
            {/* Autoplaying lazy-loaded background video */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-3xl">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover object-[80%_center] md:object-[82%_center]"
                style={{ objectPosition: "80% 50%" }}
                src="/hero_video.mp4"
                poster={heroBg}
                preload="none"
                autoPlay
                loop
                muted
                playsInline
              />
              {/* Dark overlay (50%) to ensure text readability */}
              <div className="absolute inset-0 bg-black/55 z-10" />
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70 pointer-events-none z-10" />

            <FloatingParticles color="rgba(56, 189, 248, 0.05)" count={30} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary border border-primary/20 dark:bg-white/10 dark:text-white dark:border-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> India's Premier
                Gov Prep Platform
              </div>

              <h1 className="mt-4 sm:mt-8 text-2xl sm:text-4xl lg:text-6xl font-black font-display text-balance leading-[1.15] sm:leading-[1.08] tracking-tight">
                Crack Government
                <br className="hidden sm:inline" />
                Exams with{" "}
                <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-sm font-black">
                  Ease.
                </span>
              </h1>

              <p className="mt-3 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-medium">
                CrackSpark brings notifications, syllabus, mocks, current affairs, and
                topper-curated study plans for every major Indian government exam — in one premium
                focused workspace.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-3.5">
                <Magnetic>
                  <a
                    href="#categories"
                    className="w-full sm:w-auto min-h-[44px] h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-sm font-bold text-white hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition duration-300 cursor-pointer"
                  >
                    Explore Exams <ArrowRight className="h-4 w-4" />
                  </a>
                </Magnetic>
                <Magnetic>
                  <Link
                    to="/notifications"
                    className="w-full sm:w-auto min-h-[44px] h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-background/80 hover:bg-muted border border-border/80 px-6 text-sm font-semibold text-foreground backdrop-blur-md transition group cursor-pointer"
                  >
                    <Bell className="h-4 w-4 group-hover:animate-bell-shake transition-transform" />{" "}
                    Notifications
                  </Link>
                </Magnetic>
              </div>

              <div className="mt-5 sm:mt-8 pt-5 sm:pt-6 border-t border-white/15 max-w-xl">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { val: 19, suff: "+", l: "Exams Tracked" },
                    { val: 100, suff: "K+", l: "Aspirants" },
                    { val: 24, suff: "/7", l: "Active Updates" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-center h-full w-full shadow-sm hover:bg-white/10 transition-colors duration-200"
                    >
                      <div className="font-display text-lg sm:text-2xl lg:text-3xl font-black text-amber-400 tracking-tight text-center">
                        <CountUp end={s.val} suffix={s.suff} />
                      </div>
                      <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-200 mt-1 tracking-wider text-center leading-tight">
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side Bento tiles */}
          <div className="col-span-1 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 sm:p-6 relative overflow-hidden text-white shadow-xl flex flex-col justify-between min-h-[140px] sm:min-h-[160px]"
            >
              <div>
                <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 drop-shadow-md" />
                <div className="mt-3 sm:mt-4 font-display text-lg sm:text-xl font-bold leading-tight">
                  Topper-grade study plans
                </div>
                <p className="mt-1.5 sm:mt-2 text-xs text-white/85">
                  Week-by-week roadmap designed by top officers.
                </p>
              </div>
              <div className="text-[9px] uppercase font-extrabold tracking-wider bg-white/20 rounded-full px-2.5 py-0.5 w-fit self-end mt-3 sm:mt-4">
                Curated
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 p-5 sm:p-6 shadow-xl flex flex-col justify-between min-h-[140px] sm:min-h-[160px]"
            >
              <div>
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500" />
                <div className="mt-3 sm:mt-4 font-display text-lg sm:text-xl font-bold leading-tight">
                  Free study material
                </div>
                <p className="mt-1.5 sm:mt-2 text-xs text-muted-foreground">
                  Syllabus lists, formula sheets, key summaries.
                </p>
              </div>
              <Link
                to="/exams"
                className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:underline self-start"
              >
                Browse library <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="col-span-1 sm:col-span-2 lg:col-span-1 rounded-2xl sm:rounded-3xl bg-emerald-700 p-5 sm:p-6 relative overflow-hidden text-white shadow-xl flex flex-col justify-between min-h-[140px] sm:min-h-[160px]"
            >
              <div>
                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-amber-400" />
                <div className="mt-3 sm:mt-4 font-display text-lg sm:text-xl font-bold leading-tight">
                  Mock test engine
                </div>
                <p className="mt-1.5 sm:mt-2 text-xs text-white/85">
                  Real exam interface, detailed readiness score, and solutions.
                </p>
              </div>
              <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* EXAM COUNTDOWNS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-24">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 rounded-full px-3.5 py-1.5 border border-amber-500/20 shadow-xs">
              Exam countdown tickers
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight mt-3 sm:mt-4">
              Real-time Upcoming Deadlines
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {countdowns.map((timer) => {
              const targetTime = new Date(timer.exam_datetime).getTime();
              const diff = targetTime - now;
              const isExpired = diff <= 0;
              const cardColor = timer.color || "#d4af37";

              const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
              const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
              const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
              const seconds = Math.max(0, Math.floor((diff / 1000) % 60));

              const isToday = days === 0 && !isExpired;

              const dateObj = new Date(timer.exam_datetime);
              const dayNum = dateObj.getDate();
              const monthStr = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
              const yearNum = dateObj.getFullYear();
              const formattedDateUpper = `${dayNum} ${monthStr} ${yearNum}`;

              return (
                <div
                  key={timer.id}
                  className="group relative overflow-hidden rounded-[22px] bg-card/70 backdrop-blur-xl border border-border/50 p-5 sm:p-6 shadow-lg hover:shadow-2xl hover:border-amber-500/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full min-h-[220px] sm:min-h-[240px]"
                >
                  {/* Ambient Color Glow */}
                  <div
                    className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-500"
                    style={{ backgroundColor: cardColor }}
                  />

                  {/* Header Info */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {/* Date Pill with Calendar Icon */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono shadow-xs">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        {formattedDateUpper}
                      </div>

                      {/* Badge / Status */}
                      {timer.badge && (
                        <span
                          className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors duration-300 font-sans shadow-xs"
                          style={{
                            backgroundColor: isExpired
                              ? "rgba(16, 185, 129, 0.1)"
                              : isToday
                                ? "rgba(245, 158, 11, 0.15)"
                                : `${cardColor}15`,
                            color: isExpired ? "#10b981" : isToday ? "#f59e0b" : cardColor,
                            borderColor: isExpired ? "rgba(16, 185, 129, 0.3)" : `${cardColor}35`,
                          }}
                        >
                          {isExpired ? "Started" : isToday ? "Exam Today!" : timer.badge}
                        </span>
                      )}
                    </div>

                    {/* Exam Name */}
                    <h3 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight leading-snug">
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
                        {/* Realistic Tear-Off Calendar Card for DAYS */}
                        <div className="relative flex flex-col justify-between rounded-xl sm:rounded-2xl bg-white text-slate-900 shadow-md shadow-black/20 border border-slate-200 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-red-500/40 group/cal h-full">
                          {/* Binding Rings / Pins Header */}
                          <div className="absolute top-0 inset-x-0 h-1.5 flex justify-around px-2 z-20 pointer-events-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900/80 shadow-inner border border-slate-700 -mt-0.5" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900/80 shadow-inner border border-slate-700 -mt-0.5" />
                          </div>

                          {/* Red Top Header for Month Name */}
                          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-[9px] sm:text-[11px] tracking-wider uppercase text-center py-1 px-1 border-b border-red-700/40 shadow-xs select-none">
                            {monthStr}
                          </div>

                          {/* Center Body for Large Day Number */}
                          <div className="flex-1 flex flex-col items-center justify-center py-1 px-1 bg-white text-slate-900">
                            <div className="font-display font-black text-lg sm:text-2xl lg:text-3xl tracking-tight text-slate-900 leading-none">
                              {days < 10 ? `0${days}` : days}
                            </div>
                          </div>

                          {/* Bottom Label: DAYS LEFT */}
                          <div className="bg-slate-50 border-t border-slate-100 text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider text-red-600 text-center py-0.5 px-0.5 select-none">
                            DAYS LEFT
                          </div>
                        </div>

                        {/* Hours Box */}
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-amber-500/8 border border-amber-500/15 dark:bg-amber-500/10 dark:border-amber-500/20 transition-transform group-hover:scale-[1.02]">
                          <div className="flex items-center gap-0.5 font-display font-black text-base sm:text-xl text-amber-500 tracking-tight">
                            <span className="text-[11px] sm:text-xs">🕒</span>
                            {hours.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
                            Hours
                          </span>
                        </div>

                        {/* Minutes Box */}
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-amber-500/8 border border-amber-500/15 dark:bg-amber-500/10 dark:border-amber-500/20 transition-transform group-hover:scale-[1.02]">
                          <div className="flex items-center gap-0.5 font-display font-black text-base sm:text-xl text-amber-500 tracking-tight">
                            <span className="text-[11px] sm:text-xs">⏱</span>
                            {minutes.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
                            Minutes
                          </span>
                        </div>

                        {/* Seconds Box */}
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl bg-amber-500/8 border border-amber-500/15 dark:bg-amber-500/10 dark:border-amber-500/20 transition-transform group-hover:scale-[1.02]">
                          <div className="flex items-center gap-0.5 font-display font-black text-base sm:text-xl text-amber-500 tracking-tight">
                            <span className="text-[11px] sm:text-xs">⚡</span>
                            {seconds.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-500/90 mt-0.5">
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
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center text-xs text-muted-foreground bg-card/20 border border-border/20 rounded-2xl sm:rounded-3xl">
                No active exam countdown tickers are scheduled at the moment.
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* CATEGORIES BENTO */}
      <section id="categories" className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-24">
        <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500 mb-2">
              Exam categories
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-tight">
              Pick your path. Begin today.
            </h2>
          </div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500 hover:gap-2 transition-all self-start sm:self-auto"
          >
            All exams <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 sm:gap-5">
          {categories.map((cat, i) => {
            const Icon = iconMap[cat.slug];
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

            const customImg = categoryImages[cat.slug];
            const activeBg = customImg || defaultCategoryImages[cat.slug] || "/hero_background.jpg";

            return (
              <Link
                key={cat.slug}
                to="/$category"
                params={{ category: cat.slug }}
                className={`${sizeClass} block`}
              >
                <ScrollReveal delay={i * 60} className="h-full">
                  <TiltCard className="h-full group relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 card-tile min-h-[200px] sm:min-h-[240px] flex flex-col justify-between border border-border/40 hover:shadow-2xl transition-all duration-500 shadow-sm">
                    {/* Background image loaded dynamically */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 pointer-events-none z-0"
                      style={{ backgroundImage: `url('${activeBg}')` }}
                    />
                    {/* Gradient Overlay for card text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/45 to-black/25 group-hover:from-black/90 group-hover:via-black/50 group-hover:to-black/35 transition-all duration-300 pointer-events-none z-0" />

                    <div className="relative z-10 flex flex-col h-full justify-between flex-1">
                      <div className="flex items-start justify-between">
                        <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md text-white shadow-sm">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/10 border border-white/10 backdrop-blur-md text-white">
                          {cat.examCount} exams
                        </span>
                      </div>

                      <div className="mt-6 sm:mt-8 text-white">
                        <div className="font-display text-xl sm:text-3xl font-bold tracking-tight">
                          {cat.name}
                        </div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-wider mt-1 text-white/70 font-semibold">
                          {cat.fullName}
                        </div>
                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm max-w-md text-white/80 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                        <div className="mt-4 sm:mt-6 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-white group-hover:gap-2 transition-all">
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

      {/* TESTIMONIALS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-24">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 rounded-full px-3 py-1">
              Aspirants feedback
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight mt-3 sm:mt-4">
              Loved by Thousands of Achievers
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden transition-transform duration-300 hover:scale-[1.01] hover:border-amber-500/25"
              >
                <Quote className="absolute top-6 right-6 h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/10 pointer-events-none" />
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating)].map((_, rIdx) => (
                        <Star key={rIdx} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <span className="text-[9px] sm:text-[9.5px] text-muted-foreground font-mono">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-display font-bold text-sm sm:text-base leading-tight text-foreground">
                    {rev.review_title}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium line-clamp-4">
                    "{rev.review_description}"
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-border/30 pt-3.5 sm:pt-4">
                  {rev.profile_image ? (
                    <img
                      src={rev.profile_image}
                      alt={rev.user_name}
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-amber-500/20"
                    />
                  ) : (
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs sm:text-sm uppercase border border-amber-500/20">
                      {rev.user_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-display text-xs sm:text-sm font-bold">{rev.user_name}</div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase">
                      Verified Aspirant
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="col-span-1 md:col-span-3 py-12 sm:py-16 text-center text-xs text-muted-foreground bg-card/25 border border-border/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-2xl mx-auto shadow-sm">
                No user reviews available yet. Be the first to share your experience.
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* NOTIFICATIONS STRIP */}
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 sm:mt-24">
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-5 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500 mb-1.5 flex items-center gap-2 group cursor-default">
                <Bell className="h-3.5 w-3.5 group-hover:animate-bell-shake transition-transform" />{" "}
                Updates
              </div>
              <h3 className="text-xl sm:text-3xl font-display font-bold">Latest notifications</h3>
            </div>
            <Link to="/notifications" className="text-xs sm:text-sm font-bold text-amber-500 hover:underline self-start sm:self-auto">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border/30">
            {latestNotifs.map((n, i) => (
              <li
                key={i}
                className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-muted/40 px-3 rounded-xl transition duration-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="inline-flex h-5 items-center rounded-full bg-primary/8 text-primary px-2.5 font-bold uppercase tracking-wider text-[9px] border border-primary/10">
                      {n.exam}
                    </span>
                    <span className="font-medium text-[10px]">{n.date}</span>
                  </div>
                  <div className="font-semibold text-sm sm:text-base text-foreground leading-snug">{n.title}</div>
                </div>
                <Link
                  to="/$category/$exam"
                  params={{ category: n.category, exam: n.examSlug }}
                  className="w-full sm:w-auto text-center shrink-0 text-xs font-bold text-amber-500 hover:underline bg-amber-500/10 px-3.5 py-2 rounded-lg border border-amber-500/20 min-h-[44px] flex items-center justify-center"
                >
                  Open Details
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ScrollReveal>

      {/* EXPANDABLE STICKY FLOATING ACTION BUTTON */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2 bg-card border border-border/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl"
            >
              <Link
                to="/exams"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl hover:bg-muted text-xs font-bold transition text-foreground"
              >
                <GraduationCap className="h-4.5 w-4.5 text-amber-500" />
                Prep Library
              </Link>
              <Link
                to="/notifications"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl hover:bg-muted text-xs font-bold transition text-foreground"
              >
                <Bell className="h-4.5 w-4.5 text-amber-500" />
                Active Alerts
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl hover:bg-muted text-xs font-bold transition text-foreground"
              >
                <HelpCircle className="h-4.5 w-4.5 text-amber-500" />
                Support Hub
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-amber-400/20"
          aria-label="Expand quick menu"
        >
          <motion.div
            animate={{ rotate: menuOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Sparkles className="h-5.5 w-5.5" />
          </motion.div>
        </button>
      </div>

      <div className="h-14 sm:h-20" />
    </SiteLayout>
  );
}

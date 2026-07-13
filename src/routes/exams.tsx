import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { categories, allExams } from "@/data/exams";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  GraduationCap,
  ArrowRight,
  Filter,
  Calendar,
  X,
  Clock,
  HelpCircle,
  RefreshCw,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [{ title: "Search Exams — CrackSpark" }] }),
  component: ExamsPage,
});

const POPULAR_SEARCHES = ["SSC CGL", "TNPSC Group 2", "UPSC IAS", "RRB NTPC"];

function ExamsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, bookmarks, toggleBookmark } = useAuth();
  const location = useRouterState({ select: (s) => s.location });

  // 1. Auth Guard (Redirects unauthenticated users)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({
        to: "/user-login",
        search: {
          redirect: location.pathname,
          message: "Please login to continue.",
        },
      });
    }
  }, [user, authLoading, navigate, location]);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [qualification, setQualification] = useState<string>("all");
  const [maxAge, setMaxAge] = useState<number>(45);
  const [state, setState] = useState<string>("all");
  const [examMonth, setExamMonth] = useState<string>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Loading skeleton screen trigger
  const [loading, setLoading] = useState(true);

  // Trigger loading screen on initial mount
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Trigger mock loading screen on filter change to showcase skeletons
  const triggerFilterLoad = () => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  };

  // Load recent searches (Supabase only)
  useEffect(() => {
    if (user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const stored = session?.user?.user_metadata?.recent_searches;
        if (Array.isArray(stored)) {
          setRecentSearches(stored);
        }
      });
    }
  }, [user]);

  const saveSearch = async (term: string) => {
    if (!term.trim() || !user) return;
    const filtered = recentSearches.filter((s) => s !== term);
    const next = [term, ...filtered].slice(0, 5);
    setRecentSearches(next);

    try {
      await supabase.auth.updateUser({
        data: { recent_searches: next },
      });
    } catch (err) {
      console.warn("Failed to sync search history with Supabase:", err);
    }
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    if (user) {
      try {
        await supabase.auth.updateUser({
          data: { recent_searches: [] },
        });
      } catch (err) {
        console.warn("Failed to clear search history with Supabase:", err);
      }
    }
  };

  const handleSearchSubmit = (term: string) => {
    setQ(term);
    saveSearch(term);
    setShowSuggestions(false);
    triggerFilterLoad();
  };

  // Filter exams dynamically
  const filtered = useMemo(() => {
    return allExams.filter((e) => {
      const matchQ =
        !q || (e.name + e.fullName + e.description).toLowerCase().includes(q.toLowerCase());
      const matchCat = cat === "all" || e.category === cat;

      let matchQual = true;
      if (qualification !== "all") {
        const qualLower = e.qualification.toLowerCase();
        if (qualification === "10th") {
          matchQual = qualLower.includes("10th") || qualLower.includes("matric");
        } else if (qualification === "12th") {
          matchQual =
            qualLower.includes("12th") ||
            qualLower.includes("higher secondary") ||
            qualLower.includes("10+2");
        } else if (qualification === "degree") {
          matchQual =
            qualLower.includes("degree") ||
            qualLower.includes("bachelor") ||
            qualLower.includes("graduate") ||
            qualLower.includes("diploma");
        } else if (qualification === "engineering") {
          matchQual =
            qualLower.includes("engineering") ||
            qualLower.includes("b.e.") ||
            qualLower.includes("b.tech") ||
            qualLower.includes("diploma");
        }
      }

      const matchAge =
        !e.ageLimit ||
        (() => {
          const m = e.ageLimit.match(/(\d+)\s*-\s*(\d+)/) || e.ageLimit.match(/up to\s*(\d+)/);
          if (m) {
            const limit = parseInt(m[2] || m[1]);
            return limit <= maxAge;
          }
          return true;
        })();

      let matchState = true;
      if (state !== "all") {
        if (state === "Tamil Nadu") {
          matchState = e.category === "tnpsc";
        } else {
          matchState = e.category !== "tnpsc";
        }
      }

      let matchMonth = true;
      if (examMonth !== "all") {
        const prelimsDateObj = e.importantDates.find(
          (d) =>
            d.label.toLowerCase().includes("prelims") ||
            d.label.toLowerCase().includes("notification"),
        );
        const examDateString = prelimsDateObj ? prelimsDateObj.date : "";
        matchMonth = examDateString.toLowerCase().includes(examMonth.toLowerCase());
      }

      return matchQ && matchCat && matchQual && matchAge && matchState && matchMonth;
    });
  }, [q, cat, qualification, maxAge, state, examMonth]);

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    return allExams
      .filter((e) => (e.name + e.fullName).toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5);
  }, [q]);

  const hasActiveFilters = useMemo(() => {
    return (
      cat !== "all" ||
      qualification !== "all" ||
      maxAge !== 45 ||
      state !== "all" ||
      examMonth !== "all"
    );
  }, [cat, qualification, maxAge, state, examMonth]);

  // Card difficulties mapping helper
  const getExamDifficulty = (category: string) => {
    if (category === "upsc")
      return { label: "Very Hard", color: "bg-red-500/10 text-red-500 border-red-500/15" };
    if (category === "ssc" || category === "defence" || category === "tnpsc") {
      return { label: "Hard", color: "bg-orange-500/10 text-orange-500 border-orange-500/15" };
    }
    return { label: "Medium", color: "bg-amber-500/10 text-amber-600 border-amber-500/15" };
  };

  if (authLoading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-display text-foreground">Loading...</h2>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!user) return null;

  return (
    <SiteLayout>
      {/* Light gradient page wrapper background with blurred circle elements */}
      <div className="bg-gradient-to-b from-background via-muted/20 to-background min-h-screen relative overflow-hidden">
        {/* Soft Background circles */}
        <div className="absolute top-1/4 left-1/10 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/10 h-[500px] w-[500px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        {/* HERO SECTION */}
        <section className="relative py-20 lg:py-28 bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 text-white overflow-hidden">
          {/* Floating abstract decorative shapes inside hero banner */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-[-50px] left-[-50px] h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute bottom-[-100px] right-[-50px] h-96 w-96 rounded-full bg-gold-shine/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4.5 py-1.5 text-xs font-semibold backdrop-blur-md tracking-wider uppercase mb-6">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> CrackSpark Search Engine
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Search Government Exams
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/75 max-w-2xl mx-auto font-medium">
              Discover government exams based on qualifications, age, and career goals.
            </p>

            {/* REDESIGNED SEARCH CONTAINER WITH GLASSMORPHISM */}
            <div className="mt-10 max-w-3xl mx-auto relative">
              <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                  <input
                    value={q}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSubmit(q);
                    }}
                    placeholder="Search exams (e.g. IAS, CGL, Clerk, PO)…"
                    className="w-full h-12 rounded-xl bg-transparent pl-11 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                  {q && (
                    <button
                      onClick={() => {
                        setQ("");
                        triggerFilterLoad();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={cn(
                    "h-12 px-5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all relative select-none",
                    showFilters
                      ? "bg-white text-emerald-950 border-white"
                      : "bg-white/15 border-white/10 text-white hover:bg-white/20",
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => handleSearchSubmit(q)}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-gold-shine to-gold text-gold-foreground font-bold hover:opacity-95 transition shadow-md select-none"
                >
                  Search
                </button>
              </div>

              {/* Suggestions Panel */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-border bg-card p-2 text-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold px-3 py-1.5 border-b border-border mb-1">
                    Suggestions
                  </div>
                  {suggestions.map((s) => (
                    <button
                      key={`${s.category}-${s.slug}`}
                      onClick={() => {
                        navigate({
                          to: "/$category/$exam",
                          params: { category: s.category, exam: s.slug },
                        });
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs rounded-lg hover:bg-muted flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{s.fullName}</span>
                        <span className="text-muted-foreground ml-1">({s.name})</span>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                        {s.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular searches chips layout */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs text-white/80">
              <span className="font-medium text-white/50">Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearchSubmit(term)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/5 text-white transition font-medium select-none"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-white/70">
                <span className="flex items-center gap-1 font-medium text-white/40">
                  <Clock className="h-3.5 w-3.5" /> Recent:
                </span>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearchSubmit(term)}
                    className="px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/90 transition select-none"
                  >
                    {term}
                  </button>
                ))}
                <button
                  onClick={clearRecentSearches}
                  className="text-white/40 hover:text-white underline ml-1.5 text-[11px]"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </section>

        {/* COLLAPSIBLE FILTER DRAWER */}
        <section className="mx-auto max-w-7xl px-8">
          {showFilters && (
            <div className="mt-8 rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-lg animate-in slide-in-from-top-6 duration-300 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-foreground">
                  <Filter className="h-4.5 w-4.5 text-primary" /> Advanced Filters
                </div>
                <button
                  onClick={() => {
                    setCat("all");
                    setQualification("all");
                    setMaxAge(45);
                    setState("all");
                    setExamMonth("all");
                    triggerFilterLoad();
                  }}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Reset all filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* 1. Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Category
                  </label>
                  <select
                    value={cat}
                    onChange={(e) => {
                      setCat(e.target.value);
                      triggerFilterLoad();
                    }}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} — {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Qualification */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Qualification
                  </label>
                  <select
                    value={qualification}
                    onChange={(e) => {
                      setQualification(e.target.value);
                      triggerFilterLoad();
                    }}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Any qualification</option>
                    <option value="10th">10th Pass</option>
                    <option value="12th">12th / HSC Pass</option>
                    <option value="degree">Any Graduate Degree</option>
                    <option value="engineering">Engineering / Technical</option>
                  </select>
                </div>

                {/* 3. Max Age */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Max Age
                    </label>
                    <span className="text-xs font-bold text-primary">{maxAge} Years</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="45"
                    value={maxAge}
                    onChange={(e) => {
                      setMaxAge(Number(e.target.value));
                      triggerFilterLoad();
                    }}
                    className="w-full accent-primary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>20 yr</span>
                    <span>45 yr</span>
                  </div>
                </div>

                {/* 4. State/Region */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    State / Region
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      triggerFilterLoad();
                    }}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All regions</option>
                    <option value="Central">Central (National)</option>
                    <option value="Tamil Nadu">Tamil Nadu State</option>
                  </select>
                </div>

                {/* 5. Exam Month */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Exam Month
                  </label>
                  <select
                    value={examMonth}
                    onChange={(e) => {
                      setExamMonth(e.target.value);
                      triggerFilterLoad();
                    }}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Any month</option>
                    <option value="Jan">January</option>
                    <option value="Feb">February</option>
                    <option value="Mar">March</option>
                    <option value="Apr">April</option>
                    <option value="May">May</option>
                    <option value="Jun">June</option>
                    <option value="Jul">July</option>
                    <option value="Aug">August</option>
                    <option value="Sep">September</option>
                    <option value="Oct">October</option>
                    <option value="Nov">November</option>
                    <option value="Dec">December</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RESULTS GRID / SKELETON SCREENS */}
        <section className="mx-auto max-w-7xl px-8 py-12">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Found <strong>{filtered.length}</strong> exam{filtered.length === 1 ? "" : "s"}{" "}
              matching your criteria.
            </div>

            {/* Trending status badge */}
            <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-bold bg-gold/10 px-3 py-1 rounded-full border border-gold/15">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
              <span>Trending Exams Active</span>
            </div>
          </div>

          {q.trim() !== "" && (
            <div className="flex flex-wrap gap-2 border-b border-border pb-6 mb-8 overflow-x-auto">
              {[
                { id: "exams", label: "Exams", count: filtered.length, Icon: GraduationCap },
                { id: "notifications", label: "Notifications", count: globalResults.notifications.length, Icon: Bell },
                { id: "materials", label: "Study Materials", count: globalResults.materials.length, Icon: FileText },
                { id: "papers", label: "Previous Papers", count: globalResults.papers.length, Icon: Newspaper },
                { id: "affairs", label: "Current Affairs", count: globalResults.affairs.length, Icon: Globe },
                { id: "faqs", label: "FAQs", count: globalResults.faqs.length, Icon: HelpCircle },
              ].map((tab) => {
                const active = activeSearchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSearchTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                        : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <tab.Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono",
                      active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {globalLoading ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <RefreshCw className="h-7 w-7 text-primary animate-spin mb-2" />
              <p className="text-xs text-muted-foreground">Searching portal catalog...</p>
            </div>
          ) : (!q.trim() || activeSearchTab === "exams") ? (

          /* SKELETON LOADING STATE */
          loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between h-[360px] animate-pulse"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 bg-muted rounded-xl" />
                      <div className="h-5 w-14 bg-muted rounded-full" />
                    </div>
                    <div className="h-6 w-3/4 bg-muted rounded-md mt-6" />
                    <div className="h-4 w-full bg-muted rounded-md mt-4" />
                    <div className="h-4 w-5/6 bg-muted rounded-md mt-2" />
                    <div className="mt-6 border-t border-border pt-4 grid grid-cols-2 gap-4">
                      <div className="h-10 bg-muted rounded-xl" />
                      <div className="h-10 bg-muted rounded-xl" />
                    </div>
                  </div>
                  <div className="h-10 w-full bg-muted rounded-xl mt-6" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card shadow-sm max-w-xl mx-auto">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="mt-4 font-display font-bold text-xl">No exams match your search</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-normal">
                No recruitments were found. Try updating your filters or changing search keywords.
              </p>
              <button
                onClick={() => {
                  setQ("");
                  setCat("all");
                  setQualification("all");
                  setMaxAge(45);
                  setState("all");
                  setExamMonth("all");
                  triggerFilterLoad();
                }}
                className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold hover:bg-primary/95 transition select-none"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* REDESIGNED PREMIUM EXAM CARDS */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e, index) => {
                const c = categories.find((x) => x.slug === e.category)!;
                const bookmarkKey = `${e.category}/${e.slug}`;
                const isBookmarked = bookmarks.includes(bookmarkKey);
                const diff = getExamDifficulty(e.category);

                return (
                  <div
                    key={`${e.category}-${e.slug}`}
                    className="card-tile rounded-3xl border border-border bg-card p-6 flex flex-col justify-between group shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(56,189,248,0.08)] hover:-translate-y-2 hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Glowing highlight ring on card hover */}
                    <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 rounded-3xl pointer-events-none transition-all duration-300" />

                    {e.category === "tnpsc" && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:55%_auto] z-0" 
                        style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
                      />
                    )}
                    {e.category === "upsc" && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                        style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
                      />
                    )}
                    {e.category === "ssc" && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                        style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
                      />
                    )}
                    {e.category === "rrb" && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                        style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
                      />
                    )}
                    {(e.category === "ibps" || e.category === "sbi") && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                        style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
                      />
                    )}
                    {e.category === "defence" && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                        style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
                      />
                    )}

                    <div className="relative z-10">
                      {/* Top Row: Icon, category, notifications, bookmarks */}
                      <div className="flex items-center justify-between relative z-20">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
                          <GraduationCap className="h-5.5 w-5.5" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* New Update Notification Badge */}
                          {e.notifications && e.notifications.length > 0 && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <span className="h-1 w-1 bg-emerald-500 rounded-full" /> New Update
                            </span>
                          )}

                          {/* Category Badge */}
                          <span className="text-[10px] font-bold uppercase tracking-wider rounded-full bg-gold/10 border border-gold/15 text-gold-foreground px-2.5 py-0.5">
                            {c.name}
                          </span>

                          {/* Bookmark Toggle Button (Click protected to prevent link firing) */}
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleBookmark(bookmarkKey);
                            }}
                            className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors ml-1"
                            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                          >
                            <Bookmark
                              className={cn(
                                "h-4 w-4 transition-transform active:scale-75",
                                isBookmarked
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground",
                              )}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="mt-5 font-display text-xl font-bold group-hover:text-primary transition-colors leading-tight">
                        {e.fullName}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {e.description}
                      </p>

                      {/* Badges row: Difficulty */}
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "text-[9px] font-semibold uppercase tracking-wider border px-2 py-0.5 rounded-md",
                            diff.color,
                          )}
                        >
                          {diff.label} Difficulty
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider bg-slate-500/10 text-slate-600 border border-slate-500/15 px-2 py-0.5 rounded-md">
                          Active Recruitment
                        </span>
                      </div>

                      {/* Spaced metadata details */}
                      <div className="mt-5 border-t border-border pt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-[11px] text-muted-foreground font-medium">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                            Qualification
                          </span>
                          <span className="font-semibold text-foreground truncate block">
                            {e.qualification}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                            Age Limit
                          </span>
                          <span className="font-semibold text-foreground truncate block">
                            {e.ageLimit}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                            Last Date to Apply
                          </span>
                          <span className="font-semibold text-foreground truncate block">
                            31 Jul 2026
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                            Vacancies
                          </span>
                          <span className="font-semibold text-primary truncate block font-bold">
                            1,250+ posts
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3 relative z-20">
                      {/* Official Link (Stop propagation so it opens in a new tab without shifting page) */}
                      <a
                        href={e.officialUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
                      >
                        Official Site <ExternalLink className="h-3 w-3" />
                      </a>

                      {/* View Details Link */}
                      <Link
                        to="/$category/$exam"
                        params={{ category: e.category, exam: e.slug }}
                        className="inline-flex h-9 items-center gap-1 rounded-xl bg-primary/8 text-primary px-4 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-300 group-hover:gap-1.5 select-none"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )) : (
            <>
              {activeSearchTab === "notifications" && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {globalResults.notifications.map((item) => (
                    <Link
                      key={item.id}
                      to="/notifications"
                      className="block p-5 rounded-2xl border border-border bg-card hover:bg-muted/10 transition shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                          <Bell className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase tracking-wider">
                              {item.category || "General"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium font-mono">
                              📅 {new Date(item.publish_date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-sm text-foreground mt-2">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {globalResults.notifications.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      No matching notifications found for "{q}".
                    </div>
                  )}
                </div>
              )}

              {(activeSearchTab === "materials" || activeSearchTab === "papers") && (
                <div className="grid gap-4 sm:grid-cols-2 max-w-5xl mx-auto">
                  {(activeSearchTab === "materials" ? globalResults.materials : globalResults.papers).map((item) => {
                    const isLocked = item.is_premium && !isSubscribed;
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between gap-4 shadow-sm group hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                            {activeSearchTab === "materials" ? <FileText className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">
                              {item.subject}
                            </span>
                            <h4 className="font-semibold text-xs text-foreground truncate mt-0.5 pr-2">{item.title}</h4>
                          </div>
                        </div>
                        
                        {isLocked ? (
                          <Link
                            to="/subscription"
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition flex items-center gap-1 shrink-0 animate-pulse"
                          >
                            🔒 Premium Lock
                          </Link>
                        ) : (
                          <a
                            href={item.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-primary/8 border border-primary/10 text-[10px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition flex items-center gap-1 shrink-0"
                          >
                            📥 Download PDF
                          </a>
                        )}
                      </div>
                    );
                  })}
                  {(activeSearchTab === "materials" ? globalResults.materials : globalResults.papers).length === 0 && (
                    <div className="col-span-2 text-center py-12 text-muted-foreground text-xs">
                      No matching resources found for "{q}".
                    </div>
                  )}
                </div>
              )}

              {activeSearchTab === "affairs" && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {globalResults.affairs.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] text-muted-foreground font-medium font-mono">
                            📅 {new Date(item.publish_date).toLocaleDateString()}
                          </span>
                          {item.pdf_url && (
                            <a
                              href={item.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              📥 Download PDF
                            </a>
                          )}
                        </div>
                        <h4 className="font-display font-bold text-sm text-foreground mt-2">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      </div>
                    </div>
                  ))}
                  {globalResults.affairs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      No matching current affairs found for "{q}".
                    </div>
                  )}
                </div>
              )}

              {activeSearchTab === "faqs" && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {globalResults.faqs.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase shrink-0 font-display">
                          Q
                        </span>
                        <h4 className="font-semibold text-xs text-foreground mt-0.5">{item.question}</h4>
                      </div>
                      <div className="h-px bg-border/40" />
                      <div className="flex items-start gap-2.5 text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold uppercase shrink-0 font-display">
                          A
                        </span>
                        <p className="text-xs leading-relaxed mt-0.5">{item.answer}</p>
                      </div>
                    </div>
                  ))}
                  {globalResults.faqs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      No matching FAQs found for "{q}".
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

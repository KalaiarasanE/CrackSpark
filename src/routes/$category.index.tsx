import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import type { Exam, ExamCategory } from "@/data/exams";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

import { getCategory, getExamsByCategory } from "@/data/exams";
import {
  ArrowRight,
  GraduationCap,
  CalendarDays,
  BookOpen,
  ChevronRight,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/$category/")({
  loader: ({ params }) => {
    const cat = getCategory(params.category);
    if (!cat) throw notFound();
    return { cat, exams: getExamsByCategory(params.category) };
  },
  head: ({ params }) => {
    const cat = getCategory(params.category);
    return {
      meta: [
        { title: cat ? `${cat.name} Exams — CrackSpark` : "Category — CrackSpark" },
        { name: "description", content: cat?.description ?? "" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { cat, exams } = Route.useLoaderData() as { cat: ExamCategory; exams: Exam[] };
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!user) {
      navigate({
        to: "/user-login",
        search: {
          redirect: location.pathname,
          message: "Please login to continue.",
        },
      });
    }
  }, [user, navigate, location]);

  if (!user) return null;

  const isDefence = cat.slug === "defence";

  // Military-inspired gradient for Defence header, default mesh for others
  const headerBgClass = isDefence
    ? "bg-gradient-to-br from-[#102a14] via-[#091526] to-[#2a200a] border-b border-amber-500/10 text-white"
    : "bg-mesh-emerald text-white";

  return (
    <SiteLayout>
      {/* Header */}
      <section className={headerBgClass}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <nav className="text-xs text-white/60 flex items-center gap-1 mb-6">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{cat.name}</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            {cat.examCount} exams available
          </div>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold">
            {cat.name}
          </h1>
          <div className="mt-2 text-base text-gold font-medium">{cat.fullName}</div>
          <p className="mt-5 max-w-2xl text-white/75">{cat.description}</p>
        </div>
      </section>

      {/* Exams grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
            All exams under {cat.name}
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Choose an exam to begin</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e: Exam) => {
            const Icon = isDefence ? Shield : GraduationCap;
            const iconWrapperClass = isDefence
              ? "bg-[#102a14]/15 text-[#2e6f40] border border-[#2e6f40]/25"
              : "bg-primary/8 text-primary";
            const badgeClass = isDefence
              ? "bg-[#2a200a]/20 text-[#a37f26] border border-[#a37f26]/20 font-semibold"
              : "bg-gold/15 text-gold-foreground";

            return (
              <Link
                key={e.slug}
                to="/$category/$exam"
                params={{ category: cat.slug, exam: e.slug }}
                className="card-tile card-tile-hover group p-6 flex flex-col relative overflow-hidden"
              >
                {cat.slug === "tnpsc" && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                    style={{ backgroundImage: `url('/tnpsc_watermark.png')` }}
                  />
                )}
                {cat.slug === "upsc" && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                    style={{ backgroundImage: `url('/upsc_watermark.jpeg')` }}
                  />
                )}
                {cat.slug === "ssc" && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                    style={{ backgroundImage: `url('/ssc_watermark.jpeg')` }}
                  />
                )}
                {cat.slug === "rrb" && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                    style={{ backgroundImage: `url('/rrb_watermark.jpeg')` }}
                  />
                )}
                {(cat.slug === "ibps" || cat.slug === "sbi") && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                    style={{ backgroundImage: `url('/banking_watermark.jpeg')` }}
                  />
                )}
                {cat.slug === "defence" && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.04] bg-center bg-no-repeat bg-[length:80%_auto] z-0" 
                    style={{ backgroundImage: `url('/defence_watermark.jpeg')` }}
                  />
                )}
                <div className="flex items-start justify-between relative z-10">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-xl ${iconWrapperClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1 ${badgeClass}`}
                  >
                    {cat.name}
                  </span>
                </div>
                <div className="mt-5 relative z-10">
                  <h3 className="font-display text-2xl font-bold">{e.name}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">{e.fullName}</div>
                  <p className="mt-3 text-sm text-foreground/70">{e.description}</p>
                </div>

                <dl className="mt-5 space-y-2.5 text-xs relative z-10">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <div>
                      <dt className="inline text-muted-foreground">Age: </dt>
                      <dd className="inline font-medium">{e.ageLimit}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <div>
                      <dt className="inline text-muted-foreground">Qualification: </dt>
                      <dd className="inline font-medium">{e.qualification}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <div>
                      <dt className="inline text-muted-foreground">Selection: </dt>
                      <dd className="inline font-medium">{e.selectionProcess.join(" → ")}</dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-auto pt-5 flex items-center justify-between relative z-10">
                  <span className="text-sm font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Explore Exam <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchCurrentApplications,
  invalidateCurrentApplicationsCache,
  type CurrentApplication,
} from "@/lib/current-applications";

export const Route = createFileRoute("/current-applications")({
  loader: async () => {
    try {
      const applications = await fetchCurrentApplications();
      return { applications };
    } catch {
      return { applications: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "Current Applications — CrackSpark" },
      {
        name: "description",
        content:
          "Explore active government exam applications, direct official links, and registration deadlines across India.",
      },
    ],
  }),
  component: CurrentApplicationsPage,
});

function CurrentApplicationsPage() {
  const loaderData = Route.useLoaderData();
  const [applications, setApplications] = useState<CurrentApplication[]>(
    loaderData?.applications || []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncApplications = async (force = false) => {
      try {
        const apps = await fetchCurrentApplications(force);
        if (isMounted) {
          setApplications(apps);
        }
      } catch (err) {
        console.warn("Failed to sync current applications:", err);
      }
    };

    // Fresh sync on mount
    syncApplications(true);

    const onLocalUpdate = () => {
      syncApplications(true);
    };
    window.addEventListener("current-applications-updated", onLocalUpdate);

    const channel = supabase
      .channel("page_current_applications_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_details" },
        (payload: any) => {
          const key = payload?.new?.exam_key || payload?.old?.exam_key;
          if (typeof key === "string" && key.startsWith("current_app:")) {
            invalidateCurrentApplicationsCache();
            syncApplications(true);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "current_applications" },
        () => {
          invalidateCurrentApplicationsCache();
          syncApplications(true);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener("current-applications-updated", onLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SiteLayout>
      {/* HEADER HERO SECTION */}
      <section className="bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-background border-b border-border/60 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 px-3.5 py-1 text-xs font-bold shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            <span>Active Recruitment Portal</span>
          </div>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Current Applications
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Live recruitment notifications, direct official application links, and active deadlines across all major government exams.
          </p>
        </div>
      </section>

      {/* DEDICATED VERTICAL APPLICATION LIST */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-14">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Loading applications...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-5 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 rounded-full px-3 py-1 shadow-2xs">
                    <Sparkles className="h-3 w-3 text-orange-500" />
                    NEW APPLICATION RELEASED
                  </span>
                </div>

                {/* Application / Exam Title */}
                <h2 className="font-display font-bold text-lg sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-snug">
                  {app.title}
                </h2>

                {/* Short Description */}
                {app.description && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                    {app.description}
                  </p>
                )}

                {/* Dates Row: Starting Date (LEFT) and Last Date (RIGHT) + Apply Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                  {/* Starting Date on LEFT */}
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">Starting Date:</span>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">{app.start_date}</span>
                  </div>

                  {/* Last Date on RIGHT + Apply Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">Last Date:</span>
                      <span className="text-red-600 dark:text-red-400 font-semibold">{app.end_date}</span>
                    </div>

                    {app.website_url ? (
                      <a
                        href={app.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer shrink-0"
                      >
                        <span>Apply</span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-muted text-muted-foreground px-4 py-2 text-xs sm:text-sm font-medium cursor-not-allowed shrink-0"
                      >
                        <span>Apply</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {applications.length === 0 && (
              <div className="py-14 sm:py-20 text-center text-xs sm:text-sm text-muted-foreground bg-card border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8">
                <Sparkles className="h-8 w-8 text-orange-400/60 mx-auto mb-3" />
                <h3 className="text-base font-bold text-foreground">No Current Applications Active</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  There are no active recruitment applications at this moment. Please check back soon or visit the exams directory.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

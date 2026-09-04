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
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Loading applications...</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {applications.map((app) =>
              app.website_url ? (
                <a
                  key={app.id}
                  href={app.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-border/80 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all duration-200 text-xs shadow-2xs cursor-pointer"
                >
                  {/* Left: Icon + Content */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Notification / Application Icon */}
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 relative">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      {/* Metadata Row: Category/Status Badge, Dates */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground leading-none mb-1">
                        <span className="inline-flex h-4 items-center rounded-full bg-gold/15 text-gold-foreground px-1.5 text-[9px] font-bold uppercase tracking-wider">
                          New Application
                        </span>
                        {app.start_date && (
                          <>
                            <span className="font-mono text-[10px] text-muted-foreground/80">Start: {app.start_date}</span>
                            <span className="text-muted-foreground/40">•</span>
                          </>
                        )}
                        {app.end_date && (
                          <span className="font-medium text-[10px] text-red-500 dark:text-red-400">
                            Last Date: {app.end_date}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="font-bold text-xs sm:text-sm text-foreground truncate leading-snug">
                        {app.title}
                      </h2>

                      {/* Description */}
                      {app.description && (
                        <div className="text-muted-foreground text-[11px] sm:text-xs truncate leading-normal mt-0.5">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Open Action */}
                  <div className="shrink-0 pl-2 flex items-center">
                    <span className="text-xs font-semibold inline-flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform">
                      Open →
                    </span>
                  </div>
                </a>
              ) : (
                <div
                  key={app.id}
                  className="group flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-border/80 bg-card text-xs shadow-2xs"
                >
                  {/* Left: Icon + Content */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground shrink-0 relative">
                      <Sparkles className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground leading-none mb-1">
                        <span className="inline-flex h-4 items-center rounded-full bg-gold/15 text-gold-foreground px-1.5 text-[9px] font-bold uppercase tracking-wider">
                          Application
                        </span>
                        {app.start_date && (
                          <>
                            <span className="font-mono text-[10px] text-muted-foreground/80">Start: {app.start_date}</span>
                            <span className="text-muted-foreground/40">•</span>
                          </>
                        )}
                        {app.end_date && (
                          <span className="font-medium text-[10px] text-muted-foreground">
                            Last Date: {app.end_date}
                          </span>
                        )}
                      </div>

                      <h2 className="font-bold text-xs sm:text-sm text-foreground truncate leading-snug">
                        {app.title}
                      </h2>

                      {app.description && (
                        <div className="text-muted-foreground text-[11px] sm:text-xs truncate leading-normal mt-0.5">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Closed Status */}
                  <div className="shrink-0 pl-2 flex items-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Closed
                    </span>
                  </div>
                </div>
              ),
            )}

            {/* Empty State */}
            {applications.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground bg-card border border-border/80 rounded-xl">
                <Sparkles className="h-6 w-6 text-orange-400/60 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-foreground">No Current Applications Active</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  There are no active recruitment applications at this moment.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

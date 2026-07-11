import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import { allExams, categories } from "@/data/exams";
import { Bookmark, GraduationCap, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — CrackSpark" }] }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { user, loading, bookmarks, toggleBookmark } = useAuth();
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

  if (loading) {
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

  const saved = allExams.filter((e) => bookmarks.includes(`${e.category}/${e.slug}`));

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-4xl font-bold">My Bookmarks</h1>
        <p className="mt-2 text-muted-foreground">
          {saved.length} saved exam{saved.length === 1 ? "" : "s"}.
        </p>

        {saved.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">
              You haven't bookmarked anything yet.
            </p>
            <Link
              to="/exams"
              className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold"
            >
              Browse exams
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((e) => {
              const c = categories.find((x) => x.slug === e.category)!;
              return (
                <div
                  key={`${e.category}/${e.slug}`}
                  className="card-tile card-tile-hover p-6 flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <button
                      onClick={() => toggleBookmark(`${e.category}/${e.slug}`)}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-primary"
                      aria-label="Remove"
                    >
                      <Bookmark className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                  <div className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.name}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-bold">{e.fullName}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                  <Link
                    to="/$category/$exam"
                    params={{ category: e.category, exam: e.slug }}
                    className="mt-auto pt-4 text-sm font-semibold text-primary inline-flex items-center gap-1"
                  >
                    Open exam <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

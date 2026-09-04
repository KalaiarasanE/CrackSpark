import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { allNotifications } from "@/data/exams";
import { Bell, Lock, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CrackSpark" }] }),
  component: NotificationsPage,
});

const ADMIN_NOTIFICATION_TYPES = [
  "new_user",
  "new_login",
  "premium_request",
  "premium_expired",
  "screenshot_upload",
  "renewal_request",
  "feedback",
  "review",
  "contact",
  "failed_login",
  "system_error",
  "storage_warning",
];

const USER_NOTIFICATION_TYPES = [
  "announcement",
  "study_material",
  "mock_test",
  "current_affairs",
  "previous_papers",
  "paper",
  "exam_update",
  "exam",
  "notification",
  "premium_activated",
  "premium_rejected",
  "premium_cancelled",
  "subscription_expired",
  "profile_update",
  "password_changed",
  "account_verification",
  "expiry_reminder",
];

type NotificationItem = {
  id?: string;
  title: string;
  category: string;
  publish_date?: string;
  date?: string;
  tag?: string;
  exam?: string;
  examSlug?: string;
};

function NotificationsPage() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const markAsRead = async (id?: string) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, tag: "Read", is_read: true } : n)),
        );
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.warn("Failed to mark as read:", e);
    }
  };

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

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      try {
        console.log("[Notifications Page] Fetching notifications from Supabase...");

        // 1. Fetch portal-wide exam announcements
        const { data: portalNotifs } = await supabase
          .from("notifications")
          .select("*")
          .order("publish_date", { ascending: false })
          .limit(100);

        // 2. Fetch user-specific notifications
        let userQuery = supabase.from("user_notifications").select("*");
        if (user.role === "admin") {
          userQuery = userQuery.in("type", ADMIN_NOTIFICATION_TYPES);
        } else {
          userQuery = userQuery.or(`user_id.eq.${user.id},user_id.is.null`);
        }
        const { data: userNotifs } = await userQuery
          .order("created_at", { ascending: false })
          .limit(50);

        const mappedPortal = (portalNotifs || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.description || n.title,
          category: n.category || "General",
          date: n.publish_date ? new Date(n.publish_date).toLocaleDateString() : "Recent",
          tag: n.category || "Announcement",
          exam: n.category || "General",
          examSlug: "",
          is_read: true,
          link_to: "/exams",
        }));

        const filteredUser =
          user.role === "admin"
            ? userNotifs || []
            : (userNotifs || []).filter(
                (n) =>
                  n.user_id === user.id ||
                  (n.user_id === null && USER_NOTIFICATION_TYPES.includes(n.type)),
              );

        const mappedUser = filteredUser.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.message,
          category: n.type.replace("_", " ").toUpperCase(),
          date: new Date(n.created_at).toLocaleDateString(),
          tag: n.is_read ? "Read" : "New",
          exam: n.type.replace("_", " ").toUpperCase(),
          examSlug: "",
          is_read: n.is_read,
          link_to: n.link_to,
        }));

        const combined = [...mappedUser, ...mappedPortal];

        setNotifications(combined || []);
      } catch (err) {
        console.error("[Notifications Page] Error fetching notifications:", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadNotifications();

      // Realtime notifications sync
      const channel = supabase
        .channel("notifications_page_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_notifications" },
          () => {
            loadNotifications();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications" },
          () => {
            loadNotifications();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  if (!user) return null;

  return (
    <SiteLayout>
      <section className="bg-mesh-emerald text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Bell className="h-3.5 w-3.5" /> Live updates
          </div>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl font-bold">Latest Notifications</h1>
          <p className="mt-3 text-white/75 max-w-2xl">
            Application openings, results, cutoffs and announcements across every exam.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {notifications.map((n, i) => {
              const isLocked = !isSubscribed && i >= 3;
              const isUnread = !n.is_read;
              return (
                <Link
                  key={i}
                  to={isLocked ? "/subscription" : n.link_to || "/exams"}
                  onClick={(e) => {
                    markAsRead(n.id);
                    if (isLocked) {
                      e.preventDefault();
                      toast.info("This is a Premium feature. Redirecting to subscription...");
                      navigate({
                        to: "/subscription",
                        search: { redirect: location.pathname } as any,
                      });
                    }
                  }}
                  className={cn(
                    "group flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-border/80 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all duration-200 text-xs shadow-2xs",
                    isLocked && "hover:bg-amber-500/5 hover:border-amber-500/20",
                    isUnread && "bg-primary/[0.03] border-primary/25",
                  )}
                >
                  {/* Left: Icon + Content */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Notification Icon */}
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 relative">
                      {isLocked ? (
                        <Lock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card animate-pulse" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      {/* Metadata Row: Category Badge, Date, Status */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground leading-none mb-1">
                        <span className="inline-flex h-4 items-center rounded-full bg-gold/15 text-gold-foreground px-1.5 text-[9px] font-bold uppercase tracking-wider">
                          {n.exam || n.category.toUpperCase()}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/80">{n.date}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="font-medium text-[10px] text-muted-foreground">{n.tag}</span>
                        {isUnread && (
                          <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[8px] font-extrabold tracking-wide animate-pulse">
                            NEW
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 text-[8px] font-bold shrink-0">
                            <Star className="h-2 w-2 fill-current text-amber-500" /> PRO
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="font-bold text-xs sm:text-sm text-foreground truncate leading-snug">
                        {n.title}
                      </div>

                      {/* Description */}
                      {n.description && (
                        <div className="text-muted-foreground text-[11px] sm:text-xs truncate leading-normal mt-0.5">
                          {n.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Open Action */}
                  <div className="shrink-0 pl-2 flex items-center">
                    <span
                      className={cn(
                        "text-xs font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform",
                        isLocked ? "text-amber-500" : "text-primary",
                      )}
                    >
                      {isLocked ? "Locked 🔒" : "Open →"}
                    </span>
                  </div>
                </Link>
              );
            })}
            {notifications.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground bg-card border border-border/80 rounded-xl">
                No notifications found.
              </div>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

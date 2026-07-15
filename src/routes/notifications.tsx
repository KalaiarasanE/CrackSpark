import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { allNotifications } from "@/data/exams";
import { Bell, Lock, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  "storage_warning"
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
  "expiry_reminder"
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
          prev.map((n) => (n.id === id ? { ...n, tag: "Read", is_read: true } : n))
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
        let query = supabase.from("user_notifications").select("*");
        if (user.role === "admin") {
          query = query.in("type", ADMIN_NOTIFICATION_TYPES);
        } else {
          query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const filtered = user.role === "admin" 
            ? data 
            : data.filter(n => n.user_id === user.id || (n.user_id === null && USER_NOTIFICATION_TYPES.includes(n.type)));

          console.log(`[Notifications Page] Loaded ${filtered.length} notifications from Supabase.`);
          const mapped = filtered.map((n: any) => ({
            id: n.id,
            title: n.title,
            description: n.message,
            category: n.type.replace('_', ' ').toUpperCase(),
            date: new Date(n.created_at).toLocaleString(),
            tag: n.is_read ? "Read" : "New",
            exam: n.type.replace('_', ' ').toUpperCase(),
            examSlug: "",
            is_read: n.is_read,
            link_to: n.link_to
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("[Notifications Page] Error fetching notifications:", err);
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
          }
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card divide-y divide-border shadow-sm">
            {notifications.map((n, i) => {
              const isLocked = !isSubscribed && i >= 3;
              const isUnread = !n.is_read;
              return (
                <Link
                  key={i}
                  to={isLocked ? "/subscription" : (n.link_to || "/exams")}
                  onClick={(e) => {
                    markAsRead(n.id);
                    if (isLocked) {
                      e.preventDefault();
                      toast.info("This is a Premium feature. Redirecting to subscription...");
                      navigate({
                        to: "/subscription",
                        search: { redirect: location.pathname } as any
                      });
                    }
                  }}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-5 hover:bg-muted/50 text-xs sm:text-sm",
                    isLocked && "hover:bg-amber-500/5 hover:border-amber-500/10",
                    isUnread && "bg-primary/3 font-semibold"
                  )}
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary shrink-0 relative">
                    {isLocked ? <Lock className="h-5 w-5 text-amber-500" /> : <Bell className="h-5 w-5" />}
                    {isUnread && (
                      <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-1">
                      <span className="inline-flex h-5 items-center rounded-full bg-gold/15 text-gold-foreground px-2 font-semibold uppercase tracking-wider">
                        {n.exam || n.category.toUpperCase()}
                      </span>
                      <span>{n.date}</span>
                      <span>•</span>
                      <span>{n.tag}</span>
                      {isUnread && (
                        <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-[8px] font-bold tracking-wide animate-pulse">
                          NEW
                        </span>
                      )}
                      {isLocked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-bold shrink-0">
                          <Star className="h-2 w-2 fill-current text-amber-500" /> PRO
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-foreground">{n.title}</div>
                    <div className="text-muted-foreground text-xs mt-1 leading-normal">{n.description}</div>
                  </div>
                  <span className={cn(
                    "text-xs sm:text-sm font-semibold shrink-0 hidden sm:block",
                    isLocked ? "text-amber-500" : "text-primary"
                  )}>
                    {isLocked ? "Locked 🔒" : "Open →"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

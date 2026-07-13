import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";

// Memory cache for backend query optimization
const apiCache = new Map<string, { data: any; expiresAt: number }>();

const getWithCache = async <T>(key: string, ttlMs: number, fetchFn: () => Promise<T>): Promise<T> => {
  const cached = apiCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  const freshData = await fetchFn();
  apiCache.set(key, { data: freshData, expiresAt: Date.now() + ttlMs });
  return freshData;
};

// Helper to check if subscription is approved and active (expiry_date in the future)
const isSubscriptionActive = (sub: any) => {
  if (!sub) return false;
  if (!sub.is_subscribed || sub.payment_status !== "approved") return false;
  if (!sub.expiry_date) return false;
  return new Date(sub.expiry_date).getTime() > Date.now();
};

// Fetch user subscription with 60-second cache limit
const getUserSubscriptionCached = (userId: string) => {
  return getWithCache(`sub_${userId}`, 60000, async () => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("is_subscribed, payment_status, expiry_date")
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  });
};

// Verify subscription status of a user
export const verifySubscriptionStatus = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      return { isSubscribed: isSubscriptionActive(subData) };
    } catch (err) {
      console.error("verifySubscriptionStatus error:", err);
      return { isSubscribed: false };
    }
  });

// Securely fetch materials: backend verifies subscription and redacts URL for index >= 3
export const getSecureStudyMaterials = createServerFn({ method: "POST" })
  .validator((opts: { examId: string; userId: string }) => opts)
  .handler(async ({ data: { examId, userId } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);

      const materials = await getWithCache(`materials_${examId}`, 300000, async () => {
        const { data, error } = await supabase
          .from("study_materials")
          .select("title, pdf_url, subject, size")
          .eq("exam_id", examId);
        if (error || !data) return [];
        return data;
      });

      return materials.map((m: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          title: m.title,
          type: m.subject,
          size: m.size || "1.5 MB",
          url: isLocked ? null : m.pdf_url,
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecureStudyMaterials error:", err);
      return [];
    }
  });

// Securely fetch papers
export const getSecurePapers = createServerFn({ method: "POST" })
  .validator((opts: { examFullName: string; userId: string }) => opts)
  .handler(async ({ data: { examFullName, userId } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);

      const papers = await getWithCache(`papers_${examFullName}`, 300000, async () => {
        const { data, error } = await supabase
          .from("previous_papers")
          .select("exam_name, year, pdf_url")
          .eq("exam_name", examFullName);
        if (error || !data) return [];
        return data;
      });

      return papers.map((p: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          year: String(p.year),
          name: p.exam_name,
          url: isLocked ? null : p.pdf_url,
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecurePapers error:", err);
      return [];
    }
  });

// Securely fetch Mock Tests
export const getSecureMockTests = createServerFn({ method: "POST" })
  .validator((opts: { examId: string; userId: string }) => opts)
  .handler(async ({ data: { examId, userId } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);

      const mocks = await getWithCache(`mocks_${examId}`, 300000, async () => {
        const { data, error } = await supabase
          .from("mock_tests")
          .select("id, title, questions_count, duration, pdf_url, questions_json")
          .eq("exam_id", examId)
          .eq("is_enabled", true);
        if (error || !data) return [];
        return data;
      });

      return mocks.map((m: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          id: m.id,
          title: m.title,
          questions: m.questions_count,
          duration: m.duration,
          pdf_url: isLocked ? null : m.pdf_url,
          questions_json: isLocked ? null : m.questions_json,
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecureMockTests error:", err);
      return [];
    }
  });

// Securely fetch Current Affairs
export const getSecureCurrentAffairs = createServerFn({ method: "POST" })
  .validator((opts: { categoryName: string; userId: string }) => opts)
  .handler(async ({ data: { categoryName, userId } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);

      const affairs = await getWithCache(`affairs_${categoryName}`, 300000, async () => {
        const { data, error } = await supabase
          .from("current_affairs")
          .select("title, publish_date, content, pdf_url, image_url, period")
          .eq("category", categoryName);
        if (error || !data) return [];
        return data;
      });

      const counts: Record<string, number> = { daily: 0, weekly: 0, monthly: 0 };

      return affairs.map((a: any) => {
        const period = a.period || "daily";
        const idx = counts[period] || 0;
        counts[period] = idx + 1;
        const isLocked = !isSubscribed && idx >= 3;

        return {
          title: a.title,
          date: new Date(a.publish_date).toLocaleDateString(),
          content: isLocked ? "Subscribe to Premium to view this update." : a.content,
          pdf_url: isLocked ? null : a.pdf_url,
          image_url: isLocked ? null : a.image_url,
          period,
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecureCurrentAffairs error:", err);
      return [];
    }
  });

// Securely fetch Notifications
export const getSecureNotifications = createServerFn({ method: "POST" })
  .validator((opts: { categoryName: string; userId: string }) => opts)
  .handler(async ({ data: { categoryName, userId } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);

      const notifs = await getWithCache(`notifs_${categoryName}`, 300000, async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("title, publish_date, category")
          .eq("category", categoryName)
          .order("publish_date", { ascending: false });
        if (error || !data) return [];
        return data;
      });

      return notifs.map((n: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          title: n.title,
          date: new Date(n.publish_date).toLocaleDateString(),
          tag: n.category,
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecureNotifications error:", err);
      return [];
    }
  });

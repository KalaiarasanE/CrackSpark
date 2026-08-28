import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";

// Memory cache for backend query optimization
const apiCache = new Map<string, { data: any; expiresAt: number }>();

const getWithCache = async <T>(
  key: string,
  ttlMs: number,
  fetchFn: () => Promise<T>,
): Promise<T> => {
  const cached = apiCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  const freshData = await fetchFn();
  apiCache.set(key, { data: freshData, expiresAt: Date.now() + ttlMs });
  return freshData;
};

const isValidUuid = (id: any) =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Helper to check if subscription is approved and active (expiry_date in the future)
const isSubscriptionActive = (sub: any) => {
  if (!sub) return false;
  if (!sub.is_subscribed || sub.payment_status !== "approved") return false;
  if (!sub.expiry_date) return false;
  return new Date(sub.expiry_date).getTime() > Date.now();
};

// Fetch user subscription with 60-second cache limit (safe for non-UUID / guest users)
const getUserSubscriptionCached = async (userId: string) => {
  if (!isValidUuid(userId)) return null;
  return getWithCache(`sub_${userId}`, 60000, async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("is_subscribed, payment_status, expiry_date")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("getUserSubscriptionCached error:", error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("getUserSubscriptionCached exception:", e);
      return null;
    }
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

function normalizeStr(str?: string) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Securely fetch materials: backend verifies subscription and redacts URL for index >= 3
export const getSecureStudyMaterials = createServerFn({ method: "POST" })
  .validator((opts: { userId?: string; examId?: string; examSlug?: string }) => opts)
  .handler(async ({ data: { userId, examId, examSlug } }) => {
    try {
      const subData = userId ? await getUserSubscriptionCached(userId) : null;
      const isSubscribed = isSubscriptionActive(subData);
      const targetExam = (examSlug || examId || "").toLowerCase().trim();

      if (!targetExam) return [];

      const cacheKey = `materials_${targetExam}`;
      const materials = await getWithCache(cacheKey, 2000, async () => {
        const { data, error } = await supabase
          .from("study_materials")
          .select("id, title, pdf_url, subject, size, exam_id")
          .eq("exam_id", targetExam)
          .order("created_at", { ascending: false });
        if (error || !data) {
          if (error) console.warn("study_materials error:", error);
          return [];
        }
        return data;
      });

      return materials.map((m: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          id: m.id,
          title: m.title,
          type: m.subject || "Study Material",
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

// Securely fetch papers: backend returns previous year papers assigned to this exam
export const getSecurePapers = createServerFn({ method: "POST" })
  .validator(
    (opts: {
      userId?: string;
      examFullName?: string;
      examSlug?: string;
      examName?: string;
      aliases?: string[];
    }) => opts,
  )
  .handler(async ({ data: { userId, examFullName, examSlug, examName, aliases } }) => {
    try {
      const subData = userId ? await getUserSubscriptionCached(userId) : null;
      const isSubscribed = isSubscriptionActive(subData);

      const targetSlug = (examSlug || "").toLowerCase().trim();
      if (!targetSlug && !examFullName && !examName) return [];

      const validKeys = [examFullName, examSlug, examName, ...(aliases || [])]
        .filter(Boolean)
        .map(normalizeStr);

      const cacheKey = `papers_${targetSlug || normalizeStr(examFullName || examName)}`;
      const papers = await getWithCache(cacheKey, 2000, async () => {
        const { data, error } = await supabase
          .from("previous_papers")
          .select("id, exam_name, year, subject, pdf_url")
          .order("created_at", { ascending: false });
        if (error || !data) {
          if (error) console.warn("previous_papers error:", error);
          return [];
        }
        return data.filter((p: any) => {
          const pNorm = normalizeStr(p.exam_name);
          return validKeys.includes(pNorm);
        });
      });

      return papers.map((p: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          id: p.id,
          year: String(p.year || ""),
          name: p.exam_name || "Previous Year Paper",
          subject: p.subject || "Solved Paper",
          url: isLocked ? null : p.pdf_url,
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecurePapers error:", err);
      return [];
    }
  });

// Securely fetch Mock Tests: backend returns enabled mock tests assigned to this exam
export const getSecureMockTests = createServerFn({ method: "POST" })
  .validator((opts: { userId?: string; examId?: string; examSlug?: string }) => opts)
  .handler(async ({ data: { userId, examId, examSlug } }) => {
    try {
      const subData = userId ? await getUserSubscriptionCached(userId) : null;
      const isSubscribed = isSubscriptionActive(subData);
      const targetExam = (examSlug || examId || "").toLowerCase().trim();

      if (!targetExam) return [];

      const cacheKey = `mock_tests_${targetExam}`;
      const mocks = await getWithCache(cacheKey, 2000, async () => {
        const { data, error } = await supabase
          .from("mock_tests")
          .select("id, title, questions_count, duration, pdf_url, exam_id")
          .eq("exam_id", targetExam)
          .eq("is_enabled", true)
          .order("created_at", { ascending: false });
        if (error || !data) {
          if (error) console.warn("mock_tests error:", error);
          return [];
        }
        return data;
      });

      return mocks.map((m: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          id: m.id,
          title: m.title,
          questions: m.questions_count || 0,
          duration: m.duration || "60 mins",
          pdf_url: isLocked ? null : m.pdf_url,
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecureMockTests error:", err);
      return [];
    }
  });

// Securely fetch Current Affairs: backend returns admin-added current affairs for this category
export const getSecureCurrentAffairs = createServerFn({ method: "POST" })
  .validator((opts: { userId?: string; categoryName?: string; examSlug?: string }) => opts)
  .handler(async ({ data: { userId, categoryName, examSlug } }) => {
    try {
      const subData = userId ? await getUserSubscriptionCached(userId) : null;
      const isSubscribed = isSubscriptionActive(subData);

      const targetCat = (categoryName || "").trim();
      const targetSlug = (examSlug || "").trim();

      const cacheKey = `affairs_${targetCat || targetSlug || "all"}`;
      const affairs = await getWithCache(cacheKey, 2000, async () => {
        let query = supabase
          .from("current_affairs")
          .select("id, title, publish_date, content, pdf_url, image_url, period, category");
        if (targetCat) {
          query = query.ilike("category", `%${targetCat}%`);
        }
        const { data, error } = await query.order("publish_date", { ascending: false });
        if (error || !data) {
          if (error) console.warn("current_affairs error:", error);
          return [];
        }
        return data;
      });

      const counts: Record<string, number> = { daily: 0, weekly: 0, monthly: 0 };

      return affairs.map((a: any) => {
        const period = a.period || "daily";
        const idx = counts[period] || 0;
        counts[period] = idx + 1;
        const isLocked = !isSubscribed && idx >= 3;

        return {
          id: a.id,
          title: a.title,
          date: a.publish_date ? new Date(a.publish_date).toLocaleDateString() : "Recent",
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

// Securely fetch Notifications: backend returns admin-added notifications for this exam/category
export const getSecureNotifications = createServerFn({ method: "POST" })
  .validator(
    (opts: {
      userId?: string;
      categoryName?: string;
      examSlug?: string;
      examName?: string;
      aliases?: string[];
    }) => opts,
  )
  .handler(async ({ data: { userId, categoryName, examSlug, examName, aliases } }) => {
    try {
      const subData = userId ? await getUserSubscriptionCached(userId) : null;
      const isSubscribed = isSubscriptionActive(subData);

      const targetSlug = (examSlug || "").toLowerCase().trim();
      const validCategories = [
        categoryName,
        examName,
        examSlug,
        ...(aliases || []),
        "General",
        "ALL",
      ]
        .filter(Boolean)
        .map(normalizeStr);

      const cacheKey = `notifs_${targetSlug || normalizeStr(categoryName) || "all"}`;
      const notifs = await getWithCache(cacheKey, 2000, async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("id, title, publish_date, category, description, important_links, is_pinned")
          .order("is_pinned", { ascending: false })
          .order("publish_date", { ascending: false });
        if (error || !data) {
          if (error) console.warn("notifications error:", error);
          return [];
        }
        if (targetSlug) {
          return data.filter((n: any) => {
            const nCat = normalizeStr(n.category);
            return validCategories.includes(nCat);
          });
        }
        return data;
      });

      return notifs.map((n: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          id: n.id,
          title: n.title,
          date: n.publish_date ? new Date(n.publish_date).toLocaleDateString() : "Recent",
          tag: n.category || "General",
          isLocked,
        };
      });
    } catch (err) {
      console.error("getSecureNotifications error:", err);
      return [];
    }
  });

// Server-side Translation Proxy to bypass browser CORS
export const translateTextServer = createServerFn({ method: "POST" })
  .validator((opts: { texts: string[]; targetLang: string }) => opts)
  .handler(async ({ data: { texts, targetLang } }) => {
    try {
      const results: string[] = [];
      // Translate each text item
      for (const text of texts) {
        const trimmed = text.trim();
        if (!trimmed || /^\d+$/.test(trimmed)) {
          results.push(text);
          continue;
        }

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
        const response = await fetch(url);
        if (!response.ok) {
          results.push(text);
          continue;
        }
        const data = await response.json();
        let translated = "";
        if (data && data[0]) {
          translated = data[0].map((x: any) => x[0]).join("");
        }
        results.push(translated || text);
      }
      return results;
    } catch (err) {
      console.error("translateTextServer error:", err);
      return texts;
    }
  });

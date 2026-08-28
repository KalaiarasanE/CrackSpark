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

// Securely fetch materials: backend verifies subscription and redacts URL for index >= 3
export const getSecureStudyMaterials = createServerFn({ method: "POST" })
  .validator((opts: { examId: string; userId: string; examSlug?: string }) => opts)
  .handler(async ({ data: { examId, userId, examSlug } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);
      const targetSlug = examSlug || examId;

      const materials = await getWithCache(`materials_${targetSlug}`, 300000, async () => {
        const { data, error } = await supabase
          .from("study_materials")
          .select("title, pdf_url, subject, size, exam_id")
          .or(`exam_id.eq."${targetSlug}",exam_id.ilike."%${targetSlug}%",exam_id.eq."${examId}"`);
        if (error || !data) {
          if (error) console.warn("study_materials error:", error);
          return [];
        }
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
  .validator(
    (opts: {
      examFullName: string;
      userId: string;
      examSlug?: string;
      examName?: string;
      aliases?: string[];
    }) => opts,
  )
  .handler(async ({ data: { examFullName, userId, examSlug, examName, aliases } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);
      const cacheKey = `papers_${examSlug || examFullName}`;

      const papers = await getWithCache(cacheKey, 300000, async () => {
        // Fetch all papers and filter smartly for maximum resilience
        const { data, error } = await supabase
          .from("previous_papers")
          .select("exam_name, year, subject, pdf_url");
        if (error || !data) {
          if (error) console.warn("previous_papers error:", error);
          return [];
        }

        const matchTargets = [
          examFullName.toLowerCase(),
          (examName || "").toLowerCase(),
          (examSlug || "").toLowerCase(),
          ...(aliases || []).map((a) => a.toLowerCase()),
        ].filter(Boolean);

        return data.filter((p: any) => {
          const name = (p.exam_name || "").toLowerCase();
          const subj = (p.subject || "").toLowerCase();
          return matchTargets.some(
            (target) =>
              name.includes(target) ||
              target.includes(name) ||
              (subj && (subj.includes(target) || target.includes(subj))),
          );
        });
      });

      return papers.map((p: any, idx: number) => {
        const isLocked = !isSubscribed && idx >= 3;
        return {
          year: String(p.year),
          name: p.exam_name,
          subject: p.subject,
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
  .validator((opts: { examId: string; userId: string; examSlug?: string }) => opts)
  .handler(async ({ data: { examId, userId, examSlug } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);
      const targetSlug = examSlug || examId;

      const mocks = await getWithCache(`mocks_${targetSlug}`, 300000, async () => {
        // Omit questions_json here to prevent heavy payload timeouts during listing
        const { data, error } = await supabase
          .from("mock_tests")
          .select("id, title, questions_count, duration, pdf_url, exam_id")
          .or(`exam_id.eq."${targetSlug}",exam_id.ilike."%${targetSlug}%",exam_id.eq."${examId}"`)
          .eq("is_enabled", true);
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
          questions: m.questions_count,
          duration: m.duration,
          pdf_url: isLocked ? null : m.pdf_url,
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
  .validator((opts: { categoryName: string; userId: string; examSlug?: string }) => opts)
  .handler(async ({ data: { categoryName, userId, examSlug } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);

      const affairs = await getWithCache(`affairs_${categoryName}`, 300000, async () => {
        const { data, error } = await supabase
          .from("current_affairs")
          .select("title, publish_date, content, pdf_url, image_url, period, category")
          .or(`category.eq."${categoryName}",category.ilike."%${categoryName}%",category.ilike."general"`)
          .order("publish_date", { ascending: false });
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
  .validator(
    (opts: {
      categoryName: string;
      userId: string;
      examSlug?: string;
      examName?: string;
      aliases?: string[];
    }) => opts,
  )
  .handler(async ({ data: { categoryName, userId, examSlug, examName, aliases } }) => {
    try {
      const subData = await getUserSubscriptionCached(userId);
      const isSubscribed = isSubscriptionActive(subData);

      const notifs = await getWithCache(`notifs_${categoryName}_${examSlug || ""}`, 300000, async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("title, publish_date, category, description, important_links, is_pinned")
          .order("publish_date", { ascending: false });
        if (error || !data) {
          if (error) console.warn("notifications error:", error);
          return [];
        }

        const matchTargets = [
          categoryName.toLowerCase(),
          (examName || "").toLowerCase(),
          (examSlug || "").toLowerCase(),
          "general",
          ...(aliases || []).map((a) => a.toLowerCase()),
        ].filter(Boolean);

        return data.filter((n: any) => {
          const cat = (n.category || "").toLowerCase();
          const title = (n.title || "").toLowerCase();
          return matchTargets.some(
            (target) => cat.includes(target) || target.includes(cat) || title.includes(target),
          );
        });
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

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
  .validator(
    (opts: {
      userId?: string;
      examId?: string;
      examSlug?: string;
      aliases?: string[];
    }) => opts
  )
  .handler(async ({ data: { userId, examId, examSlug, aliases } }) => {
    try {
      const subData = userId ? await getUserSubscriptionCached(userId) : null;
      const isSubscribed = isSubscriptionActive(subData);
      const targetExam = (examSlug || examId || "").toLowerCase().trim();

      if (!targetExam) return [];

      const validSlugs = Array.from(
        new Set(
          [
            targetExam,
            examSlug?.toLowerCase().trim(),
            examId?.toLowerCase().trim(),
            ...(aliases || []).map((a) => a.toLowerCase().trim()),
          ].filter(Boolean) as string[]
        )
      );

      const { data, error } = await supabase
        .from("study_materials")
        .select("id, title, pdf_url, subject, size, exam_id, created_at")
        .in("exam_id", validSlugs)
        .order("created_at", { ascending: true });

      if (error || !data) {
        if (error) console.warn("study_materials error:", error);
        return [];
      }

      const validMaterials = data.filter(
        (m: any) => m && m.pdf_url && typeof m.pdf_url === "string" && m.pdf_url.trim().length > 0
      );

      return await Promise.all(
        validMaterials.map(async (m: any, idx: number) => {
          const isLocked = !isSubscribed && idx >= 3;
          let finalUrl = m.pdf_url.trim();

          if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
            const { data: pubData } = supabase.storage.from("resources").getPublicUrl(finalUrl);
            finalUrl = pubData?.publicUrl || finalUrl;
          }

          return {
            id: m.id,
            title: m.title,
            type: m.subject || "Study Material",
            size: m.size && m.size !== "0.0 MB" ? m.size : "2.4 MB",
            url: isLocked ? null : finalUrl,
            isLocked,
          };
        })
      );
    } catch (err) {
      console.error("getSecureStudyMaterials error:", err);
      return [];
    }
  });

// Securely fetch papers: backend returns previous year papers assigned to this exam in ascending created_at order
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
      const papers = await getWithCache(cacheKey, 15000, async () => {
        const { data, error } = await supabase
          .from("previous_papers")
          .select("id, exam_name, year, subject, pdf_url, created_at")
          .order("created_at", { ascending: true });
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

// Securely fetch Mock Tests: backend returns enabled mock tests assigned to this exam in ascending created_at order
export const getSecureMockTests = createServerFn({ method: "POST" })
  .validator((opts: { userId?: string; examId?: string; examSlug?: string }) => opts)
  .handler(async ({ data: { userId, examId, examSlug } }) => {
    try {
      const subData = userId ? await getUserSubscriptionCached(userId) : null;
      const isSubscribed = isSubscriptionActive(subData);
      const targetExam = (examSlug || examId || "").toLowerCase().trim();

      if (!targetExam) return [];

      const cacheKey = `mock_tests_${targetExam}`;
      const mocks = await getWithCache(cacheKey, 15000, async () => {
        const { data, error } = await supabase
          .from("mock_tests")
          .select("id, title, questions_count, duration, pdf_url, exam_id, created_at")
          .eq("exam_id", targetExam)
          .eq("is_enabled", true)
          .order("created_at", { ascending: true });
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
      const affairs = await getWithCache(cacheKey, 15000, async () => {
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
      const notifs = await getWithCache(cacheKey, 15000, async () => {
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

// Server function to get the list of exam slugs that have active Admin content
export const getExamsWithContent = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await getWithCache("active_exams_content_list", 30000, async () => {
      const [matRes, papRes, mockRes] = await Promise.all([
        supabase.from("study_materials").select("exam_id"),
        supabase.from("previous_papers").select("exam_name"),
        supabase.from("mock_tests").select("exam_id").eq("is_enabled", true),
      ]);

      const activeSlugs = new Set<string>();

      (matRes.data || []).forEach((m: any) => {
        if (m.exam_id) activeSlugs.add(m.exam_id.toLowerCase().trim());
      });

      (mockRes.data || []).forEach((m: any) => {
        if (m.exam_id) activeSlugs.add(m.exam_id.toLowerCase().trim());
      });

      const paperNames = (papRes.data || []).map((p: any) => normalizeStr(p.exam_name));

      // Check all possible exams
      const knownExams = [
        { slug: "group-1", fullName: "TNPSC Combined Civil Services Exam - Group I", aliases: ["TNPSC Group 1 Services", "Group 1", "group-1"] },
        { slug: "group-2", fullName: "TNPSC Combined Civil Services Exam - Group II & IIA", aliases: ["TNPSC Group 2 Services", "Group 2", "group-2"] },
        { slug: "group-4", fullName: "TNPSC Combined Civil Services Exam - Group IV & VAO", aliases: ["TNPSC Group 4 Services", "Group 4", "group-4"] },
        { slug: "ctse", fullName: "Combined Technical Services Exam", aliases: ["CTSE", "ctse"] },
        { slug: "group-d", fullName: "Railway Recruitment Board Group D", aliases: ["Level 1 Posts", "RRB Group D", "group-d"] },
        { slug: "ias", fullName: "UPSC Civil Services Examination (IAS)", aliases: ["IAS", "upsc-cse", "Civil Services Exam"] },
        { slug: "cgl", fullName: "Staff Selection Commission Combined Graduate Level", aliases: ["CGL", "cgl", "ssc-cgl"] },
        { slug: "chsl", fullName: "Combined Higher Secondary Level", aliases: ["CHSL", "chsl", "ssc-chsl"] },
        { slug: "mts", fullName: "Multi Tasking Staff", aliases: ["MTS", "mts", "ssc-mts"] },
        { slug: "gd", fullName: "General Duty Constable", aliases: ["GD", "gd", "ssc-gd"] },
        { slug: "ntpc", fullName: "Non-Technical Popular Categories", aliases: ["NTPC", "ntpc", "rrb-ntpc"] },
        { slug: "alp", fullName: "Assistant Loco Pilot", aliases: ["ALP", "alp", "rrb-alp"] },
        { slug: "je", fullName: "Junior Engineer", aliases: ["JE", "je", "rrb-je"] },
        { slug: "po", fullName: "Probationary Officer", aliases: ["PO", "po", "ibps-po"] },
        { slug: "clerk", fullName: "Clerical Cadre", aliases: ["Clerk", "clerk", "ibps-clerk"] },
        { slug: "so", fullName: "Specialist Officer", aliases: ["SO", "so", "ibps-so"] },
        { slug: "sbi-po", fullName: "SBI Probationary Officer", aliases: ["SBI PO", "sbi-po"] },
        { slug: "sbi-clerk", fullName: "SBI Junior Associates", aliases: ["SBI Clerk", "sbi-clerk"] },
        { slug: "nda", fullName: "National Defence Academy", aliases: ["NDA", "nda"] },
        { slug: "cds", fullName: "Combined Defence Services", aliases: ["CDS", "cds"] },
        { slug: "afcat", fullName: "Air Force Common Admission Test", aliases: ["AFCAT", "afcat"] },
        { slug: "capf", fullName: "Central Armed Police Forces", aliases: ["CAPF", "capf"] },
      ];

      for (const ex of knownExams) {
        if (activeSlugs.has(ex.slug.toLowerCase())) continue;
        const keys = [ex.fullName, ex.slug, ...(ex.aliases || [])].map(normalizeStr);
        if (paperNames.some((pn: string) => keys.includes(pn))) {
          activeSlugs.add(ex.slug.toLowerCase());
        }
      }

      return Array.from(activeSlugs);
    });
  } catch (err) {
    console.error("getExamsWithContent error:", err);
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

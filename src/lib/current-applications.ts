import { supabase } from "./supabase";

export type CurrentApplication = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  website_url: string;
  created_at: string;
};

// In-memory cache to prevent redundant queries
let cachedApplications: CurrentApplication[] | null = null;

/**
 * Fetch all current applications, newest first.
 * Queries dedicated table 'current_applications', and falls back seamlessly
 * to 'exam_details' ('current_app:%') for guaranteed persistence.
 */
export async function fetchCurrentApplications(forceRefresh = false): Promise<CurrentApplication[]> {
  if (cachedApplications && !forceRefresh) {
    return cachedApplications;
  }

  // 1. Try dedicated current_applications table
  try {
    const { data, error } = await supabase
      .from("current_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      const apps: CurrentApplication[] = data.map((row: any) => ({
        id: String(row.id),
        title: row.title || "",
        description: row.description || "",
        start_date: row.start_date || "",
        end_date: row.end_date || "",
        website_url: row.website_url || "",
        created_at: row.created_at || new Date().toISOString(),
      }));
      cachedApplications = apps;
      return apps;
    }
  } catch {
    // Fall through to exam_details storage
  }

  // 2. Resilient fallback: fetch from exam_details table
  try {
    const { data, error } = await supabase
      .from("exam_details")
      .select("exam_key, official_website_url, created_at")
      .like("exam_key", "current_app:%")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const apps: CurrentApplication[] = [];
      for (const row of data) {
        try {
          const parsed = JSON.parse(row.official_website_url);
          apps.push({
            id: parsed.id || row.exam_key.replace("current_app:", ""),
            title: parsed.title || "",
            description: parsed.description || "",
            start_date: parsed.start_date || "",
            end_date: parsed.end_date || "",
            website_url: parsed.website_url || "",
            created_at: parsed.created_at || row.created_at,
          });
        } catch {
          // Skip malformed records
        }
      }
      apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      cachedApplications = apps;
      return apps;
    }
  } catch (err) {
    console.warn("[CurrentApplications] Failed to load from exam_details:", err);
  }

  cachedApplications = [];
  return [];
}

/**
 * Invalidate in-memory cache and broadcast update event to listeners
 */
export function invalidateCurrentApplicationsCache() {
  cachedApplications = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("current-applications-updated"));
  }
}

/**
 * Save (insert or update) a current application permanently.
 */
export async function saveCurrentApplication(app: {
  id?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  website_url: string;
}): Promise<CurrentApplication> {
  const appId =
    app.id ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const now = new Date().toISOString();
  const record: CurrentApplication = {
    id: appId,
    title: app.title.trim(),
    description: app.description.trim(),
    start_date: app.start_date.trim(),
    end_date: app.end_date.trim(),
    website_url: app.website_url.trim(),
    created_at: now,
  };

  // 1. Try writing to current_applications table
  try {
    await supabase.from("current_applications").upsert({
      id: record.id,
      title: record.title,
      description: record.description,
      start_date: record.start_date,
      end_date: record.end_date,
      website_url: record.website_url,
      updated_at: now,
    });
  } catch {
    // Ignore error, fallback handles persistence
  }

  // 2. Persist to exam_details for guaranteed persistence across all client environments
  try {
    const { error: examDetailsErr } = await supabase.from("exam_details").upsert({
      exam_key: `current_app:${record.id}`,
      official_website_url: JSON.stringify(record),
    });
    if (examDetailsErr) {
      console.warn("[CurrentApplications] Failed to upsert to exam_details:", examDetailsErr);
    }
  } catch (err) {
    console.warn("[CurrentApplications] Error writing to exam_details:", err);
  }

  invalidateCurrentApplicationsCache();
  return record;
}

/**
 * Delete a current application permanently.
 */
export async function deleteCurrentApplication(id: string): Promise<void> {
  try {
    await supabase.from("current_applications").delete().eq("id", id);
  } catch {}

  try {
    await supabase.from("exam_details").delete().eq("exam_key", `current_app:${id}`);
  } catch {}

  invalidateCurrentApplicationsCache();
}

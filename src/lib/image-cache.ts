import { supabase } from "./supabase";

// Memory cache for category & banner images
let imageCache: Record<string, string> | null = null;
let cachePromise: Promise<Record<string, string>> | null = null;
const listeners = new Set<(images: Record<string, string>) => void>();

export const defaultCategoryImages: Record<string, string> = {
  upsc: "/upsc_banner.jpg",
  ssc: "/ssc_banner.jpg",
  rrb: "/railways_banner.jpg",
  ibps: "/banking_banner.jpg",
  sbi: "/banking_banner.jpg",
  tnpsc: "/tnpsc_banner.jpg",
  defence: "/hero_background.jpg",
};

/**
 * Fetch all exam details & images from Supabase in a single batch query.
 * Caches the results and sets up realtime listener for instant updates.
 */
export async function getExamImages(): Promise<Record<string, string>> {
  if (imageCache) return imageCache;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("exam_details")
        .select("exam_key, official_website_url, updated_at");

      const mapping: Record<string, string> = {};

      if (!error && data) {
        data.forEach((row: any) => {
          if (row.official_website_url) {
            // Append version timestamp if available for cache invalidation
            const url = row.official_website_url;
            const timestamp = row.updated_at ? new Date(row.updated_at).getTime() : "";
            const freshUrl = timestamp
              ? `${url}${url.includes("?") ? "&" : "?"}v=${timestamp}`
              : url;
            mapping[row.exam_key] = freshUrl;
          }
        });
      }

      imageCache = mapping;
      return mapping;
    } catch (err) {
      console.warn("Failed to fetch exam images from Supabase:", err);
      imageCache = {};
      return {};
    } finally {
      cachePromise = null;
    }
  })();

  return cachePromise;
}

/**
 * Get category image URL with immediate fallback
 */
export function getCategoryImage(slug: string, imagesMap?: Record<string, string>): string {
  const map = imagesMap || imageCache || {};
  const customUrl = map[`category_image:${slug}`];
  return customUrl || defaultCategoryImages[slug] || "/hero_background.jpg";
}

/**
 * Get banner image URL with immediate fallback
 */
export function getBannerImage(slug: string, imagesMap?: Record<string, string>): string {
  const map = imagesMap || imageCache || {};
  const key = slug === "sbi" ? "banner:ibps" : `banner:${slug}`;
  const customUrl = map[key] || map[`category_image:${slug}`];
  if (customUrl) return customUrl;
  return defaultCategoryImages[slug] || "/hero_background.jpg";
}

/**
 * Subscribe to realtime image changes from Supabase
 */
export function subscribeToImageChanges(callback: (images: Record<string, string>) => void) {
  listeners.add(callback);

  // Initialize realtime channel if first listener
  if (listeners.size === 1) {
    supabase
      .channel("exam_details_images_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "exam_details" }, async () => {
        // Clear memory cache and refetch
        imageCache = null;
        const fresh = await getExamImages();
        listeners.forEach((fn) => fn(fresh));
      })
      .subscribe();
  }

  return () => {
    listeners.delete(callback);
  };
}

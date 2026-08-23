import { supabase } from "./supabase";

export const defaultCategoryImages: Record<string, string> = {
  upsc: "/upsc_banner.jpg",
  ssc: "/ssc_banner.jpg",
  rrb: "/railways_banner.jpg",
  ibps: "/banking_banner.jpg",
  sbi: "/banking_banner.jpg",
  tnpsc: "/tnpsc_banner.jpg",
  defence: "/hero_background.jpg",
};

// Known active Supabase Storage URLs for initial instant render
export const defaultSupabaseCategoryImages: Record<string, string> = {
  upsc: "https://wspaqtirqslarbzrnkhf.supabase.co/storage/v1/object/public/resources/category_images/vnl1xupbey_1782834705826.jpeg",
  ssc: "https://wspaqtirqslarbzrnkhf.supabase.co/storage/v1/object/public/resources/category_images/q5vcziu3jk_1782835740660.jpeg",
  rrb: "https://wspaqtirqslarbzrnkhf.supabase.co/storage/v1/object/public/resources/category_images/1s2e37hiohsh_1782838187137.jpeg",
  ibps: "https://wspaqtirqslarbzrnkhf.supabase.co/storage/v1/object/public/resources/category_images/l84rk9jebr_1782836686918.jpeg",
  sbi: "https://wspaqtirqslarbzrnkhf.supabase.co/storage/v1/object/public/resources/category_images/l84rk9jebr_1782836686918.jpeg",
  tnpsc: "https://wspaqtirqslarbzrnkhf.supabase.co/storage/v1/object/public/resources/category_images/trjhc3jz7ag_1782837143509.jpeg",
  defence: "https://wspaqtirqslarbzrnkhf.supabase.co/storage/v1/object/public/resources/category_images/k974osbd6v9_1782837839752.jpeg",
};

export const defaultBanners: Record<string, string> = {
  upsc: "/upsc_banner.jpg",
  tnpsc: "/tnpsc_banner.jpg",
  ssc: "/ssc_banner.jpg",
  ibps: "/banking_banner.jpg",
  sbi: "/banking_banner.jpg",
  rrb: "/railways_banner.jpg",
  defence: "/hero_background.jpg",
};

// Memory cache to prevent redundant queries
let cachedCategoryImages: Record<string, string> | null = null;
let cachedHeroBg: string | null = null;
const cachedBanners: Record<string, string> = {};

/**
 * Preload an image URL into browser cache / memory
 */
export function preloadImage(url: string): Promise<void> {
  if (typeof window === "undefined" || !url) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Preload multiple image URLs concurrently
 */
export function preloadImages(urls: (string | undefined | null)[]): void {
  if (typeof window === "undefined") return;
  const validUrls = urls.filter((u): u is string => typeof u === "string" && u.length > 0);
  validUrls.forEach((url) => {
    preloadImage(url).catch(() => {});
  });
}

/**
 * Fetch all category background images from Supabase Storage with fallback resolution
 */
export async function fetchCategoryImages(): Promise<Record<string, string>> {
  if (cachedCategoryImages) {
    return cachedCategoryImages;
  }

  const mapping: Record<string, string> = { ...defaultSupabaseCategoryImages };

  try {
    const { data, error } = await supabase
      .from("exam_details")
      .select("exam_key, official_website_url")
      .like("exam_key", "category_image:%");

    if (!error && data && data.length > 0) {
      data.forEach((row: any) => {
        if (row.official_website_url && row.official_website_url !== "#") {
          const catSlug = row.exam_key.replace("category_image:", "");
          mapping[catSlug] = row.official_website_url;
        }
      });

      // IBPS & SBI banking image fallback pairing
      if (mapping.sbi && !mapping.ibps) {
        mapping.ibps = mapping.sbi;
      } else if (mapping.ibps && !mapping.sbi) {
        mapping.sbi = mapping.ibps;
      }
    }
  } catch (err) {
    console.warn("[PortalAssets] Failed to fetch category images from Supabase:", err);
  }

  cachedCategoryImages = mapping;
  // Preload in browser
  preloadImages(Object.values(mapping));
  return mapping;
}

/**
 * Invalidate cached category images (useful after CMS updates)
 */
export function invalidateCategoryImagesCache() {
  cachedCategoryImages = null;
}

/**
 * Fetch Hero background image from Supabase
 */
export async function fetchHeroImage(): Promise<string> {
  if (cachedHeroBg) {
    return cachedHeroBg;
  }

  let heroUrl = "/hero_background.jpg";
  try {
    const { data, error } = await supabase
      .from("exam_details")
      .select("official_website_url")
      .eq("exam_key", "settings:home_hero")
      .maybeSingle();

    if (!error && data?.official_website_url && data.official_website_url !== "#") {
      heroUrl = data.official_website_url;
    }
  } catch (err) {
    console.warn("[PortalAssets] Failed to fetch hero image from Supabase:", err);
  }

  cachedHeroBg = heroUrl;
  preloadImage(heroUrl);
  return heroUrl;
}

/**
 * Invalidate hero image cache
 */
export function invalidateHeroImageCache() {
  cachedHeroBg = null;
}

/**
 * Fetch exam banner for a specific category from Supabase
 */
export async function fetchExamBanner(categorySlug: string): Promise<string> {
  const normCat = categorySlug.toLowerCase();
  const lookupKey = normCat === "sbi" ? "ibps" : normCat;

  if (cachedBanners[lookupKey]) {
    return cachedBanners[lookupKey];
  }

  let bannerUrl = defaultBanners[normCat] || "/hero_background.jpg";

  try {
    const { data, error } = await supabase
      .from("exam_details")
      .select("official_website_url")
      .eq("exam_key", `banner:${lookupKey}`)
      .maybeSingle();

    if (!error && data?.official_website_url && data.official_website_url !== "#") {
      bannerUrl = data.official_website_url;
    } else {
      // Check if category_image exists as fallback banner
      const { data: catImgData } = await supabase
        .from("exam_details")
        .select("official_website_url")
        .eq("exam_key", `category_image:${lookupKey}`)
        .maybeSingle();

      if (catImgData?.official_website_url && catImgData.official_website_url !== "#") {
        bannerUrl = catImgData.official_website_url;
      }
    }
  } catch (err) {
    console.warn(`[PortalAssets] Failed to fetch banner for "${normCat}":`, err);
  }

  cachedBanners[lookupKey] = bannerUrl;
  cachedBanners[normCat] = bannerUrl;
  preloadImage(bannerUrl);
  return bannerUrl;
}

/**
 * Invalidate banner cache
 */
export function invalidateBannerCache(categorySlug?: string) {
  if (categorySlug) {
    delete cachedBanners[categorySlug.toLowerCase()];
  } else {
    Object.keys(cachedBanners).forEach((k) => delete cachedBanners[k]);
  }
}

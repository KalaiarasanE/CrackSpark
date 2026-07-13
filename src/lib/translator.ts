// Custom Client-Side DOM Translator for CrackSpark
// Features: Instant cached translation, zero page reloads, non-blocking asynchronous processing
import { translateTextServer } from "@/lib/api";

const CACHE_VERSION = "v2";
const CACHE_PREFIX = `crackspark_trans_${CACHE_VERSION}_`;

// Local memory cache
const translationMemory: Record<string, Record<string, string>> = {};

// Load cache for a specific language from localStorage
function loadLanguageCache(lang: string): Record<string, string> {
  if (translationMemory[lang]) return translationMemory[lang];

  const cacheKey = `${CACHE_PREFIX}${lang}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      translationMemory[lang] = JSON.parse(raw);
      return translationMemory[lang];
    }
  } catch (e) {
    console.warn("Failed to load translation cache from localStorage:", e);
  }

  translationMemory[lang] = {};
  return translationMemory[lang];
}

// Save cache for a specific language to localStorage
function saveLanguageCache(lang: string) {
  const cacheKey = `${CACHE_PREFIX}${lang}`;
  try {
    if (translationMemory[lang]) {
      localStorage.setItem(cacheKey, JSON.stringify(translationMemory[lang]));
    }
  } catch (e) {
    console.warn("Failed to save translation cache to localStorage:", e);
  }
}

// Translate a batch of texts using a secure server-side translation proxy function (bypasses CORS)
async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
  if (texts.length === 0) return [];

  try {
    const results = await translateTextServer({ data: { texts, targetLang } });
    return results;
  } catch (err) {
    console.warn("Server translation request failed:", err);
    return texts;
  }
}

// Track elements we are translating to prevent infinite loops
const originalTexts = new WeakMap<Node, string>();

// Main DOM translation runner
export async function translatePage(
  targetLang: string,
  onStateChange?: (state: "idle" | "translating") => void
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (targetLang === "en") {
    // Restore all original texts
    restoreOriginals();
    if (onStateChange) onStateChange("idle");
    return;
  }

  const cache = loadLanguageCache(targetLang);
  const queue: { node: Node; text: string }[] = [];
  const textsToTranslate: string[] = [];
  const seenTexts = new Set<string>();

  // Helper to walk DOM
  function walk(node: Node) {
    // Skip script, style tags, and elements marked with translate bypass classes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName;
      if (
        tag === "SCRIPT" ||
        tag === "STYLE" ||
        tag === "NOSCRIPT" ||
        tag === "IFRAME" ||
        tag === "CODE" ||
        tag === "PRE" ||
        el.classList.contains("skiptranslate") ||
        el.classList.contains("no-translate") ||
        el.id === "google_translate_element"
      ) {
        return;
      }
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const trimmed = text.trim();
      
      // Translate only meaningful text nodes
      if (trimmed && trimmed.length > 1 && !/^\d+$/.test(trimmed)) {
        let original = originalTexts.get(node);
        if (!original) {
          original = text;
          originalTexts.set(node, original);
        }

        const originalTrimmed = original.trim();
        const cached = cache[originalTrimmed];

        if (cached) {
          // Replace text content instantly with cached translation, retaining surrounding whitespace
          node.textContent = original.replace(originalTrimmed, cached);
        } else {
          queue.push({ node, text: original });
          if (!seenTexts.has(originalTrimmed)) {
            seenTexts.add(originalTrimmed);
            textsToTranslate.push(originalTrimmed);
          }
        }
      }
    }

    let child = node.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
  }

  // Measure start time for 30ms loading state trigger
  const startTime = Date.now();
  let loadingStateTriggered = false;

  walk(document.body);

  if (textsToTranslate.length > 0) {
    // If translation takes > 30ms or we have items, set state to translating
    // To ensure the loading state is shown if it takes more than 30ms, we can set a timer
    const loadingTimer = setTimeout(() => {
      loadingStateTriggered = true;
      if (onStateChange) onStateChange("translating");
    }, 30);

    // Call API in background without blocking the UI
    const translated = await translateBatch(textsToTranslate, targetLang);

    clearTimeout(loadingTimer);

    // Update cache map
    textsToTranslate.forEach((original, idx) => {
      const translation = translated[idx];
      if (translation && translation !== original) {
        cache[original] = translation;
      }
    });

    saveLanguageCache(targetLang);

    // Apply translations asynchronously using requestIdleCallback to keep rendering buttery smooth
    let queueIdx = 0;
    const applyChunk = () => {
      const deadline = Date.now() + 16; // 16ms budget per frame (60fps)
      while (queueIdx < queue.length && Date.now() < deadline) {
        const item = queue[queueIdx++];
        const originalVal = item.text;
        const trimmedVal = originalVal.trim();
        const translatedVal = cache[trimmedVal];
        if (translatedVal) {
          item.node.textContent = originalVal.replace(trimmedVal, translatedVal);
        }
      }

      if (queueIdx < queue.length) {
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(applyChunk);
        } else {
          setTimeout(applyChunk, 0);
        }
      } else {
        if (onStateChange) onStateChange("idle");
      }
    };

    applyChunk();
  } else {
    if (onStateChange) onStateChange("idle");
  }
}

// Restore page back to English
export function restoreOriginals() {
  const iterator = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return originalTexts.has(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node;
  while ((node = iterator.nextNode())) {
    const original = originalTexts.get(node);
    if (original !== undefined) {
      node.textContent = original;
    }
  }
}

import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollProgress, BackToTop } from "@/components/ui/animations";
import { translatePage } from "@/lib/translator";

// Custom Cursor Component for Desktop
function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isButton = target.closest(
        "button, [role='button'], input[type='button'], input[type='submit'], select",
      );
      const isLink = !isButton && target.closest("a");
      const isCard = target.closest(".card-tile");

      setHoveredButton(!!isButton);
      setHoveredLink(!!isLink);
      setHoveredCard(!!isCard);
    };

    const handleMouseDown = () => {
      setClicked(true);
    };

    const handleMouseUp = () => {
      setClicked(false);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isMobile]);

  // Smooth follow movement (lerp)
  useEffect(() => {
    if (isMobile) return;
    let frameId: number;
    const updateTrail = () => {
      setTrail((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.16,
          y: prev.y + dy * 0.16,
        };
      });
      frameId = requestAnimationFrame(updateTrail);
    };
    frameId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(frameId);
  }, [position, isMobile]);

  if (isMobile) return null;

  // Determine dynamic styles based on hover state
  let size = 13; // default: 12px to 14px
  let color = "#D4AF37"; // soft golden color
  let glowOpacity = 0.55;

  if (hoveredButton) {
    size = 18;
    glowOpacity = 0.85; // slightly stronger glow
  } else if (hoveredLink) {
    size = 16;
    glowOpacity = 0.65;
  } else if (hoveredCard) {
    size = 13;
    glowOpacity = 0.75;
    color = "#FFDF73"; // slightly brighter
  }

  // Click down scaling
  if (clicked) {
    size = size * 0.9;
  }

  return (
    <div
      className="fixed pointer-events-none z-[10000] rounded-full animate-golden-pulse"
      style={{
        left: trail.x,
        top: trail.y,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        transform: "translate(-50%, -50%)",
        boxShadow: `0 0 10px rgba(212, 175, 55, ${glowOpacity})`,
        transition:
          "width 0.18s ease-out, height 0.18s ease-out, background-color 0.18s ease-out, box-shadow 0.18s ease-out, opacity 0.18s ease-out",
      }}
    />
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [animationClass, setAnimationClass] = useState("opacity-100 scale-100");
  const [translating, setTranslating] = useState(false);
  const [lang, setLang] = useState("en");

  // Sync and listen to language selection events
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load initial language from localStorage
    const savedLang = localStorage.getItem("crackspark_lang") || "en";
    setLang(savedLang);

    const handleLangChange = (e: Event) => {
      const code = (e as CustomEvent).detail;
      if (code) setLang(code);
    };

    window.addEventListener("crackspark-language-changed", handleLangChange);
    return () => {
      window.removeEventListener("crackspark-language-changed", handleLangChange);
    };
  }, []);

  // Translate page whenever the active language or pathname changes
  useEffect(() => {
    translatePage(lang, (state) => {
      setTranslating(state === "translating");
    });
  }, [lang, pathname]);

  // Dynamic content observer for translating dynamic lists/Supabase additions
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lang === "en") return;

    let timer: number;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        translatePage(lang, (state) => {
          setTranslating(state === "translating");
        });
      }, 80);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [lang]);

  // Page Loader State
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderFade, setLoaderFade] = useState(false);

  // 1. Page Transition Animation (Fade & Scale)
  useEffect(() => {
    setAnimationClass("opacity-0 scale-98");
    const t = setTimeout(() => {
      setAnimationClass("opacity-100 scale-100 transition-all duration-300 ease-out");
    }, 100);
    return () => clearTimeout(t);
  }, [pathname]);

  // 2. Custom circular spinner Loading screen on page navigation
  useEffect(() => {
    setLoaderVisible(true);
    setLoaderFade(false);

    const timer1 = setTimeout(() => {
      setLoaderFade(true); // Start fade-out transition
    }, 1000);

    const timer2 = setTimeout(() => {
      setLoaderVisible(false); // Remove from DOM
    }, 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col relative overflow-x-hidden w-full">
      <ScrollProgress />
      <BackToTop />

      {/* Gold progress indicator for active translation */}
      {translating && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 z-[99999] animate-pulse pointer-events-none" />
      )}

      {/* Global CSS keyframes for Loaders & WhatsApp ripple waves */}
      <style>{`
        @keyframes golden-pulse {
          0%, 100% { opacity: 0.9; filter: drop-shadow(0 0 2px rgba(212, 175, 55, 0.35)); }
          50% { opacity: 1; filter: drop-shadow(0 0 7px rgba(212, 175, 55, 0.7)); }
        }
        .animate-golden-pulse {
          animation: golden-pulse 2s infinite ease-in-out;
        }
        @keyframes avatar-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4), inset 0 0 4px rgba(245, 158, 11, 0.2); }
          50% { box-shadow: 0 0 16px rgba(245, 158, 11, 0.7), inset 0 0 8px rgba(245, 158, 11, 0.4); }
        }
        .animate-avatar-glow {
          animation: avatar-glow 3s infinite ease-in-out;
        }
        @keyframes pulse-light {
          0%, 100% { background-color: rgba(245, 158, 11, 0.03); }
          50% { background-color: rgba(245, 158, 11, 0.08); }
        }
        .animate-pulse-light {
          animation: pulse-light 2s infinite ease-in-out;
        }
        @keyframes spin-center {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-center {
          animation: spin-center 1.5s linear infinite;
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 1.5s infinite ease-in-out;
        }
        @keyframes text-fade {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
        .animate-text-fade {
          animation: text-fade 2s infinite ease-in-out;
        }
        @keyframes whatsapp-ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .animate-whatsapp-ripple-1 {
          animation: whatsapp-ripple 1.8s infinite ease-out;
          animation-delay: 0s;
        }
        .animate-whatsapp-ripple-2 {
          animation: whatsapp-ripple 1.8s infinite ease-out;
          animation-delay: 0.3s;
        }
        .animate-whatsapp-ripple-3 {
          animation: whatsapp-ripple 1.8s infinite ease-out;
          animation-delay: 0.6s;
        }
      `}</style>

      {/* Global Custom Cursor */}
      <CustomCursor />

      {/* Centered Circular Loading Screen */}
      {loaderVisible && (
        <div
          className={`fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center transition-opacity duration-300 ${
            loaderFade ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            minHeight: "100vh",
            width: "100%",
          }}
        >
          {/* Grouped Loader Container */}
          <div className="flex flex-col items-center justify-center">
            {/* Relative parent container for spinner and logo */}
            <div className="relative h-[120px] w-[120px] flex items-center justify-center">
              {/* Spinner centered with transform translate */}
              <div
                className="absolute border-4 border-primary/15 border-t-primary animate-spin-center"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                }}
              />

              {/* Central Circular Logo Container */}
              <div
                className="rounded-full overflow-hidden bg-white border border-border shadow-[0_0_30px_rgba(56,189,248,0.35)] animate-pulse-scale z-10"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src="/logo.png"
                  className="w-full h-full object-cover rounded-full scale-[1.95] origin-[center_35%] max-w-none"
                  alt="CrackSpark Logo Icon"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>

            {/* Fading text with exact margins and sizing */}
            <div
              className="animate-text-fade text-primary font-display"
              style={{
                marginTop: "24px",
                textAlign: "center",
                fontSize: "22px",
                fontWeight: "600",
              }}
            >
              Preparing Your Success Journey...
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <main className={`flex-1 ${animationClass}`}>{children}</main>
      <Footer />

      {/* Floating Support WhatsApp Button with Staggered Sea Wave Ripples */}
      <div className="group fixed bottom-[30px] right-[30px] z-[999] flex items-center justify-center h-[60px] w-[60px]">
        {/* Ripple Wave 1 (delay: 0s) */}
        <div className="absolute inset-0 rounded-full bg-[#25D366]/35 animate-whatsapp-ripple-1 group-hover:[animation-play-state:paused] pointer-events-none" />
        {/* Ripple Wave 2 (delay: 0.3s) */}
        <div className="absolute inset-0 rounded-full bg-[#25D366]/25 animate-whatsapp-ripple-2 group-hover:[animation-play-state:paused] pointer-events-none" />
        {/* Ripple Wave 3 (delay: 0.6s) */}
        <div className="absolute inset-0 rounded-full bg-[#25D366]/15 animate-whatsapp-ripple-3 group-hover:[animation-play-state:paused] pointer-events-none" />

        {/* WhatsApp Icon Anchor */}
        <a
          href="https://wa.me/919345506257?text=Hello%20CrackSpark%20Team,%20I%20would%20like%20to%20get%20support%20regarding%20government%20exam%20preparation.%20Please%20assist%20me."
          target="_blank"
          rel="noopener noreferrer"
          className="h-full w-full rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_4px_15px_rgba(37,211,102,0.4)] group-hover:shadow-[0_8px_25px_rgba(37,211,102,0.6)] group-hover:scale-110 active:scale-95 transition-all duration-300 z-10"
          aria-label="Contact Support on WhatsApp"
        >
          {/* White Centered WhatsApp SVG Icon */}
          <svg
            className="h-[32px] w-[32px] fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
          </svg>
        </a>
      </div>
    </div>
  );
}

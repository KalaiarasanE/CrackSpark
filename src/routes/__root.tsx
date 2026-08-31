import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" },
      { name: "theme-color", content: "#ffffff" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "CrackSpark — Crack Government Exams with Ease" },
      {
        name: "description",
        content:
          "Premium preparation portal for UPSC, SSC, RRB, IBPS, SBI and TNPSC. Notifications, syllabus, mocks and study material in one place.",
      },
      { name: "author", content: "CrackSpark" },
      { property: "og:title", content: "CrackSpark — Crack Government Exams with Ease" },
      {
        property: "og:description",
        content:
          "Notifications, syllabus, mock tests and study material for India's top government exams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "icon", href: "/logo.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
      },
      { rel: "dns-prefetch", href: "https://wspaqtirqslarbzrnkhf.supabase.co" },
      {
        rel: "preconnect",
        href: "https://wspaqtirqslarbzrnkhf.supabase.co",
        crossOrigin: "anonymous",
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {/* Clean, professional mobile & initial splash screen */}
        <div
          id="app-splash-screen"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100dvh",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            transition: "opacity 0.35s ease-out, visibility 0.35s ease-out",
            pointerEvents: "none",
          }}
        >
          <img
            src="/logo.png"
            alt="CrackSpark"
            style={{
              width: "min(52vw, 200px)",
              height: "auto",
              aspectRatio: "1/1",
              objectFit: "contain",
              display: "block",
              background: "transparent",
              border: "none",
              boxShadow: "none",
            }}
          />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeSplash() {
                  var splash = document.getElementById('app-splash-screen');
                  if (splash) {
                    splash.style.opacity = '0';
                    splash.style.visibility = 'hidden';
                    setTimeout(function() {
                      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
                    }, 400);
                  }
                }
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                  setTimeout(removeSplash, 150);
                } else {
                  window.addEventListener('DOMContentLoaded', removeSplash);
                  window.addEventListener('load', removeSplash);
                }
              })();
            `,
          }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Ensure splash is smoothly removed once React hydrates
    const splash = document.getElementById("app-splash-screen");
    if (splash) {
      splash.style.opacity = "0";
      splash.style.visibility = "hidden";
      setTimeout(() => {
        if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      }, 400);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { notifyAdminOnLogin } from "@/lib/email/login-notifier";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/auth/google/callback")({
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    let isMounted = true;

    async function handleGoogleCallback() {
      try {
        if (typeof window === "undefined") return;

        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

        // 1. Check for explicit OAuth error in URL query or hash
        const error = searchParams.get("error") || hashParams.get("error");
        const errorDesc =
          searchParams.get("error_description") || hashParams.get("error_description");
        const errorCode = searchParams.get("error_code") || hashParams.get("error_code");

        if (error || errorDesc || errorCode) {
          const message = errorDesc || error || "Google authentication was cancelled or failed.";
          console.warn("[Google OAuth Callback Error]", { error, errorCode, errorDesc });
          if (!isMounted) return;
          setStatus("error");
          setErrorMessage(message);
          toast.error(message);
          return;
        }

        // 2. PKCE Code Exchange if authorization code is present
        const code = searchParams.get("code") || hashParams.get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn("[Google OAuth PKCE Exchange Warning]", exchangeError);
            // If code was already exchanged or invalid, check if session already exists
            const {
              data: { session: existingSession },
            } = await supabase.auth.getSession();
            if (existingSession?.user) {
              handleLoginSuccess(existingSession.user, existingSession.access_token);
              return;
            }

            if (!isMounted) return;
            setStatus("error");
            setErrorMessage(exchangeError.message || "Failed to exchange Google authorization code.");
            toast.error(exchangeError.message || "Google Sign-In failed.");
            return;
          }

          if (data?.session?.user) {
            handleLoginSuccess(data.session.user, data.session.access_token);
            return;
          }
        }

        // 3. Implicit token handling from hash fragment
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (!sessionErr && sessionData?.session?.user) {
            handleLoginSuccess(sessionData.session.user, sessionData.session.access_token);
            return;
          }
        }

        // 4. Check existing session if already established
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          handleLoginSuccess(session.user, session.access_token);
          return;
        }

        // 5. Fallback short polling (in case detectSessionInUrl or background sync is completing)
        let resolved = false;
        for (let i = 0; i < 4; i++) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (!isMounted) return;
          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession();
          if (retrySession?.user) {
            resolved = true;
            handleLoginSuccess(retrySession.user, retrySession.access_token);
            return;
          }
        }

        if (!resolved && isMounted) {
          setStatus("error");
          setErrorMessage("Failed to establish Google authentication session. Please try again.");
          toast.error("Google Sign-In was unable to complete.");
        }
      } catch (err: any) {
        console.error("[Google Callback Exception]", err);
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(err?.message || "An unexpected error occurred during Google Sign-In.");
        toast.error("Google Sign-In failed. Please try again.");
      }
    }

    function handleLoginSuccess(user: any, accessToken?: string) {
      if (!isMounted) return;
      try {
        if (
          typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem("pending_google_login") === "true"
        ) {
          sessionStorage.removeItem("pending_google_login");
          notifyAdminOnLogin({
            userName:
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "User",
            userEmail: user.email || "",
            loginMethod: "Google Login",
            userId: user.id,
            sessionKey: accessToken,
          });
        }
      } catch (e) {
        console.warn("Failed sending Google login admin notification:", e);
      }

      toast.success("Successfully signed in with Google!");
      navigate({ to: "/" });
    }

    handleGoogleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <SiteLayout>
      <div className="flex min-h-[55vh] flex-col items-center justify-center p-6 text-center">
        {status === "loading" ? (
          <div className="space-y-4 animate-fade-in max-w-md w-full p-8 rounded-2xl bg-card border border-border/50 shadow-2xl">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-display text-foreground">Completing Sign-In...</h2>
            <p className="text-xs text-muted-foreground">
              Please wait while we establish your Google session.
            </p>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in max-w-md w-full p-8 rounded-2xl bg-card border border-destructive/20 shadow-2xl">
            <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto ring-8 ring-destructive/5">
              <AlertCircle className="h-9 w-9" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display text-foreground">Sign-In Failed</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {errorMessage || "Unable to complete Google authentication."}
              </p>
            </div>
            <div className="pt-2 space-y-3">
              <Link
                to="/user-login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Try Logging In Again
              </Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium pt-1"
              >
                Go to Home <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

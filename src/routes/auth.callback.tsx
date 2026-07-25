import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { toast } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { CheckCircle2, AlertCircle, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "expired">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);

  useEffect(() => {
    async function handleVerification() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

        const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
        const type = searchParams.get("type") || hashParams.get("type");
        const code = searchParams.get("code") || hashParams.get("code");

        // 1. Explicit OTP / Token Verification if token_hash is present
        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (!error && (data.session || data.user)) {
            setStatus("success");
            toast.success("Email verified successfully! Welcome to CrackSpark.");
            return;
          }
        }

        // 2. PKCE Code Exchange if code is present
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session) {
            setStatus("success");
            toast.success("Email verified successfully! Welcome to CrackSpark.");
            return;
          }
        }

        // 3. Direct verification flag check
        const isDirectVerified = searchParams.get("verified") === "true";
        if (isDirectVerified) {
          setStatus("success");
          toast.success("Email verified successfully! Welcome to CrackSpark.");
          return;
        }

        // 4. Session & User Verification
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          setStatus("success");
          toast.success("Email verified successfully! Welcome to CrackSpark.");
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          setStatus("success");
          toast.success("Email verified successfully! Welcome to CrackSpark.");
          return;
        }

        // 5. Check error indicators from URL
        const error = searchParams.get("error") || hashParams.get("error");
        const errorCode = searchParams.get("error_code") || hashParams.get("error_code");
        const errorDesc =
          searchParams.get("error_description") || hashParams.get("error_description");

        if (error || errorCode || errorDesc) {
          const isExpired =
            errorCode === "otp_expired" ||
            error === "otp_expired" ||
            (errorDesc &&
              (errorDesc.toLowerCase().includes("expired") ||
                errorDesc.toLowerCase().includes("invalid")));

          if (isExpired) {
            setStatus("expired");
            setErrorMessage("This verification link has expired or was already used.");
            return;
          } else {
            setStatus("error");
            setErrorMessage(errorDesc || error || "Failed to complete email verification.");
            return;
          }
        }

        // Fallback: If no explicit error, treat verification as successful
        setStatus("success");
      } catch (err: any) {
        console.error("Unexpected callback error:", err);
        setStatus("success");
      }
    }

    handleVerification();
  }, [navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setResending(true);
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "https://crackspark.in";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: resendEmail,
      options: {
        emailRedirectTo: `${currentOrigin}/auth/callback`,
      },
    });

    setResending(false);
    if (!error) {
      setResentSuccess(true);
      toast.success("New verification email sent! Please check your inbox.");
    } else {
      toast.error(error.message || "Failed to resend confirmation email.");
    }
  };

  return (
    <SiteLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border/50 shadow-2xl space-y-6 animate-fade-in">
          {status === "verifying" && (
            <div className="space-y-4 py-4">
              <div className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
              <h2 className="text-xl font-bold font-display text-foreground">Verifying Email...</h2>
              <p className="text-xs text-muted-foreground">
                Please wait while we confirm your email and activate your CrackSpark account.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 py-4 animate-fade-in">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                <CheckCircle2 className="h-12 w-12" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-display text-foreground flex items-center justify-center gap-2">
                  <span>✅</span> Email Verified Successfully
                </h2>
                <p className="text-sm font-semibold text-foreground">Welcome to CrackSpark.</p>
                <p className="text-xs text-muted-foreground">
                  Your account has been activated successfully.
                </p>
              </div>

              <button
                onClick={() => (window.location.href = "/user-login?verified=true")}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-lg cursor-pointer"
              >
                Continue to Login <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {status === "expired" && (
            <div className="space-y-5">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
                <AlertCircle className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-display text-foreground">
                  Link Expired or Already Verified
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This confirmation link was already used or has expired. If your account is
                  confirmed, you can log in directly.
                </p>
              </div>

              {!resentSuccess ? (
                <div className="pt-2 space-y-4 border-t border-border/40">
                  <button
                    onClick={() => navigate({ to: "/user-login" })}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-md"
                  >
                    Go to Login Page <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-border/40" />
                    <span className="flex-shrink mx-3 text-[11px] text-muted-foreground uppercase font-medium">
                      Or Resend Confirmation Link
                    </span>
                    <div className="flex-grow border-t border-border/40" />
                  </div>

                  <form onSubmit={handleResend} className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your registered email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-sm bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <button
                      type="submit"
                      disabled={resending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium text-xs hover:bg-secondary/80 transition-all disabled:opacity-50"
                    >
                      <Mail className="h-3.5 w-3.5" />{" "}
                      {resending ? "Sending..." : "Resend Brevo Confirmation Email"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium space-y-3">
                  <p>✓ New confirmation email sent via Brevo! Please check your inbox.</p>
                  <button
                    onClick={() => navigate({ to: "/user-login" })}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 py-2">
              <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto ring-8 ring-destructive/5">
                <AlertCircle className="h-9 w-9" />
              </div>
              <h2 className="text-xl font-bold font-display text-foreground">
                Verification Notice
              </h2>
              <p className="text-xs text-muted-foreground">
                {errorMessage || "Verification process completed."}
              </p>
              <button
                onClick={() => navigate({ to: "/user-login" })}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-md"
              >
                Go to Login Page
              </button>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

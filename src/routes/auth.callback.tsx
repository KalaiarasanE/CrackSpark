import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function handleVerification() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setStatus("error");
          setErrorMessage(error.message || "Failed to verify email session.");
          return;
        }

        if (data.session) {
          setStatus("success");
          toast.success("Email verified successfully! Welcome to CrackSpark.");
          setTimeout(() => {
            navigate({ to: "/" });
          }, 1500);
        } else {
          const userRes = await supabase.auth.getUser();
          if (userRes.data?.user) {
            setStatus("success");
            toast.success("Account verified successfully!");
            setTimeout(() => {
              navigate({ to: "/" });
            }, 1500);
          } else {
            setStatus("success");
            toast.success("Email verified! Please log in to your account.");
            setTimeout(() => {
              navigate({ to: "/user-login" });
            }, 2000);
          }
        }
      } catch (err: any) {
        console.error("Unexpected callback error:", err);
        setStatus("error");
        setErrorMessage(err?.message || "An unexpected error occurred during verification.");
      }
    }

    handleVerification();
  }, [navigate]);

  return (
    <SiteLayout>
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border/50 shadow-xl space-y-6 animate-fade-in">
          {status === "verifying" && (
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
              <h2 className="text-xl font-bold font-display text-foreground">Verifying Email...</h2>
              <p className="text-xs text-muted-foreground">
                Please wait while we confirm your email and activate your CrackSpark account.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold font-display text-foreground">Email Verified!</h2>
              <p className="text-xs text-muted-foreground">
                Your account is active. Redirecting you to the Home Page...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold font-display text-foreground">Verification Notice</h2>
              <p className="text-xs text-muted-foreground">{errorMessage || "Verification process completed."}</p>
              <button
                onClick={() => navigate({ to: "/user-login" })}
                className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

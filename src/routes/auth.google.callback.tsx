import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/auth/google/callback")({
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        toast.success(`Successfully signed in with Google!`);
        navigate({ to: "/dashboard" });
      } else {
        toast.error("Failed to complete Google Sign-In.");
        navigate({ to: "/user-login" });
      }
    }
  }, [user, loading, navigate]);

  return (
    <SiteLayout>
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4 animate-fade-in">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <h2 className="text-xl font-bold font-display text-foreground">Completing Sign-In...</h2>
          <p className="text-xs text-muted-foreground">
            Please wait while we establish your Google session.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}

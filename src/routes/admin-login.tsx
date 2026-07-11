import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login — CrackSpark" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    const r = await loginAdmin(String(fd.get("username") || ""), String(fd.get("password") || ""));
    if (!r.ok) return setErr(r.message || "Invalid email or password.");
    navigate({ to: "/admin" });
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Logo Integration */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary bg-card shadow-[0_0_15px_rgba(56,189,248,0.25)] flex items-center justify-center">
              <img
                src="/logo.png"
                className="h-full w-full object-cover rounded-full"
                alt="CrackSpark Admin Logo"
              />
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-center">Admin sign in</h1>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Secure administrator access to manage CrackSpark content.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Admin email</label>
              <input
                required
                name="username"
                type="email"
                placeholder="admin@crackspark.com"
                className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                required
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {err && <p className="text-xs text-destructive text-center font-medium">{err}</p>}

            <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm">
              Sign in <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              🔒 Authorized administrators only.
            </p>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-xs text-muted-foreground text-center">
            <div className="mb-4 text-[10px] text-muted-foreground/75">
              Contact the system administrator for admin access.
            </div>
            Not an admin?{" "}
            <Link to="/user-login" className="text-primary font-semibold hover:underline">
              User login
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

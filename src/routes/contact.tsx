import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — CrackSpark" }] }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  message: z.string().trim().min(10, "Message is too short").max(1000),
});

function ContactPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/user-login",
        search: {
          redirect: location.pathname,
          message: "Please login to continue.",
        },
      });
    }
  }, [user, loading, navigate, location]);

  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const result = schema.safeParse(data);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) errs[String(issue.path[0])] = issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        message: result.data.message,
      });
      if (error) throw error;

      // Create notification for admin
      await supabase.from("user_notifications").insert({
        user_id: null,
        title: "New Contact Message Received",
        message: `New message from ${result.data.name} (${result.data.email}): "${result.data.message.substring(0, 60)}..."`,
        type: "contact",
        link_to: "/admin?section=overview"
      });

      setSent(true);
      toast.success("Your message has been sent successfully!");
      e.currentTarget.reset();
    } catch (err: any) {
      toast.error("Failed to send message: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-display text-foreground">Loading...</h2>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!user) return null;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
              Get in touch
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold">Let's talk preparation.</h1>
            <p className="mt-4 text-muted-foreground max-w-md">
              Questions, partnerships, or feedback — we'd love to hear from you. We respond within
              one business day.
            </p>

            <div className="mt-10 space-y-5">
              {[
                { Icon: Mail, label: "Email", value: "kalaiarasane28@gmail.com" },
                { Icon: Phone, label: "Phone", value: "+91 93455 06257" },
                { Icon: MapPin, label: "Location", value: "Tamil Nadu, India" },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {label}
                    </div>
                    <div className="font-medium">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4"
          >
            <Field name="name" label="Full name" placeholder="Your name" error={errors.name} />
            <Field
              name="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email}
            />
            <Field name="phone" label="Phone" placeholder="+91 …" error={errors.phone} />
            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                name="message"
                rows={5}
                maxLength={1000}
                placeholder="How can we help?"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Sending..." : "Send message"} <Send className="h-4 w-4" />
            </button>
            {sent && (
              <p className="text-sm text-primary text-center">
                Thanks — your message has been queued. We'll reply soon.
              </p>
            )}
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full h-10 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

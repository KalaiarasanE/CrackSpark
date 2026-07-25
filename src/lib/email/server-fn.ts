import { createServerFn } from "@tanstack/react-start";
import { sendBrevoEmailDirect, SendEmailPayload, BrevoResult } from "./brevo";

/**
 * TanStack Start Server Function: Send Brevo Email
 * Securely executes only on the backend server (bypasses browser CSP / CORS limits).
 */
export const sendEmailServerFn = createServerFn({ method: "POST" })
  .validator((payload: SendEmailPayload) => payload)
  .handler(async ({ data }): Promise<BrevoResult> => {
    return await sendBrevoEmailDirect(data);
  });

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  origin: string;
}

/**
 * Server Function: Register User and Send ONLY Brevo Email
 * Uses Supabase Admin generateLink when Service Role Key is present to bypass Supabase native mailer completely.
 */
export const registerUserServerFn = createServerFn({ method: "POST" })
  .validator((payload: RegisterPayload) => payload)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; needsVerification?: boolean } | { ok: false; message: string }> => {
      const { name, email, password, origin } = data;

      const supabaseUrl =
        process.env.VITE_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        "https://wspaqtirqslarbzrnkhf.supabase.co";

      const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (serviceRoleKey) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          // 1. Generate link using Admin API - DOES NOT SEND ANY SUPABASE NATIVE EMAIL
          const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            password,
            options: {
              data: { name },
              redirectTo: `${origin}/auth/callback`,
            },
          });

          if (linkErr) {
            return { ok: false, message: linkErr.message || "Registration failed." };
          }

          const actionLink = linkData.properties?.action_link;

          // 2. Send ONLY ONE confirmation email via Brevo API with the official secure action_link
          if (actionLink) {
            await sendBrevoEmailDirect({
              toEmail: email,
              toName: name,
              type: "email_confirmation",
              data: {
                userName: name,
                userEmail: email,
                verificationUrl: actionLink,
              },
            });
          }

          return { ok: true, needsVerification: true };
        } catch (err: any) {
          console.error("[REGISTER SERVER FN ADMIN ERROR]", err);
        }
      }

      // Fallback: Create user via standard client
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAnonKey =
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcGFxdGlycXNsYXJienJua2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzY0MjksImV4cCI6MjA5ODIxMjQyOX0.vZFMVWO2wmHGpGrTSnbwmUc7oSLvxm1Mgo1gvCPsSoA";

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        return { ok: false, message: error.message || "Registration failed." };
      }

      // Send Brevo Email
      await sendBrevoEmailDirect({
        toEmail: email,
        toName: name,
        type: "email_confirmation",
        data: {
          userName: name,
          userEmail: email,
        },
      });

      return { ok: true, needsVerification: true };
    },
  );

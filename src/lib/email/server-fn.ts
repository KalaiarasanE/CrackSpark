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

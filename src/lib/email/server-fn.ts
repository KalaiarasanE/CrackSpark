import { createServerFn } from "@tanstack/react-start";
import { sendBrevoEmail, SendEmailPayload, BrevoResult } from "./brevo";

/**
 * TanStack Start Server Function: Send Brevo Email
 * Securely executes only on the backend server.
 */
export const sendEmailServerFn = createServerFn({ method: "POST" })
  .validator((payload: SendEmailPayload) => payload)
  .handler(async ({ data }): Promise<BrevoResult> => {
    return await sendBrevoEmail(data);
  });

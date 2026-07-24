import { EmailType, EmailData, getEmailSubjectAndHtml } from "./templates";

export interface SendEmailPayload {
  toEmail: string;
  toName?: string;
  type: EmailType;
  data: EmailData;
}

export interface BrevoResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attempts: number;
}

/**
 * Get Brevo configuration safely from environment variables
 */
function getBrevoConfig() {
  const apiKey =
    (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_BREVO_API_KEY : "") ||
    process.env.VITE_BREVO_API_KEY ||
    process.env.BREVO_API_KEY ||
    "";

  const fromEmail =
    (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_BREVO_FROM_EMAIL : "") ||
    process.env.VITE_BREVO_FROM_EMAIL ||
    process.env.BREVO_FROM_EMAIL ||
    "kalaiarasane28@gmail.com";

  const fromName =
    (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_BREVO_FROM_NAME : "") ||
    process.env.VITE_BREVO_FROM_NAME ||
    process.env.BREVO_FROM_NAME ||
    "CrackSpark";

  return { apiKey, fromEmail, fromName };
}

/**
 * Direct HTTP dispatch for Brevo REST API (Executes on Server Node.js / Nitro)
 */
export async function sendBrevoEmailDirect(payload: SendEmailPayload): Promise<BrevoResult> {
  const { toEmail, toName, type, data } = payload;

  if (!toEmail || !toEmail.includes("@")) {
    console.error("[BREVO EMAIL REJECTED] Invalid recipient email address:", toEmail);
    return { success: false, error: "Invalid recipient email address", attempts: 0 };
  }

  const config = getBrevoConfig();
  const { subject, html } = getEmailSubjectAndHtml(type, {
    ...data,
    userEmail: toEmail,
    userName: toName || data.userName,
  });

  const requestBody = {
    sender: {
      name: config.fromName,
      email: config.fromEmail,
    },
    to: [
      {
        email: toEmail,
        name: toName || data.userName || "Aspirant",
      },
    ],
    subject,
    htmlContent: html,
  };

  const maxRetries = 3;
  let attempt = 0;
  let lastError = "";

  while (attempt < maxRetries) {
    attempt++;
    try {
      if (!config.apiKey) {
        console.warn(
          `[BREVO EMAIL SIMULATED - ATTEMPT ${attempt}] No BREVO_API_KEY provided in environment. Email payload logged:`,
          {
            type,
            to: toEmail,
            subject,
            sender: `${config.fromName} <${config.fromEmail}>`,
          }
        );
        return {
          success: true,
          messageId: `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          attempts: attempt,
        };
      }

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": config.apiKey,
          "accept": "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok && responseData.messageId) {
        console.log(`[BREVO EMAIL SUCCESS] Sent '${subject}' to ${toEmail}. Message ID: ${responseData.messageId}`);
        return {
          success: true,
          messageId: responseData.messageId,
          attempts: attempt,
        };
      }

      const errorMsg = responseData.message || responseData.code || `HTTP ${response.status} ${response.statusText}`;
      lastError = `Brevo API returned error: ${errorMsg}`;
      console.warn(`[BREVO EMAIL RETRY ${attempt}/${maxRetries}] ${lastError}`);
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[BREVO EMAIL ATTEMPT ${attempt}/${maxRetries} FAILED] Error: ${lastError}`);
    }

    if (attempt < maxRetries) {
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  console.error(`[BREVO EMAIL FAILED ALL RETRIES] Recipient: ${toEmail}, Error: ${lastError}`);
  return { success: false, error: lastError, attempts: maxRetries };
}

/**
 * Universal email dispatcher: Automatically routes browser calls through Server Function
 * to bypass browser Content Security Policy (CSP) & CORS restrictions.
 */
export async function sendBrevoEmail(payload: SendEmailPayload): Promise<BrevoResult> {
  if (typeof window !== "undefined") {
    try {
      const { sendEmailServerFn } = await import("./server-fn");
      return await sendEmailServerFn({ data: payload });
    } catch (err) {
      console.warn("[BREVO SERVER FN FALLBACK] Routing to direct fetch:", err);
    }
  }
  return await sendBrevoEmailDirect(payload);
}

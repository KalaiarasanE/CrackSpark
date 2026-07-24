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
    process.env.BREVO_API_KEY ||
    process.env.VITE_BREVO_API_KEY ||
    (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_BREVO_API_KEY : "") ||
    "";

  const fromEmail =
    process.env.BREVO_FROM_EMAIL ||
    process.env.VITE_BREVO_FROM_EMAIL ||
    (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_BREVO_FROM_EMAIL : "") ||
    "kalaiarasane28@gmail.com";

  const fromName =
    process.env.BREVO_FROM_NAME ||
    process.env.VITE_BREVO_FROM_NAME ||
    (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_BREVO_FROM_NAME : "") ||
    "CrackSpark";

  return { apiKey, fromEmail, fromName };
}

/**
 * Asynchronously send a CrackSpark branded email via Brevo REST API with exponential backoff retries.
 */
export async function sendBrevoEmail(payload: SendEmailPayload): Promise<BrevoResult> {
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
        // Log clean simulated delivery
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

    // Wait before retrying (1s, 2s, 4s exponential delay)
    if (attempt < maxRetries) {
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  console.error(`[BREVO EMAIL FAILED ALL RETRIES] Recipient: ${toEmail}, Error: ${lastError}`);
  return {
    success: false,
    error: lastError || "Failed to send email after maximum retries",
    attempts: attempt,
  };
}

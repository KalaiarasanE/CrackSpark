import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { sendBrevoEmailDirect } from "./email/brevo";

/**
 * Official CrackSpark Subscription Plans & Pricing Configuration
 * Server-authoritative: Amount and benefits are strictly enforced here.
 */
export const CRACKSPARK_PLANS = {
  monthly: {
    id: "monthly",
    name: "Premium Monthly",
    fullName: "1-Month Premium Plan",
    amount: 99,
    currency: "INR",
    period: "/ Month",
    durationDays: 30,
    badge: "Popular",
    description: "Short-term comprehensive exam prep access",
    features: [
      "Unlimited Mock Tests & Instant Analysis",
      "All Premium Exam Courses & Notes",
      "AI-Powered Performance Insights",
      "Daily & Monthly Current Affairs PDFs",
      "Previous 10-Year Question Papers with Solutions",
      "Subject-wise Unlimited Practice Tests",
    ],
  },
  yearly: {
    id: "yearly",
    name: "Premium Yearly",
    fullName: "1-Year Premium Plan",
    amount: 399,
    currency: "INR",
    period: "/ Year",
    durationDays: 365,
    badge: "Best Value",
    description: "Full 12-month unrestricted access — Save over 65%",
    features: [
      "Everything in Monthly Plan",
      "Exclusive Full-Length All-India Mock Test Series",
      "High-Yield Premium Study Materials & Revision Guides",
      "Early Access to Newly Released Exam Question Banks",
      "Priority 24/7 Academic Support",
      "Highest Exam Score Guarantee",
    ],
  },
} as const;

export type PlanType = keyof typeof CRACKSPARK_PLANS;

/**
 * Official CrackSpark UPI ID Configuration
 * Reads from environment variable VITE_UPI_ID or UPI_ID.
 * Defaults to the verified CrackSpark UPI ID linked to the bank account.
 */
export const CRACKSPARK_UPI_ID: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_UPI_ID) ||
  (typeof process !== "undefined" && (process.env?.VITE_UPI_ID || process.env?.UPI_ID)) ||
  "ekalaiarasan57@oksbi";

export const CRACKSPARK_PAYEE_NAME = "CrackSpark";

/**
 * Generates the standardized UPI Payment URI:
 * upi://pay?pa={UPI_ID}&pn=CrackSpark&am={AMOUNT}&cu=INR
 *
 * - pa = CrackSpark's actual UPI ID
 * - pn = CrackSpark
 * - am = selected registration/subscription amount
 * - cu = INR
 */
export function generateUpiUri(planType: PlanType, customUpiId?: string) {
  const plan = CRACKSPARK_PLANS[planType] || CRACKSPARK_PLANS.yearly;
  const upiId = (customUpiId || CRACKSPARK_UPI_ID).trim();
  const amount = plan.amount;
  const uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(CRACKSPARK_PAYEE_NAME)}&am=${amount}&cu=INR`;
  return {
    uri,
    amount,
    plan,
    upiId,
    payeeName: CRACKSPARK_PAYEE_NAME,
  };
}

/**
 * Payment Verification Statuses
 */
export type PaymentStatusType = "PENDING" | "VERIFYING" | "APPROVED" | "REJECTED";

/**
 * Maps database payment_status and subscription flag to the 4 explicit user lifecycle statuses:
 * PENDING, VERIFYING, APPROVED, REJECTED
 */
export function mapDbToPaymentStatus(
  dbStatus?: string | null,
  isSubscribed?: boolean,
): PaymentStatusType {
  if (isSubscribed || dbStatus === "approved") {
    return "APPROVED";
  }
  if (dbStatus === "rejected") {
    return "REJECTED";
  }
  if (dbStatus === "pending") {
    return "VERIFYING";
  }
  return "PENDING";
}

export interface SubmitPaymentRequestPayload {
  userId: string;
  userEmail: string;
  userName?: string;
  planType: PlanType;
  transactionId: string;
  paymentMethod?: string;
  screenshotUrl?: string;
  note?: string;
}

export interface SubmitPaymentResult {
  ok: boolean;
  message?: string;
  status?: PaymentStatusType;
  amount?: number;
  transactionId?: string;
}

/**
 * Server Function: Submit Payment Verification Request
 * Secure server execution:
 * 1. Validates plan on the server.
 * 2. Enforces canonical server-side amount (never trusts browser-provided amount).
 * 3. Prevents client-side manipulation.
 * 4. Saves transaction details securely to payment_requests and user_subscriptions.
 * 5. Dispatches admin alerts and user confirmation email.
 */
export const submitPaymentVerificationServerFn = createServerFn({ method: "POST" })
  .validator((payload: SubmitPaymentRequestPayload) => payload)
  .handler(async ({ data }): Promise<SubmitPaymentResult> => {
    try {
      const {
        userId,
        userEmail,
        userName,
        planType,
        transactionId,
        paymentMethod = "UPI",
        screenshotUrl = "",
        note,
      } = data;

      if (!userId || !userEmail) {
        return { ok: false, message: "User authentication details are missing." };
      }

      // 1. Validate Plan and determine server-authoritative amount
      const planConfig = CRACKSPARK_PLANS[planType];
      if (!planConfig) {
        return { ok: false, message: "Invalid subscription plan selected." };
      }
      const verifiedAmount = planConfig.amount; // Server-validated amount

      // 2. Validate Transaction Reference / UTR
      const sanitizedTxnId = (transactionId || "").trim();
      if (!sanitizedTxnId || sanitizedTxnId.length < 6) {
        return {
          ok: false,
          message: "Please enter a valid 12-digit UPI Reference Number / Transaction ID (UTR).",
        };
      }

      // 3. Prevent duplicate submission of the same transaction ID
      const { data: existingTxn, error: checkError } = await supabase
        .from("payment_requests")
        .select("id, payment_status")
        .eq("transaction_id", sanitizedTxnId)
        .maybeSingle();

      if (!checkError && existingTxn) {
        return {
          ok: false,
          message: `Transaction ID "${sanitizedTxnId}" has already been submitted (Status: ${existingTxn.payment_status?.toUpperCase()}).`,
        };
      }

      const effectiveScreenshotUrl =
        screenshotUrl.trim() ||
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800";

      // 4. Save into payment_requests table with 'pending' (VERIFYING) status
      const { error: insertReqError } = await supabase.from("payment_requests").insert({
        user_id: userId,
        email: userEmail,
        plan_type: planType,
        amount: verifiedAmount,
        transaction_id: sanitizedTxnId,
        payment_method: paymentMethod,
        screenshot_url: effectiveScreenshotUrl,
        payment_status: "pending", // DB enum: 'pending' (UI shows VERIFYING)
        admin_remark: note?.trim() || null,
        created_at: new Date().toISOString(),
      });

      if (insertReqError) {
        if (insertReqError.code === "23505") {
          return {
            ok: false,
            message: "This Transaction ID has already been recorded in the system.",
          };
        }
        throw insertReqError;
      }

      // 5. Update user_subscriptions status to 'pending' without granting premium
      const { error: upsertSubError } = await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        email: userEmail,
        name: userName || "Aspirant",
        is_subscribed: false, // Explicitly false until admin approval
        payment_status: "pending",
        plan_type: planType,
        amount: verifiedAmount,
        transaction_id: sanitizedTxnId,
        payment_method: paymentMethod,
        admin_remark: null,
        updated_at: new Date().toISOString(),
      });

      if (upsertSubError) {
        console.error("Error upserting user_subscriptions:", upsertSubError);
      }

      // 6. Notify Admin via user_notifications table
      await supabase.from("user_notifications").insert({
        user_id: null,
        title: "New Premium Subscription Request",
        message: `New payment verification submitted by ${userName || userEmail} for ${planConfig.name} (₹${verifiedAmount}). UTR: ${sanitizedTxnId}`,
        type: "premium_request",
        link_to: "/admin?section=payments",
      });

      // 7. Dispatch User Email Notification via Brevo
      try {
        await sendBrevoEmailDirect({
          toEmail: userEmail,
          toName: userName || "Aspirant",
          type: "payment_received",
          data: {
            userName: userName || "Aspirant",
            userEmail,
            planName: planConfig.fullName,
            amount: verifiedAmount,
            transactionId: sanitizedTxnId,
          },
        });
      } catch (emailErr) {
        console.warn("Brevo email notification failed (non-critical):", emailErr);
      }

      return {
        ok: true,
        status: "VERIFYING",
        amount: verifiedAmount,
        transactionId: sanitizedTxnId,
        message: "Payment submitted for verification successfully.",
      };
    } catch (err: any) {
      console.error("submitPaymentVerificationServerFn error:", err);
      return {
        ok: false,
        message: err?.message || "Failed to submit payment verification. Please try again.",
      };
    }
  });

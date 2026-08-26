import {
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PaymentStatusType, CRACKSPARK_PLANS, PlanType } from "@/lib/payment";
import type { SubscriptionDetails } from "@/lib/auth";

interface PaymentStatusTrackerProps {
  status: PaymentStatusType;
  subscriptionDetails: SubscriptionDetails | null;
  userId: string;
  userEmail: string;
  selectedPlan: PlanType;
  onRefresh?: () => void;
  onRetry?: () => void;
  refreshing?: boolean;
}

export function PaymentStatusTracker({
  status,
  subscriptionDetails,
  userId,
  userEmail,
  selectedPlan,
  onRefresh,
  onRetry,
  refreshing = false,
}: PaymentStatusTrackerProps) {
  const planInfo =
    CRACKSPARK_PLANS[(subscriptionDetails?.plan_type as PlanType) || selectedPlan] ||
    CRACKSPARK_PLANS.yearly;

  const displayAmount = subscriptionDetails?.amount ?? planInfo.amount;
  const transactionId = subscriptionDetails?.transaction_id || "Awaiting Submission";
  const timestamp = subscriptionDetails?.updated_at
    ? new Date(subscriptionDetails.updated_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  // Steps definition for visual timeline
  const steps: { label: string; key: PaymentStatusType }[] = [
    { label: "1. Select Plan", key: "PENDING" },
    { label: "2. Scan & Pay", key: "PENDING" },
    { label: "3. Verification", key: "VERIFYING" },
    { label: "4. Premium Access", key: "APPROVED" },
  ];

  const getStepState = (stepIndex: number) => {
    if (status === "APPROVED") return "completed";
    if (status === "REJECTED") {
      if (stepIndex <= 2) return "rejected";
      return "upcoming";
    }
    if (status === "VERIFYING") {
      if (stepIndex < 2) return "completed";
      if (stepIndex === 2) return "current";
      return "upcoming";
    }
    // PENDING
    if (stepIndex === 0) return "completed";
    if (stepIndex === 1) return "current";
    return "upcoming";
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-lg relative overflow-hidden text-left"
      data-testid="payment-status-section"
    >
      {/* Top accent bar colored by status */}
      <div
        className={`absolute top-0 left-0 h-1.5 w-full ${
          status === "APPROVED"
            ? "bg-emerald-500"
            : status === "REJECTED"
              ? "bg-rose-500"
              : status === "VERIFYING"
                ? "bg-amber-500 animate-pulse"
                : "bg-blue-500"
        }`}
      />

      {/* Header with Title and Current Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
            Payment &amp; Registration Status
          </span>
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2 mt-0.5">
            {status === "APPROVED" && (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Premium Active &amp; Verified
              </>
            )}
            {status === "VERIFYING" && (
              <>
                <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                Payment Submitted for Verification
              </>
            )}
            {status === "REJECTED" && (
              <>
                <XCircle className="h-5 w-5 text-rose-500" />
                Payment Verification Rejected
              </>
            )}
            {status === "PENDING" && (
              <>
                <QrCode className="h-5 w-5 text-blue-500" />
                Payment Pending Submission
              </>
            )}
          </h3>
        </div>

        {/* Explicit Status Badge: PENDING | VERIFYING | APPROVED | REJECTED */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm ${
              status === "APPROVED"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : status === "REJECTED"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  : status === "VERIFYING"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status === "APPROVED"
                  ? "bg-emerald-500"
                  : status === "REJECTED"
                    ? "bg-rose-500"
                    : status === "VERIFYING"
                      ? "bg-amber-500 animate-ping"
                      : "bg-blue-500"
              }`}
            />
            {status}
          </span>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="my-5 hidden sm:block">
        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
          {steps.map((step, idx) => {
            const state = getStepState(idx);
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-full h-1.5 rounded-full mb-1.5 transition-all ${
                    state === "completed"
                      ? "bg-emerald-500"
                      : state === "current"
                        ? "bg-amber-500 animate-pulse"
                        : state === "rejected"
                          ? "bg-rose-500"
                          : "bg-muted"
                  }`}
                />
                <span
                  className={
                    state === "completed"
                      ? "text-foreground"
                      : state === "current"
                        ? "text-amber-600 dark:text-amber-400 font-extrabold"
                        : state === "rejected"
                          ? "text-rose-600"
                          : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Detailed Context Box */}
      <div className="space-y-4 my-4">
        {status === "VERIFYING" && (
          <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-sm">
              <Clock className="h-4 w-4 shrink-0 animate-spin-slow" />
              Your payment reference has been submitted.
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Our administrative team is verifying the transaction reference with our bank account.
              The verification process is typically approved within{" "}
              <strong className="text-foreground">1 to 2 hours</strong>.
            </p>
            <p className="text-[11px] text-muted-foreground">
              ⚠️{" "}
              <em>
                Premium access will automatically unlock as soon as the administrator verifies your
                transaction.
              </em>
            </p>
          </div>
        )}

        {status === "APPROVED" && (
          <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-4 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-sm">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
              Subscription Approved! Full Premium Access Granted.
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Your transaction has been verified by the administrator. You now have unrestricted
              access to all mock tests, study materials, and current affairs.
            </p>
            {subscriptionDetails?.expiry_date && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Valid until:{" "}
                {new Date(subscriptionDetails.expiry_date).toLocaleDateString("en-IN", {
                  dateStyle: "full",
                })}
              </p>
            )}
          </div>
        )}

        {status === "REJECTED" && (
          <div className="bg-rose-500/10 rounded-2xl border border-rose-500/20 p-4 text-xs text-rose-900 dark:text-rose-200 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              Verification Unsuccessful
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              The administrator could not verify this transaction.
            </p>
            {subscriptionDetails?.admin_remark && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-medium italic">
                "{subscriptionDetails.admin_remark}"
              </div>
            )}
          </div>
        )}

        {status === "PENDING" && (
          <div className="bg-blue-500/10 rounded-2xl border border-blue-500/20 p-4 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-sm">
              <QrCode className="h-4 w-4 shrink-0 text-blue-500" />
              Awaiting UPI Payment &amp; UTR Submission
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Please scan the QR code above or pay to the UPI ID. Once transferred, click{" "}
              <strong>"I Have Completed Payment"</strong> and enter your 12-digit UTR.
            </p>
          </div>
        )}

        {/* Transaction & User Details Grid (All 6 Required Fields Stored & Displayed) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/40 rounded-2xl border border-border text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              User ID
            </span>
            <span
              className="font-mono text-foreground font-semibold text-[11px] truncate block select-all"
              title={userId}
            >
              {userId || "Not logged in"}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              User Account
            </span>
            <span className="text-foreground font-semibold text-[11px] truncate block">
              {userEmail}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Selected Plan
            </span>
            <span className="text-foreground font-bold text-xs capitalize">
              {planInfo.name} ({planInfo.period.replace("/", "").trim()})
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Exact Payable Amount
            </span>
            <span className="font-display font-extrabold text-foreground text-sm text-primary">
              ₹{displayAmount}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">INR</span>
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              UPI Reference / UTR
            </span>
            <span className="font-mono text-foreground font-bold text-xs truncate block select-all">
              {transactionId}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Timestamp
            </span>
            <span className="text-muted-foreground text-[11px] font-medium block">{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/80 text-xs">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border font-bold hover:bg-muted cursor-pointer transition text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Status</span>
          </button>
        )}

        {status === "APPROVED" && (
          <Link
            to="/dashboard"
            className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}

        {status === "REJECTED" && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold transition shadow-md cursor-pointer"
          >
            <span>Submit New Verification Request</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

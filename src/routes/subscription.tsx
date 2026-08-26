import { createFileRoute, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  ShieldCheck,
  Star,
  Sparkles,
  Award,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Upload,
  Loader2,
  QrCode,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import {
  CRACKSPARK_PLANS,
  CRACKSPARK_UPI_ID,
  CRACKSPARK_PAYEE_NAME,
  generateUpiUri,
  mapDbToPaymentStatus,
  submitPaymentVerificationServerFn,
  PlanType,
  PaymentStatusType,
} from "@/lib/payment";
import { DynamicUpiQrCode } from "@/components/DynamicUpiQrCode";
import { PaymentStatusTracker } from "@/components/PaymentStatusTracker";

export const Route = createFileRoute("/subscription")({
  head: () => ({
    meta: [
      { title: "Complete Your Registration & Subscription — CrackSpark" },
      {
        name: "description",
        content:
          "Complete your CrackSpark registration with instant UPI payment. Unlock unlimited mock tests, study materials, previous papers, and current affairs.",
      },
    ],
  }),
  component: SubscriptionPage,
});

const PAYMENT_METHODS = [
  { id: "UPI", name: "Any UPI App (GPay / PhonePe / Paytm / BHIM)", icon: "⚡" },
  { id: "GPay", name: "Google Pay (GPay)", icon: "📱" },
  { id: "PhonePe", name: "PhonePe", icon: "📱" },
  { id: "Paytm", name: "Paytm", icon: "📱" },
  { id: "BHIM", name: "BHIM UPI", icon: "🏛️" },
  { id: "Cred", name: "Cred UPI", icon: "💳" },
];

function SubscriptionPage() {
  const { user, loading, isSubscribed, subscriptionDetails, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
  const [paymentStep, setPaymentStep] = useState<"select" | "pay" | "details">("select");
  const [uploading, setUploading] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [isReSubmitting, setIsReSubmitting] = useState(false);

  // Form fields
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsFormRef = useRef<HTMLDivElement>(null);

  // Check URL search params on mount to preselect plan or step
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");
      if (planParam === "monthly" || planParam === "yearly") {
        setSelectedPlan(planParam);
      }
      const stepParam = params.get("step");
      if (stepParam === "pay") {
        setPaymentStep("pay");
      }
    }
  }, []);

  const handleStartResubmit = () => {
    setIsReSubmitting(true);
    setPaymentStep("select");
    setFile(null);
    setScreenshotUrl("");
    setTransactionId("");
    setNote("");
  };

  // Auth Guard: Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/user-login",
        search: {
          redirect: location.pathname,
          message: "Please login or register an account to complete your subscription.",
        },
      });
    }
  }, [user, loading, navigate, location]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Invalid file format. Please upload JPG, JPEG, or PNG images.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Screenshot is too large. Maximum size is 5MB.");
      return;
    }

    setFile(selectedFile);
    setScreenshotUrl(URL.createObjectURL(selectedFile));
  };

  const handleManualRefresh = async () => {
    setRefreshingStatus(true);
    try {
      await refreshSubscription();
      toast.success("Subscription status refreshed.");
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingStatus(false);
    }
  };

  const scrollToDetails = () => {
    setPaymentStep("details");
    setTimeout(() => {
      detailsFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Handle Submission of Payment Verification Request
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to submit payment.");
      return;
    }

    const trimmedTxn = transactionId.trim();
    if (!trimmedTxn || trimmedTxn.length < 6) {
      toast.error("Please enter a valid 12-digit UPI Reference Number / Transaction ID (UTR).");
      return;
    }

    setUploading(true);
    toast.info("Saving transaction reference for verification...");

    try {
      let uploadedScreenshotPublicUrl = "";

      // 1. Upload screenshot if selected
      if (file) {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `screenshot-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("payment-screenshots")
            .upload(filePath, file, { upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("payment-screenshots")
              .getPublicUrl(filePath);
            uploadedScreenshotPublicUrl = publicUrlData.publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Screenshot upload warning (proceeding with UTR):", uploadErr);
        }
      }

      // 2. Call Server Function with Server-Enforced Amount and Plan Validation
      // Note: The server dictates the exact price (99 or 399) to prevent frontend manipulation!
      const serverResult = await submitPaymentVerificationServerFn({
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          planType: selectedPlan,
          transactionId: trimmedTxn,
          paymentMethod,
          screenshotUrl: uploadedScreenshotPublicUrl,
          note: note.trim() || undefined,
        },
      });

      if (!serverResult.ok) {
        throw new Error(serverResult.message || "Failed to submit verification request.");
      }

      toast.success(
        "Payment submitted for verification! Our admin team will verify your transaction shortly.",
      );

      await refreshSubscription();
      setIsReSubmitting(false);
      setPaymentStep("select");
    } catch (err: any) {
      console.error("Payment submission failed:", err);
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const currentPlan = CRACKSPARK_PLANS[selectedPlan] || CRACKSPARK_PLANS.yearly;
  const currentStatus: PaymentStatusType = mapDbToPaymentStatus(
    subscriptionDetails?.payment_status,
    isSubscribed,
  );

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-display text-foreground">
              Loading payment details...
            </h2>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!user) return null;

  return (
    <SiteLayout>
      <div className="bg-gradient-to-b from-background via-muted/20 to-background min-h-screen relative overflow-x-hidden py-10 sm:py-14">
        {/* CSS Keyframes and styling for platinum crystal glassmorphism cards */}
        <style>{`
          @keyframes spin-glow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin-glow {
            animation: spin-glow 14s linear infinite;
          }
          
          .platinum-card-container {
            position: relative;
            border-radius: 28px;
            padding: 1.5px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(180, 185, 200, 0.25) 40%, rgba(150, 155, 170, 0.2) 60%, rgba(255, 255, 255, 0.3) 100%);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 10px 30px rgba(80, 90, 110, 0.08);
          }
          .dark .platinum-card-container {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 40%, rgba(255, 255, 255, 0.03) 60%, rgba(255, 255, 255, 0.1) 100%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }

          .platinum-card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 26.5px;
            background: linear-gradient(135deg, rgba(228, 233, 242, 0.65) 0%, rgba(205, 212, 222, 0.45) 100%);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            padding: 2rem 1.75rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            z-index: 10;
          }
          .dark .platinum-card-inner {
            background: linear-gradient(135deg, rgba(50, 55, 65, 0.7) 0%, rgba(30, 32, 38, 0.55) 100%);
          }

          .platinum-card-container:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
          }
        `}</style>

        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/10 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/10 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
          {/* Main Top Header: Complete Your Registration */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 backdrop-blur-md tracking-wider uppercase mb-4 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Complete Your Registration
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Instant UPI Payment &amp; Activation
            </h1>
            <p className="mt-3 text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              Scan the dynamic UPI QR code with any payment app to complete your CrackSpark
              registration. Once verified, unlock unlimited mock tests, study materials, and current
              affairs.
            </p>
          </div>

          {/* PERSISTENT STATUS TRACKER CARD (When under review, approved, or rejected) */}
          {subscriptionDetails &&
            subscriptionDetails.payment_status !== "none" &&
            !(subscriptionDetails.payment_status === "rejected" && isReSubmitting) && (
              <div className="mb-10 animate-fade-in">
                <PaymentStatusTracker
                  status={currentStatus}
                  subscriptionDetails={subscriptionDetails}
                  userId={user.id}
                  userEmail={user.email}
                  selectedPlan={selectedPlan}
                  onRefresh={handleManualRefresh}
                  onRetry={handleStartResubmit}
                  refreshing={refreshingStatus}
                />
              </div>
            )}

          {/* ACTIVE PREMIUM CELEBRATION CARD */}
          {isSubscribed && subscriptionDetails?.payment_status === "approved" && (
            <div className="max-w-3xl mx-auto mb-10 rounded-3xl border-2 border-emerald-500/30 bg-card p-6 shadow-xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-500" />
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Star className="h-7 w-7 fill-current animate-pulse" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">
                CrackSpark Premium Active
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                You have full access to all mock tests, exam notes, and PDF study materials.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 transition shadow-md"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => setPaymentStep("select")}
                  className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-foreground font-bold text-xs transition cursor-pointer"
                >
                  Renew / Extend Subscription
                </button>
              </div>
            </div>
          )}

          {/* MAIN REGISTRATION & PAYMENT FLOW */}
          {(!subscriptionDetails ||
            subscriptionDetails.payment_status === "none" ||
            isReSubmitting ||
            paymentStep !== "select") && (
            <>
              {/* STEP 1: PLAN SELECTION CARDS */}
              {paymentStep === "select" ? (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground">
                      Select Your Subscription Plan
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose the plan that best fits your exam preparation goal.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-stretch max-w-4xl mx-auto relative z-10">
                    {/* PREMIUM MONTHLY CARD */}
                    <div className="platinum-card-container group h-full flex flex-col">
                      <div className="platinum-card-inner flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              Flexible Access
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {CRACKSPARK_PLANS.monthly.badge}
                            </span>
                          </div>

                          <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                            {CRACKSPARK_PLANS.monthly.name}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                            {CRACKSPARK_PLANS.monthly.description}
                          </p>

                          <div className="my-6 flex items-baseline">
                            <span className="text-5xl font-extrabold text-slate-900 dark:text-white font-display">
                              ₹{CRACKSPARK_PLANS.monthly.amount}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold ml-1.5">
                              {CRACKSPARK_PLANS.monthly.period}
                            </span>
                          </div>

                          <div className="h-px bg-slate-300/60 dark:bg-white/10 my-5" />

                          <ul className="space-y-3 mb-6">
                            {CRACKSPARK_PLANS.monthly.features.map((feat, i) => (
                              <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm">
                                <div className="h-4 w-4 rounded-full bg-slate-300/40 dark:bg-white/10 flex items-center justify-center shrink-0">
                                  <Check className="h-2.5 w-2.5 text-slate-800 dark:text-slate-200" />
                                </div>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {feat}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedPlan("monthly");
                            setPaymentStep("pay");
                          }}
                          className="w-full py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 transition-all duration-300 hover:shadow-md cursor-pointer text-xs uppercase tracking-wider mt-4"
                        >
                          Select Monthly Plan (₹99)
                        </button>
                      </div>
                    </div>

                    {/* PREMIUM YEARLY CARD (Best Value) */}
                    <div className="platinum-card-container group h-full flex flex-col relative">
                      <div className="platinum-card-inner flex-1 flex flex-col justify-between relative">
                        {/* Best Value Badge */}
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 z-20">
                          <Star className="h-3 w-3 fill-white text-white animate-pulse" />{" "}
                          {CRACKSPARK_PLANS.yearly.badge}
                        </div>

                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-2">
                            Recommended for Serious Aspirants
                          </span>

                          <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                            {CRACKSPARK_PLANS.yearly.name}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                            {CRACKSPARK_PLANS.yearly.description}
                          </p>

                          <div className="my-6 flex items-baseline">
                            <span className="text-5xl font-extrabold text-slate-900 dark:text-white font-display">
                              ₹{CRACKSPARK_PLANS.yearly.amount}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold ml-1.5">
                              {CRACKSPARK_PLANS.yearly.period}
                            </span>
                            <span className="ml-3 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                              Save ₹789 / Year
                            </span>
                          </div>

                          <div className="h-px bg-slate-300/60 dark:bg-white/10 my-5" />

                          <ul className="space-y-3 mb-6">
                            {CRACKSPARK_PLANS.yearly.features.map((feat, i) => (
                              <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm">
                                <div className="h-4 w-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                                  <Check className="h-2.5 w-2.5 text-amber-600 dark:text-amber-500" />
                                </div>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {feat}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedPlan("yearly");
                            setPaymentStep("pay");
                          }}
                          className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer text-xs uppercase tracking-wider shadow-md mt-4"
                        >
                          Select Yearly Plan (₹399)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* STEP 2 & 3: COMPLETE YOUR REGISTRATION PAYMENT SECTION */
                <div className="max-w-xl mx-auto w-full space-y-6">
                  {/* Navigation Back Button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPaymentStep("select")}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition py-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Subscription Plans
                    </button>
                    <span className="text-[11px] text-muted-foreground">
                      User: <strong className="text-foreground">{user.email}</strong>
                    </span>
                  </div>

                  {/* Complete Your Registration Card */}
                  <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden">
                    {/* Header Banner */}
                    <div className="text-center pb-5 border-b border-border/80">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold mb-2">
                        <Sparkles className="h-3.5 w-3.5" /> Complete Your Registration
                      </div>
                      <h2 className="text-2xl font-bold font-display text-foreground">
                        Payment &amp; Verification
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scan the dynamic UPI QR code to transfer to CrackSpark's official account.
                      </p>
                    </div>

                    {/* Selected Plan Details Strip & Switcher */}
                    <div className="my-5 p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-foreground">
                            {currentPlan.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            {currentPlan.period}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {currentPlan.fullName} • Zero additional gateway charges
                        </span>
                      </div>

                      <div className="text-right flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto">
                        <span className="text-[11px] text-muted-foreground sm:block">
                          Total Payable:
                        </span>
                        <span className="font-display font-extrabold text-2xl text-primary">
                          ₹{currentPlan.amount}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Plan Switcher (Quick Toggle) */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Switch Plan:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan("monthly")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          selectedPlan === "monthly"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Monthly (₹99)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan("yearly")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          selectedPlan === "yearly"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Yearly (₹399) ★
                      </button>
                    </div>

                    {/* DYNAMIC UPI PAYMENT QR CODE SECTION */}
                    {/* Generates from upi://pay?pa={UPI_ID}&pn=CrackSpark&am={AMOUNT}&cu=INR */}
                    <DynamicUpiQrCode planType={selectedPlan} />

                    {/* "I Have Completed Payment" Button */}
                    {paymentStep === "pay" && (
                      <div className="mt-6 pt-5 border-t border-border space-y-3">
                        <button
                          type="button"
                          onClick={scrollToDetails}
                          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition shadow-lg shadow-primary/20 cursor-pointer text-xs uppercase tracking-wider"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>I Have Completed Payment</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                          Click above after completing the transaction in your UPI app to enter your
                          12-digit UTR reference.
                        </p>
                      </div>
                    )}

                    {/* UTR SUBMISSION FORM (Revealed when clicked "I Have Completed Payment") */}
                    {paymentStep === "details" && (
                      <div
                        ref={detailsFormRef}
                        className="mt-6 pt-6 border-t border-border animate-fade-in"
                      >
                        <div className="mb-4 text-left">
                          <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Submit Transaction Reference (UTR)
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Enter the reference number from your UPI receipt to initiate admin
                            verification.
                          </p>
                        </div>

                        {/* Security notice about manual verification */}
                        <div className="mb-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-left flex items-start gap-2.5">
                          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                            <strong>Administrative Verification:</strong> Payments are verified by
                            the CrackSpark admin team. Premium access will only activate once the
                            transaction is verified and approved.
                          </div>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                              Payment Method Used
                            </label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.icon} {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                              UPI Transaction ID / 12-Digit UTR{" "}
                              <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              minLength={6}
                              maxLength={64}
                              placeholder="e.g. 423589123456 or bank transaction ref"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-mono tracking-wide"
                            />
                            <span className="text-[10px] text-muted-foreground block mt-1">
                              Check your UPI app receipt for "UPI Ref No" or "UTR".
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                              Upload Payment Screenshot (Optional but speeds up approval)
                            </label>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/png, image/jpeg, image/jpg"
                              className="hidden"
                            />

                            {screenshotUrl ? (
                              <div className="relative rounded-xl border border-border bg-muted/30 p-2.5 overflow-hidden flex items-center justify-between gap-3">
                                <img
                                  src={screenshotUrl}
                                  className="h-12 w-12 object-cover rounded-lg border border-border"
                                  alt="Screenshot Preview"
                                />
                                <div className="flex-1 min-w-0 text-left">
                                  <span className="block text-xs font-semibold text-foreground truncate">
                                    {file?.name || "Uploaded Screenshot"}
                                  </span>
                                  <span className="block text-[10px] text-muted-foreground">
                                    {file
                                      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                      : "Ready"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleFileClick}
                                  className="px-3 py-1.5 rounded-lg border border-border bg-card font-bold text-[11px] hover:bg-muted cursor-pointer transition"
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={handleFileClick}
                                className="w-full h-20 rounded-xl border border-dashed border-border hover:border-primary bg-muted/20 hover:bg-muted/40 transition flex flex-col items-center justify-center gap-1 cursor-pointer text-muted-foreground"
                              >
                                <Upload className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-foreground">
                                  Select payment screenshot
                                </span>
                                <span className="text-[10px]">PNG, JPG, JPEG (Max 5MB)</span>
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                              Optional Remarks
                            </label>
                            <textarea
                              placeholder="Any additional info for administrator..."
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              rows={2}
                              className="w-full rounded-xl border border-input bg-card p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition resize-none"
                            />
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                            <button
                              type="submit"
                              disabled={uploading}
                              className="w-full sm:flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              {uploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Submitting for Verification...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4" />
                                  <span>Submit for Verification</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentStep("pay")}
                              disabled={uploading}
                              className="w-full sm:w-auto px-4 h-11 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs font-semibold hover:bg-muted cursor-pointer transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Current Lifecycle Status Tracker */}
                  <div className="pt-2">
                    <PaymentStatusTracker
                      status={currentStatus}
                      subscriptionDetails={subscriptionDetails}
                      userId={user.id}
                      userEmail={user.email}
                      selectedPlan={selectedPlan}
                      onRefresh={handleManualRefresh}
                      refreshing={refreshingStatus}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

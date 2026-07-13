import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
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
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription Plans — CrackSpark" },
      { name: "description", content: "Upgrade to CrackSpark Premium to unlock unlimited study materials, mocks, previous papers, and current affairs updates." },
    ],
  }),
  component: SubscriptionPage,
});

const PAYMENT_METHODS = [
  { id: "GPay", name: "Google Pay (GPay)", icon: "📱" },
  { id: "PhonePe", name: "PhonePe", icon: "📱" },
  { id: "Paytm", name: "Paytm", icon: "📱" },
  { id: "UPI", name: "UPI ID Payment", icon: "💰" }
];

const UPI_ID = "crackspark@upi";

function SubscriptionPage() {
  const { user, loading, isSubscribed, subscriptionDetails, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [paymentStep, setPaymentStep] = useState<"select" | "pay" | "details">("select");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isReSubmitting, setIsReSubmitting] = useState(false);
  
  // Form fields
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("GPay");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartResubmit = () => {
    setIsReSubmitting(true);
    setPaymentStep("select");
    setFile(null);
    setScreenshotUrl("");
    setTransactionId("");
    setNote("");
  };

  // Auth Guard
  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/user-login",
        search: {
          redirect: location.pathname,
          message: "Please login to subscribe.",
        },
      });
    }
  }, [user, loading, navigate, location]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleCancelRequest = () => {
    setPaymentStep("select");
    setFile(null);
    setScreenshotUrl("");
    setTransactionId("");
    setNote("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Please upload the payment screenshot.");
      return;
    }
    if (!transactionId.trim()) {
      toast.error("Please enter the transaction ID.");
      return;
    }

    setUploading(true);
    toast.info("Uploading screenshot and saving request...");

    try {
      // 1. Upload screenshot
      const fileExt = file.name.split('.').pop();
      const fileName = `screenshot-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(filePath);

      const amount = selectedPlan === "yearly" ? 399 : 99;

      // 3. Create payment request
      const { error: requestError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          email: user.email,
          plan_type: selectedPlan,
          amount,
          transaction_id: transactionId.trim(),
          payment_method: paymentMethod,
          screenshot_url: publicUrl,
          payment_status: "pending",
          admin_remark: note.trim() || null
        });

      if (requestError) {
        if (requestError.code === "23505") {
          throw new Error("This Transaction ID has already been submitted.");
        }
        throw requestError;
      }

      // 4. Update user_subscriptions locally/status
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          email: user.email,
          name: user.name,
          is_subscribed: false,
          payment_status: "pending",
          plan_type: selectedPlan,
          amount,
          transaction_id: transactionId.trim(),
          payment_method: paymentMethod,
          admin_remark: null,
          updated_at: new Date().toISOString()
        });

      if (subError) throw subError;

      // 5. Create notification for admin
      await supabase.from("user_notifications").insert({
        user_id: null,
        title: "New Premium Subscription Request",
        message: `New Premium Subscription Request received from ${user.name || user.email}.`,
        type: "premium_request",
        link_to: "/admin?section=payments"
      });

      toast.success("Your payment verification request has been submitted successfully. Please wait for admin approval.");
      await refreshSubscription();
      setPaymentStep("select");
      setIsReSubmitting(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit request: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const getPlanPrice = () => {
    return selectedPlan === "yearly" ? 399 : 99;
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-display text-foreground">Loading...</h2>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!user) return null;

  return (
    <SiteLayout>
      <div className="bg-gradient-to-b from-background via-muted/20 to-background min-h-screen relative overflow-hidden py-14">
        {/* CSS Keyframes and styling for silver crystal glassmorphism pricing cards */}
        <style>{`
          @keyframes spin-glow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin-glow {
            animation: spin-glow 14s linear infinite;
          }
          
          /* Silver Crystal Card Container styling */
          .platinum-card-container {
            position: relative;
            border-radius: 30px;
            padding: 1.5px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(180, 185, 200, 0.25) 40%, rgba(150, 155, 170, 0.2) 60%, rgba(255, 255, 255, 0.3) 100%);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 
              0 10px 30px rgba(80, 90, 110, 0.1),
              0 1px 3px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            transform-style: preserve-3d;
            perspective: 1000px;
            will-change: transform, box-shadow;
          }
          .dark .platinum-card-container {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 40%, rgba(255, 255, 255, 0.03) 60%, rgba(255, 255, 255, 0.1) 100%);
            box-shadow: 
              0 10px 30px rgba(0, 0, 0, 0.4),
              0 1px 3px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          /* Hover glowing border */
          .platinum-card-container::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 30px;
            padding: 1.5px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(190, 195, 210, 0.8) 40%, rgba(170, 175, 190, 0.75) 60%, rgba(255, 255, 255, 0.5) 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s ease;
            z-index: 2;
          }
          .dark .platinum-card-container::before {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.18) 40%, rgba(255, 255, 255, 0.12) 60%, rgba(255, 255, 255, 0.28) 100%);
          }

          /* Interactive 3D tilt hover and float-bob keyframe trigger */
          .platinum-card-container:hover {
            transform: translateY(-14px) scale(1.02) rotateX(4deg) rotateY(-2deg);
            box-shadow: 
              0 30px 60px rgba(100, 110, 130, 0.18),
              0 0 25px rgba(255, 255, 255, 0.6);
            animation: float-bob-plat 4s ease-in-out infinite alternate;
            animation-delay: 0.5s;
          }
          .dark .platinum-card-container:hover {
            box-shadow: 
              0 30px 60px rgba(0, 0, 0, 0.5),
              0 0 30px rgba(255, 255, 255, 0.1);
          }

          .platinum-card-container:hover::before {
            opacity: 1;
          }

          @keyframes float-bob-plat {
            0% { transform: translateY(-14px) scale(1.02) rotateX(4deg) rotateY(-2deg); }
            50% { transform: translateY(-18px) scale(1.025) rotateX(5deg) rotateY(-2.5deg); }
            100% { transform: translateY(-14px) scale(1.02) rotateX(4deg) rotateY(-2deg); }
          }

          /* Inner silver glassmorphism card */
          .platinum-card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 28.5px;
            background: linear-gradient(135deg, rgba(228, 233, 242, 0.65) 0%, rgba(205, 212, 222, 0.45) 100%);
            backdrop-filter: blur(35px) saturate(180%);
            -webkit-backdrop-filter: blur(35px) saturate(180%);
            padding: 2.25rem 2rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            z-index: 10;
            transition: background-color 0.5s ease, backdrop-filter 0.5s ease;
          }
          .dark .platinum-card-inner {
            background: linear-gradient(135deg, rgba(50, 55, 65, 0.7) 0%, rgba(30, 32, 38, 0.55) 100%);
          }

          .platinum-card-container:hover .platinum-card-inner {
            background: linear-gradient(135deg, rgba(235, 240, 248, 0.75) 0%, rgba(212, 218, 228, 0.55) 100%);
          }
          .dark .platinum-card-container:hover .platinum-card-inner {
            background: linear-gradient(135deg, rgba(60, 66, 78, 0.65) 0%, rgba(35, 38, 46, 0.5) 100%);
          }

          /* Sweeping shine reflections */
          .platinum-shine-auto {
            position: absolute;
            top: 0;
            left: -150%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.05) 20%,
              rgba(255, 255, 255, 0.25) 50%,
              rgba(255, 255, 255, 0.05) 80%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            pointer-events: none;
            z-index: 5;
            animation: shine-sweep-plat 9s ease-in-out infinite;
          }

          .platinum-shine-hover {
            position: absolute;
            top: 0;
            left: -150%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.08) 25%,
              rgba(255, 255, 255, 0.4) 50%,
              rgba(255, 255, 255, 0.08) 75%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            pointer-events: none;
            z-index: 6;
            transition: left 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .platinum-card-container:hover .platinum-shine-hover {
            left: 150%;
          }

          @keyframes shine-sweep-plat {
            0% { left: -150%; }
            15% { left: 150%; }
            100% { left: 150%; }
          }
          @keyframes shinesweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/10 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/10 h-[500px] w-[500px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-500 backdrop-blur-md tracking-wider uppercase mb-5">
              <Sparkles className="h-3.5 w-3.5 text-gold-shine" /> Premium Subscription
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Unleash Your Exam Prep Power
            </h1>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              Supercharge your preparation with CrackSpark Premium. Get full, unrestricted access to mock tests, PDFs, current affairs, and everything you need to crack your exam.
            </p>
          </div>

          {/* Real-time Status Card for Pending / Rejected */}
          {subscriptionDetails && subscriptionDetails.payment_status !== "none" && subscriptionDetails.payment_status !== "approved" && !(subscriptionDetails.payment_status === "rejected" && isReSubmitting) && (
            <div className="max-w-3xl mx-auto mb-10 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-amber-500 animate-pulse" />
              
              {subscriptionDetails.payment_status === "pending" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <QrCode className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground">Payment Verification Pending</h3>
                      <p className="text-xs text-muted-foreground">We are verifying your transaction ID: <span className="font-mono font-semibold">{subscriptionDetails.transaction_id}</span></p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-500/5 rounded-2xl border border-amber-500/10 p-4 text-xs space-y-2 text-amber-700 dark:text-amber-500 font-semibold">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800 dark:text-amber-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0 animate-pulse text-amber-500" />
                      Your payment verification is under review.
                    </p>
                    <p className="text-muted-foreground text-[10px]">Note: The verification process normally takes 1-2 hours. You cannot access premium content during this time.</p>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground">Amount: ₹{subscriptionDetails.amount} ({subscriptionDetails.plan_type})</span>
                    <button 
                      onClick={refreshSubscription}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border font-bold hover:bg-muted/50 cursor-pointer transition"
                    >
                      <RefreshCw className="h-3 w-3 animate-spin-slow" /> Refresh Status
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground flex items-center gap-1.5">
                        ❌ Payment Verification Rejected
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Your request for Premium access has been rejected or cancelled by the administrator.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-destructive/5 rounded-2xl border border-destructive/10 p-5 text-xs text-foreground/90 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Transaction ID</span>
                        <span className="font-mono font-bold text-foreground text-sm">{subscriptionDetails.transaction_id || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Rejected Date</span>
                        <span className="font-semibold text-foreground">
                          {subscriptionDetails.updated_at ? new Date(subscriptionDetails.updated_at).toLocaleString() : "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-px bg-destructive/10" />

                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-1">Rejection Reason / Admin Remark</span>
                      <p className="italic font-medium text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/10 leading-relaxed">
                        "{subscriptionDetails.admin_remark || "Invalid payment details / screenshot match."}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border/80">
                    <span className="text-xs text-muted-foreground text-center sm:text-left">
                      Please double check your payment details or try again by submitting a new request.
                    </span>
                    <button 
                      onClick={handleStartResubmit}
                      className="w-full sm:w-auto px-5 py-2.5 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs rounded-xl transition shadow-md shadow-destructive/10 cursor-pointer text-center"
                    >
                      Submit New Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE PREMIUM CARD */}
          {isSubscribed && subscriptionDetails && (
            <div className="max-w-3xl mx-auto mb-10 rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-primary" />
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Star className="h-7 w-7 fill-current animate-pulse" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">Premium Membership Active.</h3>
              <p className="text-xs text-muted-foreground mt-1">Enjoy unrestricted access to all prep materials, tests, and PDFs.</p>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-6 p-4 bg-muted/40 rounded-2xl border border-border text-left text-xs">
                <div>
                  <span className="text-muted-foreground block">Active Plan</span>
                  <span className="font-bold text-foreground capitalize">{subscriptionDetails.plan_type} Plan</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Expiry Date</span>
                  <span className="font-bold text-foreground">{subscriptionDetails.expiry_date ? new Date(subscriptionDetails.expiry_date).toLocaleDateString() : "-"}</span>
                </div>
              </div>

              <button 
                onClick={() => setPaymentStep("select")}
                className="px-5 py-2.5 rounded-xl border border-primary/20 hover:border-primary text-primary font-bold text-xs hover:bg-primary/5 transition cursor-pointer"
              >
                Renew / Extend Subscription
              </button>
            </div>
          )}

          {/* MAIN FORM FLOW */}
          {(!subscriptionDetails || subscriptionDetails.payment_status === "none" || isReSubmitting || paymentStep !== "select") && (
            <>
              {paymentStep === "select" ? (
                /* PRICING CARDS - 2 PLANS ONLY (Monthly & Yearly), Glassmorphism, Dark Glass, Blue Glow */
                <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto relative z-10">
                  
                  {/* PREMIUM MONTHLY CARD */}
                  <div className="platinum-card-container group h-full flex flex-col">
                    
                    {/* Inner Card (Platinum Glass) */}
                    <div className="platinum-card-inner flex-1 flex flex-col justify-between">
                      {/* Ambient Glows */}
                      <div className="absolute top-[-30%] left-[-30%] w-[70%] h-[70%] rounded-full bg-white/40 blur-[80px] pointer-events-none transition-all duration-500 group-hover:bg-white/60" />
                      <div className="absolute bottom-[-30%] right-[-30%] w-[70%] h-[70%] rounded-full bg-slate-200/30 blur-[80px] pointer-events-none transition-all duration-500 group-hover:bg-slate-100/40" />
                      
                      {/* Glass Shine Reflections */}
                      <div className="platinum-shine-auto" />
                      <div className="platinum-shine-hover" />
                      
                      {/* Frosted noise overlay */}
                      <div 
                        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay z-1" 
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
                        }} 
                      />

                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Premium Monthly</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium">Short-term prep access</p>
                        
                        <div className="my-6 flex items-baseline">
                          <span className="text-5xl font-extrabold text-slate-900 dark:text-white font-display">₹99</span>
                          <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold ml-1.5">/ Month</span>
                        </div>
                        
                        <div className="h-px bg-slate-300/60 dark:bg-white/10 my-6" />
                        
                        <ul className="space-y-4 mb-8">
                          {[
                            "Unlimited Mock Tests",
                            "All Premium Courses",
                            "AI Performance Analysis",
                            "Daily Current Affairs",
                            "Previous Year Questions",
                            "Unlimited Practice Tests"
                          ].map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm">
                              <div className="h-5 w-5 rounded-full bg-slate-300/40 dark:bg-white/10 border border-slate-400/30 dark:border-white/20 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.03)]">
                                <Check className="h-3 w-3 text-slate-800 dark:text-slate-200" />
                              </div>
                              <span className="font-sans font-medium text-slate-800 dark:text-slate-200">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="relative z-10 mt-auto pt-4">
                        <button
                          onClick={() => {
                            setSelectedPlan("monthly");
                            setPaymentStep("pay");
                          }}
                          className="w-full py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider relative overflow-hidden group/btn"
                        >
                          Subscribe Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM YEARLY CARD */}
                  <div className="platinum-card-container group h-full flex flex-col">
                    
                    {/* Inner Card (Platinum Glass) */}
                    <div className="platinum-card-inner flex-1 flex flex-col justify-between">
                      {/* Ambient Glows */}
                      <div className="absolute top-[-30%] left-[-30%] w-[70%] h-[70%] rounded-full bg-white/40 blur-[80px] pointer-events-none transition-all duration-500 group-hover:bg-white/60" />
                      <div className="absolute bottom-[-30%] right-[-30%] w-[70%] h-[70%] rounded-full bg-slate-200/30 blur-[80px] pointer-events-none transition-all duration-500 group-hover:bg-slate-100/40" />
                      
                      {/* Glass Shine Reflections */}
                      <div className="platinum-shine-auto" />
                      <div className="platinum-shine-hover" />
                      
                      {/* Frosted noise overlay */}
                      <div 
                        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay z-1" 
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
                        }} 
                      />

                      {/* Best Value Badge */}
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-md border border-amber-400/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-1.5 z-20">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500 animate-pulse" /> Best Value
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Premium Yearly</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium">Full 12-month access</p>
                        
                        <div className="my-6 flex items-baseline">
                          <span className="text-5xl font-extrabold text-slate-900 dark:text-white font-display">₹399</span>
                          <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold ml-1.5">/ Year</span>
                        </div>
                        
                        <div className="h-px bg-slate-300/60 dark:bg-white/10 my-6" />
                        
                        <ul className="space-y-4 mb-8">
                          {[
                            "Everything in Monthly",
                            "Exclusive Test Series",
                            "Premium Study Materials",
                            "Early Access to New Features",
                            "Priority Support"
                          ].map((feat, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm">
                              <div className="h-5 w-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
                                <Check className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                              </div>
                              <span className="font-sans font-medium text-slate-800 dark:text-slate-200">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="relative z-10 mt-auto pt-4">
                        <button
                          onClick={() => {
                            setSelectedPlan("yearly");
                            setPaymentStep("pay");
                          }}
                          className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider shadow-md"
                        >
                          Subscribe Now
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* CHECKOUT PANELS: Scan & Pay / Submit details */
                <div className="max-w-md mx-auto w-full rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
                  
                  {/* Step 1: Scan & Pay */}
                  {paymentStep === "pay" && (
                    <div className="space-y-5">
                      <button 
                        onClick={() => setPaymentStep("select")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 cursor-pointer transition"
                      >
                        <ArrowLeft className="h-3 w-3" /> Back to Plans
                      </button>
                      
                      {/* Large QR Code Image Uploaded by User (Centered) */}
                      <div className="flex justify-center my-3">
                        <div className="bg-white p-4 rounded-[28px] inline-block shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/80 transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                          <img 
                            src="/gpay_qr.jpeg" 
                            alt="Scan & Pay QR Code" 
                            className="w-[180px] h-[180px] object-contain rounded-2xl mx-auto" 
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <h3 className="font-display font-bold text-lg text-foreground">Scan &amp; Pay</h3>
                        <p className="text-xs text-muted-foreground mt-1 px-4 leading-relaxed">
                          Scan this QR code using any UPI app to complete your payment.
                        </p>
                        <p className="text-primary font-bold text-xs mt-2 bg-primary/5 py-1 px-3 rounded-lg inline-block border border-primary/10">
                          Amount to Pay: ₹{getPlanPrice()}
                        </p>
                      </div>

                      {/* Pay Now Premium Button (Google Pay Integration) */}
                      <button
                        onClick={() => {
                          const amount = getPlanPrice();
                          const upiLink = `upi://pay?pa=${UPI_ID}&pn=CrackSpark&am=${amount}&cu=INR&tn=CrackSpark%20Premium%20Subscription`;
                          window.location.href = upiLink;
                          setTimeout(() => {
                            toast.info("If GPay did not open automatically, please scan the QR code above or use the UPI ID.");
                          }, 1500);
                        }}
                        className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider relative overflow-hidden group shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_22px_rgba(59,130,246,0.45)]"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shinesweep_1s_ease-in-out_infinite]" />
                        Pay Now
                      </button>

                      <div className="space-y-3.5 bg-muted/40 p-3 rounded-2xl border border-border">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">UPI ID</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground">{UPI_ID}</span>
                            <button 
                              onClick={handleCopyUPI} 
                              className="p-1 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition border border-border"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="h-px bg-border/80" />
                        
                        <div className="text-[10px] text-muted-foreground space-y-1.5 leading-relaxed">
                          <p className="font-semibold text-foreground">Steps to Subscribe:</p>
                          <p>1. Open your payment app (Google Pay / PhonePe / Paytm).</p>
                          <p>2. Scan the QR code or copy the UPI ID above and complete the payment of <strong>₹{getPlanPrice()}</strong>.</p>
                          <p>3. Save the payment receipt/screenshot and copy the Transaction ID.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setPaymentStep("details")}
                        className="w-full inline-flex h-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition shadow-lg shadow-primary/25 cursor-pointer text-xs"
                      >
                        I have completed the payment
                      </button>
                    </div>
                  )}

                  {/* Step 2: Upload screenshots & UTR */}
                  {paymentStep === "details" && (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <button 
                        type="button"
                        onClick={() => setPaymentStep("pay")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1 cursor-pointer transition"
                      >
                        <ArrowLeft className="h-3 w-3" /> Back to QR Code
                      </button>
                      
                      <div>
                        <h3 className="font-display font-bold text-base text-foreground">Submit Payment Details</h3>
                        <p className="text-xs text-muted-foreground">Upload your screenshot to verify subscription.</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                            Payment Method
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-card px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
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
                            Transaction ID / UTR
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Enter 12-digit transaction ID"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                            Upload Screenshot
                          </label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden"
                          />
                          
                          {screenshotUrl ? (
                            <div className="relative rounded-xl border border-border bg-muted/30 p-2 overflow-hidden flex items-center justify-between gap-3">
                              <img
                                src={screenshotUrl}
                                className="h-14 w-14 object-cover rounded-lg border border-border"
                                alt="Screenshot Preview"
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <span className="block text-xs font-semibold text-foreground truncate">{file?.name}</span>
                                <span className="block text-[10px] text-muted-foreground">{(file!.size / (1024 * 1024)).toFixed(2)} MB</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleFileClick}
                                className="px-2.5 py-1.5 rounded-lg border border-border bg-card font-semibold text-[10px] hover:bg-muted cursor-pointer transition"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleFileClick}
                              className="w-full h-20 rounded-xl border border-dashed border-border hover:border-primary bg-muted/20 hover:bg-muted/40 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer text-muted-foreground"
                            >
                              <Upload className="h-5 w-5" />
                              <span className="text-xs font-bold">Select payment screenshot</span>
                              <span className="text-[9px]">PNG, JPG, JPEG (Max 5MB)</span>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                            Optional Note / Remarks
                          </label>
                          <textarea
                            placeholder="Add any note for admin if needed..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-input bg-card p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition resize-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={uploading}
                        className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                          </>
                        ) : (
                          "Submit Verification Request"
                        )}
                      </button>
                    </form>
                  )}

                </div>
              )}
            </>
          )}

        </div>
      </div>
    </SiteLayout>
  );
}

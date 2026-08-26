import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Download,
  ExternalLink,
  QrCode as QrIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { CRACKSPARK_PLANS, CRACKSPARK_UPI_ID, generateUpiUri, PlanType } from "@/lib/payment";

interface DynamicUpiQrCodeProps {
  planType: PlanType;
  className?: string;
  onPaymentCompletedClick?: () => void;
}

export function DynamicUpiQrCode({
  planType,
  className = "",
  onPaymentCompletedClick,
}: DynamicUpiQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);

  const { uri, amount, plan, upiId, payeeName } = generateUpiUri(planType);

  // Generate dynamic high-resolution QR code whenever plan or UPI ID changes
  useEffect(() => {
    let isMounted = true;
    setGenerating(true);

    QRCode.toDataURL(uri, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H", // High error correction allows clear phone-to-phone scanning
      color: {
        dark: "#0a0f1d",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setGenerating(false);
        }
      })
      .catch((err) => {
        console.error("Failed to generate dynamic UPI QR:", err);
        if (isMounted) setGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [uri]);

  const handleCopyUpiId = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(upiId);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = upiId;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("CrackSpark UPI ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Failed to copy UPI ID. Please copy manually: " + upiId);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `CrackSpark-UPI-${planType}-₹${amount}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR Code downloaded successfully!");
  };

  const handleOpenUpiApp = () => {
    const isMobile =
      typeof navigator !== "undefined" &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent || "");

    const startTime = Date.now();
    window.location.href = uri;

    if (!isMobile) {
      toast.info("For the best experience, scan this dynamic QR code using your mobile UPI app.");
    } else {
      setTimeout(() => {
        if (Date.now() - startTime < 1800) {
          toast.info("Opening UPI payment options on your device...");
        }
      }, 1200);
    }
  };

  return (
    <div
      className={`w-full flex flex-col items-center text-center ${className}`}
      data-testid="dynamic-upi-qr-section"
    >
      {/* Title & Instructions Subtitle */}
      <div className="mb-4">
        <h3 className="font-display font-bold text-lg sm:text-xl text-foreground flex items-center justify-center gap-2">
          <QrIcon className="h-5 w-5 text-primary animate-pulse" />
          Scan &amp; Pay using any UPI app
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
          Open Google Pay, PhonePe, Paytm, BHIM, or any banking app on your phone and scan the code
          below.
        </p>
      </div>

      {/* Dynamic QR Container (Crisp White High-Res Card) */}
      <div className="relative my-2 group">
        {/* Subtle glowing ambient backdrop */}
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-primary/20 rounded-[32px] blur-xl opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />

        <div className="relative bg-white p-4 sm:p-5 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 group-hover:scale-[1.01] overflow-hidden flex flex-col items-center">
          {/* Top Merchant Brand Tag */}
          <div className="w-full flex items-center justify-between gap-2 px-2 pb-2.5 mb-1 border-b border-slate-100 text-[11px] font-semibold text-slate-700">
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              <Sparkles className="h-3.5 w-3.5" /> CrackSpark
            </span>
            <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Merchant
            </span>
          </div>

          {/* QR Code Image */}
          <div className="relative w-[230px] h-[230px] sm:w-[260px] sm:h-[260px] flex items-center justify-center bg-white rounded-2xl p-1">
            {generating || !qrDataUrl ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-medium">Generating UPI QR...</span>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={qrDataUrl}
                  alt={`CrackSpark ${plan.name} UPI Payment QR Code for ₹${amount}`}
                  className="w-full h-full object-contain rounded-xl select-none"
                  width={260}
                  height={260}
                  loading="eager"
                />
                {/* Center Brand Badge on QR */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md border border-slate-200 pointer-events-none flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-[10px] font-extrabold shadow-inner">
                    ⚡
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Amount Strip inside the QR card */}
          <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-800 text-xs px-2">
            <span className="font-medium text-slate-500 text-[11px]">Payable Amount:</span>
            <span className="font-display font-extrabold text-sm sm:text-base text-slate-950">
              ₹{amount}{" "}
              <span className="text-[10px] font-medium text-slate-500 uppercase">({planType})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Supported UPI Apps Row */}
      <div className="mt-3 mb-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground/80">Supported Apps:</span>
        <span className="px-2 py-0.5 rounded-md bg-muted/60 font-medium border border-border/60">
          Google Pay
        </span>
        <span className="px-2 py-0.5 rounded-md bg-muted/60 font-medium border border-border/60">
          PhonePe
        </span>
        <span className="px-2 py-0.5 rounded-md bg-muted/60 font-medium border border-border/60">
          Paytm
        </span>
        <span className="px-2 py-0.5 rounded-md bg-muted/60 font-medium border border-border/60">
          BHIM
        </span>
        <span className="px-2 py-0.5 rounded-md bg-muted/60 font-medium border border-border/60">
          Cred
        </span>
        <span className="px-2 py-0.5 rounded-md bg-muted/60 font-medium border border-border/60">
          Any UPI App
        </span>
      </div>

      {/* CrackSpark UPI ID with One-Click Copy Button */}
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-3 shadow-sm mb-4 text-left">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold mb-1">
          <span>CrackSpark UPI ID</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Official &amp; Verified
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 bg-muted/40 rounded-xl px-3 py-2 border border-border/80">
          <code className="font-mono text-xs sm:text-sm font-bold text-foreground truncate select-all">
            {upiId}
          </code>
          <button
            type="button"
            onClick={handleCopyUpiId}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition shadow-sm cursor-pointer"
            title="Copy UPI ID to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Action Buttons: Pay via UPI App (on mobile) & Download QR */}
      <div className="w-full max-w-sm grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={handleOpenUpiApp}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Smartphone className="h-4 w-4" />
          <span>Pay via UPI App</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </button>

        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={!qrDataUrl}
          className="w-full py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
          <span>Save QR Image</span>
        </button>
      </div>

      {/* Payment Instructions */}
      <div className="w-full max-w-sm bg-muted/40 rounded-2xl border border-border p-4 text-left text-xs mb-4">
        <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Payment Instructions:
        </h4>
        <ol className="space-y-2 text-[11px] text-muted-foreground leading-relaxed list-decimal list-inside">
          <li>
            Open any UPI app (
            <strong className="text-foreground">GPay, PhonePe, Paytm, etc.</strong>) on your
            smartphone.
          </li>
          <li>
            Scan the dynamic QR code above or pay directly to UPI ID{" "}
            <strong className="text-foreground font-mono">{upiId}</strong>.
          </li>
          <li>
            Ensure the recipient is <strong className="text-foreground">{payeeName}</strong> and
            amount is exact: <strong className="text-foreground">₹{amount}</strong>.
          </li>
          <li>
            Complete the payment and note down the{" "}
            <strong className="text-foreground">12-digit UPI Reference Number / UTR</strong>.
          </li>
          <li>
            Click <strong className="text-foreground">"I Have Completed Payment"</strong> below to
            submit your UTR for verification.
          </li>
        </ol>
      </div>
    </div>
  );
}

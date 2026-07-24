import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, KeyRound, Check, Info } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/user-login")({
  head: () => ({ meta: [{ title: "User Login — CrackSpark" }] }),
  component: UserLoginPage,
});

function UserLoginPage() {
  const {
    user,
    loading,
    loginUser,
    registerUser,
    verifyEmailCode,
    sendPasswordResetCode,
    resetPassword,
    loginGoogle,
    loginGoogleWithToken,
  } = useAuth();
  const navigate = useNavigate();
  
  const [redirect, setRedirect] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setRedirect(params.get("redirect") || "");
      setMessage(params.get("message") || "");
    }
  }, []);

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "verify">("login");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [otpTimer, setOtpTimer] = useState(59);

  // Registration inputs
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  // Verification states
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCodeInput, setVerificationCodeInput] = useState("");

  // Redirect logged-in users automatically
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: redirect || "/" });
    }
  }, [user, loading, navigate, redirect]);

  // Set warning message from search params if user got redirected
  useEffect(() => {
    if (message) {
      setErr(message);
    }
  }, [message]);

  // Track password recovery redirect hash on load
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if URL contains recovery callback details
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setMode("forgot");
      setForgotStep(3);
      setInfo("Please set your new password below.");
    }
  }, []);

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "forgot" && forgotStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, forgotStep, otpTimer]);

  // Password strength checker helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "", color: "bg-muted" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, text: "Weak", color: "bg-destructive" };
    if (score <= 4) return { score, text: "Medium", color: "bg-gold" };
    return { score, text: "Strong", color: "bg-primary" };
  };

  const strengthReset = getPasswordStrength(newPassword);
  const strengthRegister = getPasswordStrength(registerPassword);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (mode === "login") {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email") || "").trim();
      const password = String(fd.get("password") || "");

      const r = await loginUser(email, password, rememberMe);
      if (!r.ok) {
        setErr(r.message);
        
        // Create failed login notification for admin
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "Failed Login Attempt",
          message: `Failed login attempt for email: ${email}. Reason: ${r.message}`,
          type: "failed_login",
          link_to: "/admin?section=logged_users"
        });
        
        return;
      }

      // Create new login notification for admin
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "User Logged In",
          message: `User logged in: ${loggedUser.user_metadata?.name || loggedUser.email} (${loggedUser.email})`,
          type: "new_login",
          link_to: "/admin?section=logged_users"
        });
      }

      navigate({ to: redirect || "/" });
    } else if (mode === "register") {
      if (registerPassword !== registerConfirmPassword) {
        return setErr("Passwords do not match.");
      }

      const r = await registerUser(registerName, registerEmail, registerPassword);
      if (!r.ok) return setErr(r.message);

      if (r.needsVerification) {
        setMode("login");
        setInfo(
          "Registration successful! Please check your email and click the confirmation link to verify your account.",
        );
        toast.info("Verification email sent! Please check your inbox.");
      } else {
        toast.success("Registration successful!");
        navigate({ to: redirect || "/" });
      }
    }
  }

  // Handle Google OAuth Redirect Securely via Supabase client
  const handleGoogleRedirect = async () => {
    try {
      await loginGoogle();
    } catch (e: any) {
      console.error("Google Auth Redirect Error:", e);
      toast.error(e.message || "Google Sign-In is currently unavailable. Please try again later.");
    }
  };

  // Separate flow for Forgot Password
  const handleForgotFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (forgotStep === 1) {
      if (!emailInput.includes("@")) {
        return setErr("Please enter a valid email address");
      }
      const r = await sendPasswordResetCode(emailInput);
      if (!r.ok) {
        return setErr(r.message);
      }
      setForgotStep(4);
      setInfo(
        `A password reset link has been successfully sent to ${emailInput}. Please check your email inbox to update your password.`,
      );
    } else if (forgotStep === 2) {
      // Manual verification code flow (if supported by custom settings)
      const { error } = await supabase.auth.verifyOtp({
        email: emailInput,
        token: otpInput,
        type: "recovery",
      });
      if (error) {
        return setErr(error.message);
      }
      setErr("");
      setInfo("");
      setForgotStep(3);
    } else if (forgotStep === 3) {
      if (newPassword !== confirmPassword) {
        return setErr("Passwords do not match");
      }
      const r = await resetPassword(emailInput, newPassword);
      if (!r.ok) {
        return setErr(r.message);
      }
      toast.success("Password reset successfully!");
      setForgotStep(4);
      setInfo(
        "Your password has been successfully reset. You can now login with your new password.",
      );
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
        {/* Left Bento panel */}
        <div className="hidden lg:block rounded-3xl bg-mesh-emerald text-white p-10 min-h-[520px] relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium">
            <img src="/logo.png" className="h-4 w-4 rounded-full object-cover" alt="CS" />{" "}
            CrackSpark
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold leading-tight">
            Your prep, finally in one place.
          </h2>
          <p className="mt-4 text-white/75 max-w-sm text-sm">
            Bookmark exams, attempt mocks, track notifications and download topper notes — all in a
            focused workspace.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Personalised study plan",
              "Saved exams & alerts",
              "Mock test analytics",
              "Daily current affairs",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Forms panel */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Logo Integration */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary bg-card shadow-[0_0_15px_rgba(56,189,248,0.25)] flex items-center justify-center">
              <img
                src="/logo.png"
                className="h-full w-full object-cover rounded-full"
                alt="CrackSpark Logo"
              />
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2 text-center">
            User Account
          </div>

          {/* NORMAL LOGIN / REGISTER VIEW */}
          {mode !== "forgot" && mode !== "verify" && (
            <>
              <h1 className="font-display text-2xl font-bold text-center">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                {mode === "login"
                  ? "Sign in to continue your preparation."
                  : "Join thousands of aspirants on CrackSpark."}
              </p>

              {err && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium flex items-start gap-2 animate-fade-in">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              )}

              {info && (
                <div className="mt-4 p-3 rounded-xl bg-primary/8 border border-primary/20 text-xs text-primary font-medium flex items-start gap-2 animate-fade-in">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{info}</span>
                </div>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === "register" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Full name</label>
                      <input
                        required
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="Your name"
                        className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email address</label>
                      <input
                        required
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Password</label>
                      <input
                        required
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />

                      {/* Password strength indicator */}
                      {registerPassword && (
                        <div className="mt-2.5">
                          <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                            <span className="text-muted-foreground">Password strength:</span>
                            <span
                              className={
                                strengthRegister.text === "Strong"
                                  ? "text-primary"
                                  : strengthRegister.text === "Medium"
                                    ? "text-gold-foreground"
                                    : "text-destructive"
                              }
                            >
                              {strengthRegister.text}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
                            <div
                              className={`h-full rounded-full transition-all ${strengthRegister.color} ${strengthRegister.score >= 1 ? "w-1/3" : "w-0"}`}
                            />
                            <div
                              className={`h-full rounded-full transition-all ${strengthRegister.color} ${strengthRegister.score >= 3 ? "w-1/3" : "w-0"}`}
                            />
                            <div
                              className={`h-full rounded-full transition-all ${strengthRegister.color} ${strengthRegister.score >= 5 ? "w-1/3" : "w-0"}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                      <input
                        required
                        type="password"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </>
                )}

                {mode === "login" && (
                  <>
                    <Field
                      name="email"
                      label="Email address"
                      placeholder="you@example.com"
                      type="email"
                    />
                    <Field
                      name="password"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </>
                )}

                {/* Remember Me Option */}
                {mode === "login" && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4 accent-primary"
                      />
                      <span>Remember me</span>
                    </label>
                  </div>
                )}

                <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm">
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* Sign in with Google Button */}
                {mode === "login" && (
                  <>
                    <div className="relative my-4 flex py-1 items-center">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="flex-shrink mx-3 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        or
                      </span>
                      <div className="flex-grow border-t border-border"></div>
                    </div>

                    <div className="w-full flex justify-center mt-1">
                      <button
                        type="button"
                        onClick={handleGoogleRedirect}
                        className="w-full inline-flex h-11 items-center justify-center gap-3 rounded-xl border border-input bg-card text-foreground font-semibold hover:bg-accent transition shadow-sm cursor-pointer"
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g transform="matrix(1, 0, 0, 1, 0, 0)">
                            <path
                              d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.28c1.92,-1.78 3.02,-4.4 3.02,-7.4C21.64,12.2 21.54,11.6 21.35,11.1z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12,20.6c2.4,0 4.5,-0.8 6,-2.2l-3.28,-2.6c-0.9,0.6 -2.07,0.99 -3.12,0.99 -2.4,0 -4.43,-1.63 -5.16,-3.82H3.04v2.7C4.52,18.6 8.02,20.6 12,20.6z"
                              fill="#34A853"
                            />
                            <path
                              d="M6.84,12.98c-0.19,-0.57 -0.3,-1.17 -0.3,-1.8s0.11,-1.23 0.3,-1.8V6.68H3.04C2.38,8 2,9.45 2,11s0.38,3 1.04,4.32l3.8,-3.34z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12,5.2c1.3,0 2.47,0.45 3.39,1.33l2.54,-2.54C16.4,2.6 14.3,1.8 12,1.8 8.02,1.8 4.52,3.8 3.04,6.68l3.8,3.32C7.57,6.83 9.6,5.2 12,5.2z"
                              fill="#EA4335"
                            />
                          </g>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                    </div>
                  </>
                )}
              </form>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => {
                    setMode("forgot");
                    setForgotStep(1);
                    setErr("");
                    setInfo("");
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Forgot password?
                </button>
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setErr("");
                    setInfo("");
                  }}
                  className="font-semibold hover:underline text-foreground/80"
                >
                  {mode === "login" ? (
                    <>
                      New here? <span className="text-primary font-bold">Register</span>
                    </>
                  ) : (
                    <>
                      Already registered? <span className="text-primary font-bold">Login</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}



          {/* FORGOT PASSWORD STEP-BY-STEP PROCESS */}
          {mode === "forgot" && (
            <div>
              <h1 className="font-display text-2xl font-bold text-center">Password Reset</h1>
              <p className="mt-2 text-xs text-muted-foreground text-center animate-fade-in">
                {forgotStep === 1 &&
                  "Enter your registered email address to receive a recovery link."}
                {forgotStep === 3 && "Create and confirm your strong new account password."}
                {forgotStep === 4 && "Instructions or updates processed successfully."}
              </p>

              {info && (
                <p className="mt-4 p-3 bg-primary/8 text-primary border border-primary/20 rounded-xl text-xs font-semibold animate-fade-in">
                  {info}
                </p>
              )}
              {err && (
                <p className="mt-4 p-3 bg-destructive/8 text-destructive border border-destructive/20 rounded-xl text-xs font-semibold">
                  {err}
                </p>
              )}

              <form onSubmit={handleForgotFlow} className="mt-6 space-y-4">
                {/* STEP 1: Email Input */}
                {forgotStep === 1 && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        required
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: New Password Inputs */}
                {forgotStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          required
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>

                      {/* Password strength indicator */}
                      {newPassword && (
                        <div className="mt-2.5">
                          <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                            <span className="text-muted-foreground">Strength:</span>
                            <span
                              className={
                                strengthReset.text === "Strong"
                                  ? "text-primary"
                                  : strengthReset.text === "Medium"
                                    ? "text-gold-foreground"
                                    : "text-destructive"
                              }
                            >
                              {strengthReset.text}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
                            <div
                              className={`h-full rounded-full transition-all ${strengthReset.color} ${strengthReset.score >= 1 ? "w-1/3" : "w-0"}`}
                            />
                            <div
                              className={`h-full rounded-full transition-all ${strengthReset.color} ${strengthReset.score >= 3 ? "w-1/3" : "w-0"}`}
                            />
                            <div
                              className={`h-full rounded-full transition-all ${strengthReset.color} ${strengthReset.score >= 5 ? "w-1/3" : "w-0"}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          required
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Success View */}
                {forgotStep === 4 && (
                  <div className="text-center py-6 space-y-4 animate-fade-in">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="font-semibold text-lg text-foreground">
                      Reset Request Completed
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Please check your inbox to access the link and set your new password.
                    </p>
                  </div>
                )}

                {forgotStep < 4 ? (
                  <button
                    type="submit"
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm"
                  >
                    {forgotStep === 1 && "Send Reset Link"}
                    {forgotStep === 3 && "Reset My Password"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setForgotStep(1);
                      setErr("");
                      setInfo("");
                      setEmailInput("");
                      setOtpInput("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm"
                  >
                    Go to Login
                  </button>
                )}
              </form>

              {forgotStep < 4 && (
                <div className="mt-5 text-center">
                  <button
                    onClick={() => {
                      setMode("login");
                      setForgotStep(1);
                      setErr("");
                      setInfo("");
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    ← Back to Login
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border text-xs text-muted-foreground text-center">
            Are you an administrator?{" "}
            <Link to="/admin-login" className="text-primary font-semibold hover:underline">
              Admin login
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full h-11 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

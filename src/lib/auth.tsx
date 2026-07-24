import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { sendBrevoEmail } from "./email/brevo";

export type Role = "user" | "admin";
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  location?: string;
  phone?: string;
  avatar?: string;
  authProvider?: string;
};

export type SubscriptionDetails = {
  is_subscribed: boolean;
  payment_status: "none" | "pending" | "approved" | "rejected";
  expiry_date: string | null;
  start_date: string | null;
  plan_type: string | null;
  amount: number | null;
  payment_method: string | null;
  transaction_id: string | null;
  admin_remark: string | null;
  updated_at: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  bookmarks: string[];
  loginUser: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  registerUser: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true; needsVerification?: boolean } | { ok: false; message: string }>;
  verifyEmailCode: (
    email: string,
    code: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  sendPasswordResetCode: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  resetPassword: (
    email: string,
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  loginGoogle: () => Promise<void>;
  loginGoogleWithToken: (token: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  loginAdmin: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => Promise<void>;
  toggleBookmark: (key: string) => void;
  updateAdminProfile: (updates: Partial<AuthUser>) => void;
  updateAvatar: (url: string | null) => Promise<void>;
  isSubscribed: boolean;
  subscriptionDetails: SubscriptionDetails | null;
  refreshSubscription: () => Promise<void>;
  setSubscribed: (subscribed: boolean) => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

// Password requirements checker
export function validatePassword(pass: string): boolean {
  if (pass.length < 8) return false;
  if (!/[A-Z]/.test(pass)) return false;
  if (!/[a-z]/.test(pass)) return false;
  if (!/[0-9]/.test(pass)) return false;
  if (!/[^A-Za-z0-9]/.test(pass)) return false;
  return true;
}

// Map Supabase User type to CrackSpark AuthUser type
const mapSupabaseUser = (sbUser: User | null): AuthUser | null => {
  if (!sbUser) return null;
  const isSuperAdmin = sbUser.email === "kalaiarasane28@gmail.com";
  return {
    id: sbUser.id,
    name:
      sbUser.user_metadata?.name ||
      sbUser.user_metadata?.full_name ||
      sbUser.email?.split("@")[0] ||
      "Aspirant",
    email: sbUser.email || "",
    role: isSuperAdmin ? "admin" : "user",
    avatar: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || undefined,
    phone: sbUser.phone || undefined,
    authProvider: sbUser.app_metadata?.provider || undefined,
  };
};

const clearAuthStorage = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase") || key.includes("auth"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
  } catch (e) {
    console.warn("Error clearing auth storage:", e);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);

  // Listen to Supabase Auth State changes (session restored automatically)
  useEffect(() => {
    const verifyUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
          if (error || !verifiedUser) {
            console.warn("Session invalid or user deleted on backend.");
            clearAuthStorage();
            await supabase.auth.signOut();
            setUser(null);
          } else {
            setUser(mapSupabaseUser(session.user));
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error verifying user session:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
            const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
            if (error || !verifiedUser) {
              clearAuthStorage();
              await supabase.auth.signOut();
              setUser(null);
              setLoading(false);
              return;
            }
          }
          setUser(mapSupabaseUser(session.user));
        } else {
          if (event === "SIGNED_OUT") {
            clearAuthStorage();
          }
          setUser(null);
        }
      } catch (err) {
        console.error("Error handling auth state change:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load Bookmarks when user changes (sync with Supabase only)
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("bookmarks")
            .select("exam_key")
            .eq("user_id", user.id);

          if (!error && data) {
            setBookmarks(data.map((b: { exam_key: string }) => b.exam_key));
            return;
          }
        } catch (err) {
          console.warn("Failed to fetch bookmarks from Supabase:", err);
        }
      }
      setBookmarks([]);
    };

    fetchBookmarks();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) {
      setIsSubscribed(false);
      setSubscriptionDetails(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSubscriptionDetails(data as SubscriptionDetails);
        const isApproved = data.payment_status === "approved";
        const hasNotExpired = data.expiry_date ? new Date(data.expiry_date).getTime() > Date.now() : false;
        
        if (data.is_subscribed && isApproved && !hasNotExpired) {
          // Auto-expiration trigger
          await supabase
            .from("user_subscriptions")
            .update({
              is_subscribed: false,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);

          await supabase.from("user_notifications").insert({
            user_id: user.id,
            title: "Subscription Expired",
            message: "⚠️ Your CrackSpark Premium Subscription has expired. Please renew your plan to continue accessing premium resources.",
            type: "expiry_reminder",
            link_to: "/subscription"
          });

          await supabase.from("user_notifications").insert({
            user_id: null,
            title: "Premium Subscription Expired",
            message: `Premium subscription expired for user: ${user.name || user.email}`,
            type: "premium_expired",
            link_to: "/admin?section=overview"
          });

          setIsSubscribed(false);
          setSubscriptionDetails({
            ...data,
            is_subscribed: false
          } as any);
        } else {
          setIsSubscribed(data.is_subscribed && isApproved && hasNotExpired);
        }
      } else if (!error && !data) {
        const newSub = {
          user_id: user.id,
          email: user.email,
          name: user.name,
          is_subscribed: false,
          payment_status: "none" as const
        };
        await supabase.from("user_subscriptions").insert(newSub);
        setIsSubscribed(false);
        setSubscriptionDetails(newSub as any);
      }
    } catch (err) {
      console.warn("Failed to fetch subscription from Supabase:", err);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Set up realtime listener on user_subscriptions for this user
  useEffect(() => {
    if (!user) return;

    const subscriptionChannel = supabase
      .channel(`user_subscriptions_changes_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Realtime subscription update received:", payload);
          const updatedSub = payload.new as SubscriptionDetails;
          if (updatedSub) {
            setSubscriptionDetails(updatedSub);
            const isApproved = updatedSub.payment_status === "approved";
            const hasNotExpired = updatedSub.expiry_date ? new Date(updatedSub.expiry_date).getTime() > Date.now() : false;
            setIsSubscribed(updatedSub.is_subscribed && isApproved && hasNotExpired);

            if (updatedSub.payment_status === "approved") {
              toast.success("Congratulations! Your subscription has been activated successfully.");
            } else if (updatedSub.payment_status === "rejected") {
              toast.error("Your payment verification was rejected. Please check the admin remarks and upload a valid payment screenshot.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user]);

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  // Manage user online status, last active time, and realtime presence
  useEffect(() => {
    if (!user) return;

    const updateUserStatus = async (status: "Online" | "Offline") => {
      try {
        if (status === "Online") {
          await supabase.from("logged_in_users").upsert({
            user_id: user.id,
            full_name: user.name,
            email: user.email,
            profile_image: user.avatar || null,
            login_time: new Date().toISOString(),
            last_active_time: new Date().toISOString(),
            status: "Online",
          }, {
            onConflict: "user_id"
          });
        } else {
          await supabase.from("logged_in_users").update({
            status: "Offline",
            last_active_time: new Date().toISOString(),
          }).eq("user_id", user.id);
        }
      } catch (err) {
        console.warn("Failed to update user online status:", err);
      }
    };

    updateUserStatus("Online");

    // Supabase Realtime Presence setup
    const presenceChannel = supabase.channel("room:lobby", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presenceChannel.track({
          user_id: user.id,
          email: user.email,
          full_name: user.name,
          online_at: new Date().toISOString(),
        });
      }
    });

    // Periodic heartbeat to update last_active_time
    let lastUpdated = Date.now();
    const handleActivity = async () => {
      // Throttle updates to once every 15 seconds
      if (Date.now() - lastUpdated > 15000) {
        lastUpdated = Date.now();
        try {
          await supabase.from("logged_in_users").update({
            last_active_time: new Date().toISOString(),
            status: "Online"
          }).eq("user_id", user.id);
        } catch (err) {
          console.warn("Failed to update last active time:", err);
        }
      }
    };

    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Handle online/offline network status changes
    const handleOnline = () => updateUserStatus("Online");
    const handleOffline = () => updateUserStatus("Offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Handle beforeunload to mark status as Offline immediately
    const handleBeforeUnload = () => {
      let token = "";
      try {
        const key = Object.keys(localStorage).find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
        if (key) {
          const session = JSON.parse(localStorage.getItem(key) || "{}");
          token = session?.access_token || "";
        }
      } catch (e) {
        console.warn("Failed to retrieve auth token for unload status update", e);
      }

      if (token) {
        const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://wspaqtirqslarbzrnkhf.supabase.co";
        const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcGFxdGlycXNsYXJienJua2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzY0MjksImV4cCI6MjA5ODIxMjQyOX0.vZFMVWO2wmHGpGrTSnbwmUc7oSLvxm1Mgo1gvCPsSoA";
        
        const body = JSON.stringify({
          status: "Offline",
          last_active_time: new Date().toISOString()
        });

        fetch(`${supabaseUrl}/rest/v1/logged_in_users?user_id=eq.${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${token}`
          },
          body: body,
          keepalive: true
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      updateUserStatus("Offline");
      presenceChannel.unsubscribe();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  const value: AuthState = {
    user,
    loading,
    bookmarks,
    loginUser: async (email, password) => {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoading(false);
        const errLower = error.message.toLowerCase();
        if (errLower.includes("email not confirmed") || 
            errLower.includes("confirm your email") ||
            errLower.includes("email_not_confirmed") ||
            errLower.includes("email not verified")) {
          return { ok: false, message: "Please verify your email by clicking the confirmation link sent to your email address." };
        }
        return { ok: false, message: error.message };
      }
      if (data?.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setLoading(false);
        return { ok: false, message: "Please verify your email by clicking the confirmation link sent to your email address." };
      }

      // Asynchronously trigger Brevo Login Alert email
      sendBrevoEmail({
        toEmail: email,
        toName: data?.user?.user_metadata?.name || email.split("@")[0],
        type: "login_alert",
        data: {
          userName: data?.user?.user_metadata?.name || email.split("@")[0],
          userEmail: email,
          loginTime: new Date().toLocaleString("en-IN"),
        },
      }).catch((e) => console.error("Brevo login_alert send error:", e));

      return { ok: true };
    },
    registerUser: async (name, email, password) => {
      if (!validatePassword(password)) {
        return {
          ok: false,
          message:
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        };
      }

      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        setLoading(false);
        const errMsg = typeof error.message === "string" ? error.message : (typeof error === "string" ? error : JSON.stringify(error));
        return { ok: false, message: errMsg || "Registration failed. Please try again." };
      }

      // Asynchronously trigger Brevo Email Confirmation & Welcome emails
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://crackspark.in";
      sendBrevoEmail({
        toEmail: email,
        toName: name,
        type: "email_confirmation",
        data: {
          userName: name,
          userEmail: email,
          verificationUrl: `${currentOrigin}/user-login`,
        },
      }).catch((e) => console.error("Brevo email_confirmation send error:", e));

      sendBrevoEmail({
        toEmail: email,
        toName: name,
        type: "welcome",
        data: {
          userName: name,
          userEmail: email,
          dashboardUrl: `${currentOrigin}/`,
        },
      }).catch((e) => console.error("Brevo welcome send error:", e));

      // Create user notification for admins
      await supabase.from("user_notifications").insert({
        user_id: null,
        title: "New User Registered",
        message: `A new user has registered: ${name} (${email})`,
        type: "new_user",
        link_to: "/admin?section=overview"
      });

      const needsVerification = !data?.session;
      if (!needsVerification) {
        setUser(mapSupabaseUser(data?.user ?? null));
      }
      setLoading(false);
      return { ok: true, needsVerification };
    },
    verifyEmailCode: async (email, code) => {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) {
        setLoading(false);
        return { ok: false, message: error.message };
      }
      if (data?.user) {
        setUser(mapSupabaseUser(data.user));
      }
      setLoading(false);
      return { ok: true };
    },
    sendPasswordResetCode: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/user-login`,
      });
      if (error) {
        return { ok: false, message: error.message };
      }

      // Asynchronously trigger Brevo Password Reset email
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://crackspark.in";
      sendBrevoEmail({
        toEmail: email,
        toName: email.split("@")[0],
        type: "password_reset",
        data: {
          userName: email.split("@")[0],
          userEmail: email,
          resetUrl: `${currentOrigin}/user-login`,
        },
      }).catch((e) => console.error("Brevo password_reset send error:", e));

      return { ok: true };
    },
    resetPassword: async (_email, newPassword) => {
      if (!validatePassword(newPassword)) {
        return {
          ok: false,
          message:
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        };
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { ok: false, message: error.message };
      }
      return { ok: true };
    },
    loginGoogle: async () => {
      const redirectTo = `${window.location.origin}/auth/google/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) {
        toast.error(`Google Sign-In failed: ${error.message}`);
      }
    },
    loginGoogleWithToken: async (token: string) => {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: token,
      });
      if (error) {
        setLoading(false);
        return { ok: false, message: error.message };
      }
      if (data?.user) {
        setUser(mapSupabaseUser(data.user));
      }
      setLoading(false);
      return { ok: true };
    },
    loginAdmin: async (username, password) => {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });
      if (error) {
        setLoading(false);
        return { ok: false, message: error.message };
      }
      if (username !== "kalaiarasane28@gmail.com") {
        await supabase.auth.signOut();
        setLoading(false);
        return { ok: false, message: "Unauthorized. Admin credentials required." };
      }
      if (data?.user) {
        setUser(mapSupabaseUser(data.user));
      }
      setLoading(false);
      return { ok: true };
    },
    logout: async () => {
      setLoading(true);
      if (user) {
        try {
          await supabase
            .from("logged_in_users")
            .update({ status: "Offline", last_active_time: new Date().toISOString() })
            .eq("user_id", user.id);
        } catch (err) {
          console.warn("Failed to set user status to offline on logout:", err);
        }
      }
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    },
    toggleBookmark: async (key) => {
      const isBookmarked = bookmarks.includes(key);
      const next = isBookmarked ? bookmarks.filter((k) => k !== key) : [...bookmarks, key];

      // Update local state immediately for snappy UX
      setBookmarks(next);

      // Sync to Supabase in background if authenticated
      if (user) {
        try {
          if (isBookmarked) {
            await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("exam_key", key);
          } else {
            await supabase.from("bookmarks").insert({ user_id: user.id, exam_key: key });
          }
        } catch (err) {
          console.warn("Failed to sync bookmark with Supabase:", err);
        }
      } else {
        toast.error("Please login to bookmark exams.");
      }
    },
    updateAdminProfile: (updates) => {
      if (!user) return;
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
    },
    updateAvatar: async (url: string | null) => {
      if (!user) return;
      try {
        const { error: authError } = await supabase.auth.updateUser({
          data: { avatar_url: url }
        });
        if (authError) throw authError;

        const { error: userError } = await supabase
          .from("users")
          .update({ profile_image: url })
          .eq("id", user.id);
        if (userError) throw userError;

        await supabase
          .from("logged_in_users")
          .update({ profile_image: url })
          .eq("user_id", user.id);

        setUser(prev => prev ? { ...prev, avatar: url || undefined } : null);
      } catch (err: any) {
        console.error("Failed to update avatar in AuthProvider:", err);
        throw err;
      }
    },
    isSubscribed,
    subscriptionDetails,
    refreshSubscription,
    setSubscribed: async (subscribed: boolean) => {
      if (!user) {
        toast.error("Please login to manage subscription.");
        return;
      }
      try {
        const { error } = await supabase
          .from("user_subscriptions")
          .upsert({ 
            user_id: user.id, 
            email: user.email,
            name: user.name,
            is_subscribed: subscribed, 
            payment_status: subscribed ? "approved" : "none",
            start_date: subscribed ? new Date().toISOString() : null,
            expiry_date: subscribed ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null, // default +30 days fallback
            updated_at: new Date().toISOString() 
          });

        if (error) {
          console.error("Error updating subscription:", error);
          toast.error("Failed to update subscription in database.");
          return;
        }

        setIsSubscribed(subscribed);
        await fetchSubscription();
        toast.success(subscribed ? "Subscribed successfully!" : "Unsubscribed successfully.");
      } catch (err) {
        console.error("Subscription update failed:", err);
        toast.error("An error occurred. Please try again.");
      }
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

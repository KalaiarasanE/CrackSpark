import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  X,
  Sparkles,
  LogOut,
  Shield,
  User as UserIcon,
  Bookmark,
  Activity,
  ChevronDown,
  Sun,
  Moon,
  Bell,
  Languages,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/exams", label: "Exams" },
  { to: "/notifications", label: "Notifications" },
  { to: "/contact", label: "Contact" },
];

const languages = [
  { code: "en", name: "English", localName: "English" },
  { code: "ta", name: "Tamil", localName: "தமிழ்" },
  { code: "hi", name: "Hindi", localName: "हिन्दी" },
];

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export function Navbar() {
  const { user, logout, isSubscribed, subscriptionDetails } = useAuth();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Light/Dark mode state
  const [isLightMode, setIsLightMode] = useState(true);

  // Initialize theme from HTML element class
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setIsLightMode(!isDark);
    }
  }, []);

  const toggleTheme = () => {
    const nextLight = !isLightMode;
    setIsLightMode(nextLight);
    if (nextLight) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      toast.success("Switched to Light Mode!");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      toast.success("Switched to Dark Mode!");
    }
  };

  // Scroll listener for sticky transparent -> solid transition
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Refs for click-outside triggers
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // 1. Click outside close handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notifications logic (realtime popup subscription and history view)
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      let query = supabase.from("user_notifications").select("*");
      
      if (user.role === "admin") {
        query = query.order("created_at", { ascending: false }).limit(20);
      } else {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`).order("created_at", { ascending: false }).limit(20);
      }

      const { data, error } = await query;

      if (!error && data) {
        setDbNotifications(data);
        const unread = data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("navbar-notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications" },
        (payload) => {
          console.log("[Realtime Notification] Received insert:", payload.new);
          const newNotif = payload.new;

          // Double check if this notification is for the current user or admin
          if (newNotif.user_id && newNotif.user_id !== user.id && user.role !== "admin") {
            return;
          }

          // Trigger toast popup
          toast.success(newNotif.title, {
            description: newNotif.message || "Click the notification bell to view details.",
            duration: 8000,
            position: "bottom-right",
          });

          // Refresh list
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("is_read", false)
        .or(`user_id.eq.${user.id},user_id.is.null`);
      if (!error) {
        fetchNotifications();
        toast.success("All notifications marked as read.");
      }
    } catch (e) {
      console.warn("Failed to mark all as read:", e);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (!error) {
        fetchNotifications();
      }
    } catch (e) {
      console.warn("Failed to mark notification as read:", e);
    }
  };

  // 2. Google Translate script injection & lang storage sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Global init callback
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ta,hi",
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };

    // Load element script dynamically
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Synchronize language with Supabase user preferences metadata when user changes
  useEffect(() => {
    if (!user) return;

    // Check if user has a saved language preference in user_metadata
    supabase.auth.getSession().then(({ data: { session } }) => {
      const dbLang = session?.user?.user_metadata?.lang;
      if (dbLang && dbLang !== currentLang) {
        setCurrentLang(dbLang);
        triggerTranslation(dbLang);
      }
    });
  }, [user]);

  const triggerTranslation = (langCode: string) => {
    if (typeof window === "undefined") return;
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change"));
    } else {
      // Retry in case widget combo box isn't initialized yet
      setTimeout(() => {
        const retryCombo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
        if (retryCombo) {
          retryCombo.value = langCode;
          retryCombo.dispatchEvent(new Event("change"));
        }
      }, 600);
    }
  };

  const handleLanguageChange = async (code: string) => {
    setCurrentLang(code);
    setLangOpen(false);
    triggerTranslation(code);

    if (user) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { lang: code },
        });
        if (error) throw error;
      } catch (err) {
        console.warn("Failed to sync language preference to Supabase:", err);
      }
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-sm"
          : "bg-transparent border-transparent",
      )}
    >
      {/* Hide standard Google Translate frames and headers */}
      <style>{`
        .skiptranslate, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
      `}</style>

      {/* Hidden translate container */}
      <div id="google_translate_element" style={{ display: "none" }} />

      {/* Spaced out 1600px container */}
      <div
        className="flex h-16 w-full items-center justify-between mx-auto"
        style={{
          maxWidth: "1600px",
          width: "100%",
          paddingLeft: "32px",
          paddingRight: "32px",
        }}
      >
        {/* Left Section: Logo + Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-border shadow-sm flex items-center justify-center bg-card shrink-0">
              <img
                src="/logo.png"
                className="h-full w-full object-cover rounded-full group-hover:rotate-[15deg] transition-transform duration-500"
                alt="Logo"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-tight">CrackSpark</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Gov Exam Portal
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 ml-2 relative">
            {navLinks.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "relative inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium transition-colors group/nav z-10",
                    active
                      ? "text-primary font-semibold"
                      : "text-foreground/80 hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-0 bg-primary/8 rounded-lg -z-10" />
                  ) : (
                    <span className="absolute bottom-0.5 left-3.5 right-3.5 h-0.5 bg-primary scale-x-0 group-hover/nav:scale-x-100 transition-transform duration-300 origin-left" />
                  )}
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Language Selector + Auth Action */}
        <div className="hidden md:flex items-center gap-3">
          {/* Light/Dark Mode Toggle */}
          <div className="flex items-center gap-2 mr-1">
            <button
              onClick={toggleTheme}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isLightMode ? "bg-primary" : "bg-muted-foreground/30"
              )}
              aria-label="Toggle dark mode"
            >
              <span
                className={cn(
                  "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center",
                  isLightMode ? "translate-x-5" : "translate-x-0"
                )}
              >
                {isLightMode ? (
                  <Sun className="h-3 w-3 text-gold" />
                ) : (
                  <Moon className="h-3 w-3 text-primary" />
                )}
              </span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted text-foreground/90 transition select-none cursor-pointer"
              aria-label="Translate website"
            >
              <Languages className="h-4 w-4" />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-card p-1.5 text-foreground shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors font-medium flex items-center justify-between",
                      currentLang === l.code && "text-primary bg-primary/8 font-semibold",
                    )}
                  >
                    <span>{l.localName}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-normal">
                      ({l.name})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifDropdownOpen((v) => !v);
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted text-foreground/90 transition select-none cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 text-foreground shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-2.5">
                  <h4 className="font-display font-bold text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                  {dbNotifications.map((n) => {
                    const isUnread = !n.is_read;
                    return (
                      <Link
                        key={n.id}
                        to={n.link_to || "/notifications"}
                        onClick={() => {
                          markSingleAsRead(n.id);
                          setNotifDropdownOpen(false);
                        }}
                        className={cn(
                          "block p-2.5 rounded-xl border text-[11px] text-left transition hover:bg-muted/60 relative cursor-pointer",
                          isUnread ? "bg-primary/5 border-primary/20 font-semibold animate-pulse-light" : "border-border/50"
                        )}
                      >
                        {isUnread && (
                          <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                        )}
                        <div className="text-[9px] text-amber-500 mb-1 uppercase font-bold tracking-wider">
                          {n.type.replace('_', ' ')}
                        </div>
                        <div className="text-foreground font-bold leading-normal">{n.title}</div>
                        <div className="text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</div>
                        <div className="text-[8px] text-muted-foreground mt-1.5 font-mono">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </Link>
                    );
                  })}
                  {dbNotifications.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No notifications available.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border mt-3 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    View All History →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Show admin button only if user is admin */}
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gold/10 border border-gold/20 px-3 text-sm font-semibold text-foreground hover:bg-gold/20 transition-all duration-200"
                >
                  <Shield className="h-4 w-4 text-gold-foreground" />
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              )}

              {/* Profile Avatar Trigger */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className={cn(
                    "h-9 w-9 rounded-full border border-border shadow-sm flex items-center justify-center bg-primary/10 text-primary hover:ring-2 hover:ring-primary/20 transition-all select-none cursor-pointer relative",
                    isSubscribed && "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.55)] ring-1 ring-amber-500/30"
                  )}
                  aria-label="User Menu"
                >
                  <div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        className="h-full w-full object-cover"
                        alt={user.name}
                      />
                    ) : (
                      <span className="font-bold text-sm uppercase">
                        {getInitials(user.name)}
                      </span>
                    )}
                  </div>

                  {/* Overlapping golden star badge at the bottom-right corner */}
                  {isSubscribed && (
                    <div 
                      className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-amber-500 rounded-full flex items-center justify-center border border-background shadow-[0_0_6px_rgba(245,158,11,0.85)] z-10"
                      title="CrackSpark Premium Member"
                    >
                      <svg
                        className="h-2 w-2 text-white fill-current animate-pulse"
                        viewBox="0 0 24 24"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Profile Header */}
                    <div className="flex flex-col items-center text-center pb-4 border-b border-border">
                      <div className={cn(
                        "h-16 w-16 rounded-full overflow-hidden border border-border bg-primary/10 text-primary flex items-center justify-center mb-2.5 shadow-inner",
                        isSubscribed && "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.55)] ring-2 ring-amber-500/20"
                      )}>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            className="h-full w-full object-cover"
                            alt={user.name}
                          />
                        ) : (
                          <span className="font-bold text-xl uppercase">
                            {getInitials(user.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="font-bold text-sm text-foreground leading-none">{user.name}</div>
                        {isSubscribed && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-extrabold uppercase tracking-wider select-none shrink-0 border border-amber-500/20">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[240px] leading-none">{user.email}</div>
                    </div>

                    {/* Premium Profile validity Card */}
                    {isSubscribed && subscriptionDetails && (
                      <div className="py-2.5 px-3 mt-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[10px] text-left space-y-1">
                        <div className="flex items-center gap-1 font-bold text-amber-600 uppercase tracking-wider">
                          <svg className="h-3 w-3 fill-current text-amber-500" viewBox="0 0 24 24">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          ⭐ CrackSpark Premium
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2 text-muted-foreground font-semibold">
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-muted-foreground/60">Plan type</span>
                            <span className="font-bold text-foreground capitalize">{subscriptionDetails.plan_type}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-muted-foreground/60">Days Left</span>
                            <span className="font-bold text-amber-600">
                              {Math.max(0, Math.ceil((new Date(subscriptionDetails.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days
                            </span>
                          </div>
                          <div className="col-span-2 pt-1.5 border-t border-amber-500/10">
                            <span className="block text-[8px] uppercase font-bold text-muted-foreground/60">Validity Period</span>
                            <span className="text-[10px] text-foreground font-bold font-mono">
                              {subscriptionDetails.start_date ? new Date(subscriptionDetails.start_date).toLocaleDateString() : "-"} - {new Date(subscriptionDetails.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="h-2" />

                    {/* Navigation Options */}
                    <div className="py-2 space-y-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                      >
                        <Activity className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        to="/bookmarks"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                      >
                        <Bookmark className="h-4 w-4" />
                        Saved Exams
                      </Link>
                      <Link
                        to={user.role === "admin" ? "/admin" : "/dashboard"}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                      >
                        <UserIcon className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                      >
                        <Sparkles className="h-4 w-4" />
                        Settings
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold rounded-lg bg-gold/10 text-gold-foreground hover:bg-gold/20 transition-colors"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    {/* Logout Footer */}
                    <div className="pt-2 border-t border-border">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex items-center justify-center gap-2 w-full h-9 rounded-lg border border-border text-xs font-bold hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Let's Begin Single Dropdown Trigger */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all select-none"
              >
                Let's Begin{" "}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    dropdownOpen && "rotate-180",
                  )}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-border bg-card p-2 text-foreground shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Access option */}
                  <Link
                    to="/user-login"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition text-left w-full"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">User Login / Sign Up</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                        Access exam materials, notifications, mock tests, and bookmarks.
                      </div>
                    </div>
                  </Link>

                  <div className="h-px bg-border my-1.5" />

                  {/* Admin Access option */}
                  <Link
                    to="/admin-login"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition text-left w-full"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold-foreground shrink-0">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Admin Login</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                        Secure administrator access to manage portal content.
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="md:hidden ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col p-3 gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}

            {/* Mobile Translator */}
            <div className="h-px bg-border my-2" />
            <div className="space-y-1 py-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-3 mb-2 flex items-center gap-1">
                <span>🌐</span> Select Language
              </div>
              <div className="grid grid-cols-3 gap-2 px-3">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      handleLanguageChange(l.code);
                      setOpen(false);
                    }}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition",
                      currentLang === l.code
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {l.localName}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Theme Toggle */}
            <div className="h-px bg-border my-2" />
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                {isLightMode ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4 text-primary" />}
                <span>Theme: {isLightMode ? "Light Mode" : "Dark Mode"}</span>
              </span>
              <button
                onClick={toggleTheme}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isLightMode ? "bg-primary" : "bg-muted-foreground/30"
                )}
                aria-label="Toggle dark mode"
              >
                <span
                  className={cn(
                    "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center",
                    isLightMode ? "translate-x-5" : "translate-x-0"
                  )}
                >
                  {isLightMode ? (
                    <Sun className="h-3 w-3 text-gold" />
                  ) : (
                    <Moon className="h-3 w-3 text-primary" />
                  )}
                </span>
              </button>
            </div>

            <div className="h-px bg-border my-2" />
            {user ? (
              <div className="px-3 py-2 space-y-3">
                {/* User Info Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        className="h-full w-full object-cover"
                        alt={user.name}
                      />
                    ) : (
                      <span className="font-bold text-sm uppercase">
                        {getInitials(user.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>

                {/* Mobile Drawer Menu Links */}
                <div className="flex flex-col gap-1 pt-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    to="/bookmarks"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2"
                  >
                    <Bookmark className="h-4 w-4" /> Saved Exams
                  </Link>
                  <Link
                    to={user.role === "admin" ? "/admin" : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2"
                  >
                    <UserIcon className="h-4 w-4" /> My Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" /> Settings
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-muted flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="text-left px-3 py-2 rounded-lg text-sm font-bold text-destructive hover:bg-destructive/10 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            ) : (
              /* Mobile responsive auth layouts */
              <div className="space-y-1 py-1">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-3 mb-2">
                  Access Portals
                </div>
                {/* User Portal Mobile */}
                <Link
                  to="/user-login"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition text-left"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">User Login / Sign Up</div>
                    <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                      Access exam materials, notifications, mock tests, and bookmarks.
                    </div>
                  </div>
                </Link>
                {/* Admin Portal Mobile */}
                <Link
                  to="/admin-login"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition text-left"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold-foreground shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Admin Login</div>
                    <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                      Secure administrator access to manage portal content.
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

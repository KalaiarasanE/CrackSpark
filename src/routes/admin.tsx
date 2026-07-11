import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import { categories, allExams, allNotifications } from "@/data/exams";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  Bell,
  FileText,
  Play,
  Newspaper,
  Users as UsersIcon,
  Plus,
  Pencil,
  Trash2,
  Search,
  TrendingUp,
  Activity,
  Download,
  User as UserIcon,
  Camera,
  Loader2,
  Package,
  MapPin,
  Mail,
  Phone,
  HelpCircle,
  Link as LinkIcon,
  Calendar,
  Globe,
  Upload,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Image,
  Save,
  RotateCcw,
  Ban,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — CrackSpark" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Section =
  | "overview"
  | "assets"
  | "category_images"
  | "exams"
  | "notifications"
  | "materials"
  | "mocks"
  | "papers"
  | "affairs"
  | "faq"
  | "users"
  | "logged_users"
  | "payments"
  | "profile"
  | "countdowns";

const nav: { id: Section; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "assets", label: "Hero & Banners", Icon: Camera },
  { id: "category_images", label: "Category Images", Icon: Image },
  { id: "exams", label: "Exams & Websites", Icon: GraduationCap },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "materials", label: "Study Materials", Icon: FileText },
  { id: "mocks", label: "Mock Tests", Icon: Play },
  { id: "papers", label: "Previous Papers", Icon: Newspaper },
  { id: "affairs", label: "Current Affairs", Icon: Globe },
  { id: "faq", label: "FAQs", Icon: HelpCircle },
  { id: "users", label: "Users", Icon: UsersIcon },
  { id: "logged_users", label: "Logged In Users", Icon: Activity },
  { id: "payments", label: "Payment Verification Requests", Icon: Package },
  { id: "countdowns", label: "Exam Countdowns", Icon: Clock },
  { id: "profile", label: "My Profile", Icon: UserIcon },
];

function AdminPage() {
  const { user, loading } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  // Synchronize section selection from URL search query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const secParam = params.get("section") as Section;
      if (secParam && ["overview", "assets", "category_images", "exams", "notifications", "materials", "mocks", "papers", "affairs", "faq", "users", "logged_users", "payments", "profile", "countdowns"].includes(secParam)) {
        setSection(secParam);
      }
    }
  }, []);

  // Fetch pending verification count in real time
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from("payment_requests")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "pending");
        if (!error && count !== null) {
          setPendingVerificationsCount(count);
        }
      } catch (err) {
        console.warn("Failed to fetch pending verifications count:", err);
      }
    };

    fetchPendingCount();

    const channel = supabase
      .channel("admin-verification-count-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_requests" },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Configure storage bucket size on mount
  useEffect(() => {
    async function configureBucket() {
      try {
        const { error } = await supabase.storage.updateBucket("resources", {
          public: true,
          fileSizeLimit: 524288000, // 500 MB in bytes
        });
        if (error) {
          console.log("[Storage Config] updateBucket warning (likely needs service role key):", error.message);
        } else {
          console.log("[Storage Config] Supabase Storage resources bucket max_file_size set to 500 MB successfully.");
        }
      } catch (err) {
        console.error("[Storage Config] Error updating bucket size:", err);
      }
    }
    if (user && user.role === "admin") {
      configureBucket();
    }
  }, [user]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-display text-foreground">Loading...</h2>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!user) return <Navigate to="/admin-login" />;
  if (user.role !== "admin") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md text-center py-24 px-4">
          <h1 className="font-display text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an administrator account to continue.
          </p>
          <Link
            to="/admin-login"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary text-primary-foreground px-5 font-semibold"
          >
            Admin sign in
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 self-start rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="px-3 py-3 border-b border-border mb-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Admin Control
              </div>
              <div className="font-display text-lg font-bold mt-0.5">CMS Panel</div>
            </div>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {nav.map((n) => {
                const active = n.id === section;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSection(n.id)}
                    className={`shrink-0 flex items-center justify-between gap-2.5 px-3 h-9 rounded-lg text-sm font-medium transition-all ${active ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <n.Icon className="h-4 w-4" /> {n.label}
                    </span>
                    {n.id === "payments" && pendingVerificationsCount > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[9px] font-bold text-white shadow-sm animate-pulse">
                        {pendingVerificationsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="min-w-0">
            {section === "overview" && <Overview />}
            {section === "assets" && <PortalAssetsCMS />}
            {section === "category_images" && <CategoryImagesCMS />}
            {section === "exams" && <ExamsCMS />}
            {section === "notifications" && <NotificationsCMS />}
            {section === "materials" && <MaterialsCMS />}
            {section === "mocks" && <MocksCMS />}
            {section === "papers" && <PapersCMS />}
            {section === "affairs" && <AffairsCMS />}
            {section === "faq" && <FaqCMS />}
            {section === "users" && <UsersTable />}
            {section === "logged_users" && <LoggedInUsersCMS />}
            {section === "payments" && <PaymentsCMS />}
            {section === "countdowns" && <CountdownsCMS />}
            {section === "profile" && <AdminProfileSection />}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

// ----------------------------------------------------
// HELPER: Upload file to Supabase Storage
// ----------------------------------------------------
async function uploadToStorage(
  file: File, 
  folder: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  console.log(`[Upload] Uploading file "${file.name}" (${(file.size / 1024).toFixed(2)} KB) to folder "${folder}"...`);
  
  // 500 MB validation limit
  const MAX_SIZE = 500 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File size is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). The maximum allowed size is 500 MB.`);
  }

  const fileExt = file.name.split(".").pop();
  const uniqueId = Math.random().toString(36).substring(2, 15);
  const filePath = `${folder}/${uniqueId}_${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage.from("resources").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    onUploadProgress: (progress: any) => {
      if (onProgress && progress.total) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percent);
      }
    }
  } as any);

  if (error) {
    console.error("[Upload] Error uploading file to storage bucket:", error);
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        "Supabase Storage bucket 'resources' not found. Please create a public bucket named 'resources' in your Supabase dashboard.",
      );
    }
    throw error;
  }

  const { data } = supabase.storage.from("resources").getPublicUrl(filePath);
  console.log(`[Upload] File upload success. Public URL generated: "${data.publicUrl}"`);
  return data.publicUrl;
}

// ----------------------------------------------------
// SECTION: OVERVIEW
// ----------------------------------------------------
function Overview() {
  const [stats, setStats] = useState({
    notifications: 0,
    materials: 0,
    mocks: 0,
    papers: 0,
  });
  const [adminIllustration, setAdminIllustration] = useState("/admin_illustration.jpg");

  useEffect(() => {
    async function loadStats() {
      const [nRes, mRes, mockRes, pRes] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }),
        supabase.from("study_materials").select("id", { count: "exact", head: true }),
        supabase.from("mock_tests").select("id", { count: "exact", head: true }),
        supabase.from("previous_papers").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        notifications: nRes.count || 0,
        materials: mRes.count || 0,
        mocks: mockRes.count || 0,
        papers: pRes.count || 0,
      });
    }
    async function fetchIllustration() {
      try {
        const { data, error } = await supabase
          .from("exam_details")
          .select("official_website_url")
          .eq("exam_key", "settings:admin_illustration")
          .maybeSingle();
        if (!error && data?.official_website_url) {
          setAdminIllustration(data.official_website_url);
        }
      } catch (e) {
        console.warn(e);
      }
    }
    loadStats();
    fetchIllustration();
  }, []);

  const statsItems = [
    {
      label: "Active Notifications",
      val: stats.notifications,
      Icon: Bell,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Study Materials",
      val: stats.materials,
      Icon: FileText,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      label: "Mock Tests",
      val: stats.mocks,
      Icon: Play,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      label: "Previous Papers",
      val: stats.papers,
      Icon: Newspaper,
      color: "bg-amber-500/10 text-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
            CMS Control Panel
          </div>
          <h1 className="font-display text-3xl font-bold">Admin Overview</h1>
        </div>
      </div>

      {/* Admin dashboard illustration banner card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm relative group h-44 sm:h-56 flex items-end">
        <img
          src={adminIllustration}
          alt="Admin Illustration"
          className="absolute inset-0 h-full w-full object-cover group-hover:scale-102 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="relative p-6 text-white z-10">
          <h2 className="text-xl sm:text-2xl font-bold font-display">Welcome Back, Administrator</h2>
          <p className="text-xs text-white/70 mt-1 max-w-lg">
            Manage your government portal's assets, upload PDFs/materials, edit mock tests, and keep notifications current.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm"
          >
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">{item.val}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-bold">Quick Actions</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Perform administrative task operations. Ensure you run the database schema queries in
            your Supabase project to enable complete cloud syncing.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted/30 border border-border rounded-xl">
              <strong>Database Cloud Status</strong>
              <div className="text-primary mt-1 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Connected to
                Supabase
              </div>
            </div>
            <div className="p-3 bg-muted/30 border border-border rounded-xl">
              <strong>File Upload Bucket</strong>
              <div className="text-muted-foreground mt-1">
                Bucket: <span className="font-semibold text-foreground">resources</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-bold">Current System Configurations</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Admin Account Email</span>
              <span className="font-semibold text-foreground">kalaiarasane28@gmail.com</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Role Based Policies</span>
              <span className="font-semibold text-emerald-500">Enabled (RLS Policies applied)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Local storage fallback support</span>
              <span className="font-semibold text-primary">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SECTION: EXAMS & OFFICIAL WEBSITES CMS
// ----------------------------------------------------
function ExamsCMS() {
  const [details, setDetails] = useState<Record<string, string>>({});
  const [selectedExam, setSelectedExam] = useState<(typeof allExams)[0] | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchWebsites() {
      const { data, error } = await supabase.from("exam_details").select("*");
      if (!error && data) {
        const mapping: Record<string, string> = {};
        data.forEach((row: any) => {
          mapping[row.exam_key] = row.official_website_url;
        });
        setDetails(mapping);
      }
    }
    fetchWebsites();
  }, []);

  const handleSave = async () => {
    if (!selectedExam) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("exam_details")
        .upsert({ exam_key: selectedExam.slug, official_website_url: urlInput });

      if (error) throw error;

      setDetails((prev) => ({ ...prev, [selectedExam.slug]: urlInput }));
      toast.success(`Official website URL updated for ${selectedExam.name}!`);
      setSelectedExam(null);
    } catch (err: any) {
      toast.error(`Failed to update official website URL: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Exams & Official Links</h2>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border text-xs sm:text-sm">
          {allExams.map((exam) => {
            const currentUrl = details[exam.slug] || exam.officialUrl || "";
            return (
              <div key={exam.slug} className="p-4 grid sm:grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="font-bold">{exam.fullName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Slug: <span className="font-mono">{exam.slug}</span> • Category:{" "}
                    <span className="uppercase font-semibold">{exam.category}</span>
                  </div>
                  <div className="text-xs text-primary truncate mt-1 flex items-center gap-1 font-mono">
                    <Globe className="h-3 w-3 shrink-0" />{" "}
                    {currentUrl || "No custom link configured"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setUrlInput(currentUrl);
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-muted/30 px-3 text-xs font-semibold hover:bg-muted transition"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit URL
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit URL Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl animate-fade-in text-xs sm:text-sm">
            <h3 className="font-display text-lg font-bold mb-4">Official Website URL</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Exam
                </label>
                <div className="font-semibold text-foreground">{selectedExam.fullName}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Official Website Link
                </label>
                <input
                  type="url"
                  placeholder="https://example-recruitment.gov.in"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedExam(null)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={handleSave}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: PORTAL ASSETS & BANNERS CMS
// ----------------------------------------------------
function PortalAssetsCMS() {
  const [heroUrl, setHeroUrl] = useState("");
  const [adminUrl, setAdminUrl] = useState("");
  const [banners, setBanners] = useState<Record<string, string>>({});
  
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAdmin, setUploadingAdmin] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState<Record<string, boolean>>({});
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  const categoriesList = [
    { slug: "upsc", name: "UPSC", default: "/upsc_banner.jpg" },
    { slug: "tnpsc", name: "TNPSC", default: "/tnpsc_banner.jpg" },
    { slug: "ssc", name: "SSC", default: "/ssc_banner.jpg" },
    { slug: "ibps", name: "Banking (IBPS/SBI)", default: "/banking_banner.jpg" },
    { slug: "rrb", name: "Railways (RRB)", default: "/railways_banner.jpg" },
    { slug: "defence", name: "Defence", default: "/hero_background.jpg" },
  ];

  useEffect(() => {
    async function loadAssets() {
      try {
        const { data, error } = await supabase.from("exam_details").select("*");
        if (!error && data) {
          const mapping: Record<string, string> = {};
          data.forEach((row: any) => {
            if (row.exam_key === "settings:home_hero") {
              setHeroUrl(row.official_website_url);
            } else if (row.exam_key === "settings:admin_illustration") {
              setAdminUrl(row.official_website_url);
            } else if (row.exam_key.startsWith("banner:")) {
              const catKey = row.exam_key.replace("banner:", "");
              mapping[catKey] = row.official_website_url;
            }
          });
          setBanners(mapping);
        }
      } catch (err) {
        console.warn("Failed to load portal assets:", err);
      }
    }
    loadAssets();
  }, []);

  const handleSaveSetting = async (key: string, url: string) => {
    try {
      const { error } = await supabase
        .from("exam_details")
        .upsert({ exam_key: key, official_website_url: url });
      if (error) throw error;
      setImageTimestamp(Date.now());
      toast.success("Image updated and saved successfully!");
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  const handleFileUploadSetting = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (key === "settings:home_hero") setUploadingHero(true);
    else if (key === "settings:admin_illustration") setUploadingAdmin(true);
    else setUploadingBanner((prev) => ({ ...prev, [key]: true }));

    try {
      const url = await uploadToStorage(file, "banners");
      if (key === "settings:home_hero") {
        setHeroUrl(url);
        await handleSaveSetting(key, url);
      } else if (key === "settings:admin_illustration") {
        setAdminUrl(url);
        await handleSaveSetting(key, url);
      } else {
        const catKey = key.replace("banner:", "");
        setBanners((prev) => ({ ...prev, [catKey]: url }));
        await handleSaveSetting(key, url);
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      if (key === "settings:home_hero") setUploadingHero(false);
      else if (key === "settings:admin_illustration") setUploadingAdmin(false);
      else setUploadingBanner((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getBustedUrl = (url: string, defaultFallback: string) => {
    if (!url) return defaultFallback;
    return url.includes('?') ? `${url}&t=${imageTimestamp}` : `${url}?t=${imageTimestamp}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
          Assets Manager
        </div>
        <h2 className="font-display text-2xl font-bold">Portal Heros & Banners</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Home Hero Setting */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 font-display text-base font-bold border-b border-border pb-3">
            <Camera className="h-5 w-5 text-primary" />
            Home Hero Background
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Click the button below to upload a professional background image from your computer to change the Home Page hero section.
          </p>
          <div className="h-44 rounded-xl overflow-hidden border border-border bg-muted relative group">
            <img
              src={getBustedUrl(heroUrl, "/hero_background.jpg")}
              alt="Home Hero Preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {uploadingHero && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white font-bold gap-2">
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUploadSetting(e, "settings:home_hero")}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full animate-pulse"
            />
            <button
              type="button"
              disabled={uploadingHero}
              className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Upload className="h-4 w-4" />
              {uploadingHero ? "Uploading Image..." : "Upload New Hero Background"}
            </button>
          </div>
        </div>

        {/* Admin Dashboard Illustration Setting */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 font-display text-base font-bold border-b border-border pb-3">
            <Camera className="h-5 w-5 text-primary" />
            Admin Overview Image
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Click the button below to upload a welcoming illustration from your computer to change the Admin dashboard.
          </p>
          <div className="h-44 rounded-xl overflow-hidden border border-border bg-muted relative group">
            <img
              src={getBustedUrl(adminUrl, "/admin_illustration.jpg")}
              alt="Admin Preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {uploadingAdmin && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white font-bold gap-2">
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUploadSetting(e, "settings:admin_illustration")}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <button
              type="button"
              disabled={uploadingAdmin}
              className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Upload className="h-4 w-4" />
              {uploadingAdmin ? "Uploading Image..." : "Upload New Admin Illustration"}
            </button>
          </div>
        </div>
      </div>

      {/* Category Banners List */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-display text-base font-bold border-b border-border pb-3">
          <Globe className="h-5 w-5 text-primary" />
          Exam Category Header Banners
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Manage header banners for each exam page category. Simply click "Upload Banner" next to the category to select and change the image.
        </p>

        <div className="divide-y divide-border">
          {categoriesList.map((cat) => {
            const currentBanner = banners[cat.slug] || cat.default;
            const keyName = `banner:${cat.slug}`;
            const isUploading = uploadingBanner[keyName] || false;
            return (
              <div key={cat.slug} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-16 w-32 rounded-lg overflow-hidden border border-border bg-muted shrink-0 relative group">
                    <img
                      src={getBustedUrl(banners[cat.slug], cat.default)}
                      alt={`${cat.name} Banner`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{cat.name} Category Page Banner</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[250px] sm:max-w-[400px] truncate">
                      {banners[cat.slug] ? "Custom uploaded image active" : "Using default category graphics"}
                    </div>
                  </div>
                </div>
                <div className="relative shrink-0 w-full sm:w-auto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUploadSetting(e, keyName)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    className="w-full sm:w-auto h-9 px-4 bg-muted border border-border rounded-lg text-xs font-semibold hover:bg-muted/80 flex items-center justify-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {isUploading ? "Uploading..." : "Upload New Banner"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SECTION: NOTIFICATIONS CMS
// ----------------------------------------------------
type DbNotification = {
  id?: string;
  title: string;
  description: string;
  category: string;
  publish_date: string;
  important_links: { label: string; url: string }[];
  is_pinned: boolean;
};

function NotificationsCMS() {
  const [items, setItems] = useState<DbNotification[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbNotification | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("UPSC");
  const [publishDate, setPublishDate] = useState("");
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const loadData = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("publish_date", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setCategory("UPSC");
    setPublishDate(new Date().toISOString().split("T")[0]);
    setLinks([]);
    setIsPinned(false);
    setModalOpen(true);
  };

  const openEdit = (n: DbNotification) => {
    setEditingItem(n);
    setTitle(n.title);
    setDescription(n.description);
    setCategory(n.category);
    setPublishDate(n.publish_date.split("T")[0]);
    setLinks(n.important_links);
    setIsPinned(n.is_pinned);
    setModalOpen(true);
  };

  const addLinkField = () => {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  };

  const removeLinkField = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, key: "label" | "url", val: string) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index][key] = val;
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      title,
      description,
      category,
      publish_date: new Date(publishDate).toISOString(),
      important_links: links.filter((l) => l.label && l.url),
      is_pinned: isPinned,
    };

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("notifications")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Notification updated successfully!");
      } else {
        const { error } = await supabase.from("notifications").insert(payload);
        if (error) throw error;
        toast.success("Notification published successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Action failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      toast.success("Notification deleted.");
      loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      catFilter === "all" || item.category.toLowerCase() === catFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Latest Notifications</h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Notification
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border text-xs sm:text-sm">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 grid grid-cols-[1fr_auto] items-center gap-3 hover:bg-muted/10"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.is_pinned && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold">
                      📌 Pinned
                    </span>
                  )}
                  <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    📅 {new Date(item.publish_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="font-semibold mt-1.5 text-foreground truncate">{item.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(item)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-xs sm:text-sm text-muted-foreground">
              No notifications found in database.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto text-xs"
          >
            <h3 className="font-display text-lg font-bold mb-4">
              {editingItem ? "Edit Notification" : "Publish Notification"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Notification Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. UPSC Civil Services Prelims 2026 Registration Open"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="General">General / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Publish Date
                  </label>
                  <input
                    required
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding registration deadlines, exams schedule..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-semibold text-muted-foreground">
                    Important Links
                  </label>
                  <button
                    type="button"
                    onClick={addLinkField}
                    className="text-[10px] text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> Add Link
                  </button>
                </div>
                <div className="space-y-2">
                  {links.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        required
                        placeholder="Link Label (e.g. Official PDF)"
                        value={link.label}
                        onChange={(e) => handleLinkChange(idx, "label", e.target.value)}
                        className="flex-1 h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none"
                      />
                      <input
                        required
                        type="url"
                        placeholder="Link URL (https://...)"
                        value={link.url}
                        onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                        className="flex-1 h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeLinkField(idx)}
                        className="h-8 w-8 grid place-items-center hover:bg-destructive/10 text-destructive rounded-lg shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                />
                <label
                  htmlFor="pin"
                  className="font-semibold text-muted-foreground select-none cursor-pointer"
                >
                  Pin this notification to top
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingItem ? "Update" : "Publish"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: PREVIOUS PAPERS CMS
// ----------------------------------------------------
type DbPaper = {
  id?: string;
  exam_name: string;
  year: number;
  subject: string;
  pdf_url: string;
};

function PapersCMS() {
  const [items, setItems] = useState<DbPaper[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbPaper | null>(null);

  // Form State
  const [examName, setExamName] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [subject, setSubject] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const { data, error } = await supabase
      .from("previous_papers")
      .select("*")
      .order("year", { ascending: false });
    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setExamName(allExams[0]?.fullName || "");
    setYear(new Date().getFullYear());
    setSubject("");
    setPdfUrl("");
    setUploadProgress(null);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadToStorage(file, "papers", (percent) => {
        setUploadProgress(percent);
      });
      setPdfUrl(url);
      toast.success("PDF uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUrl) {
      toast.error("Please upload or enter a PDF file URL.");
      return;
    }
    setLoading(true);
    const payload = {
      exam_name: examName,
      year: Number(year),
      subject,
      pdf_url: pdfUrl,
    };

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("previous_papers")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        await supabase.from("notifications").insert({
          title: "Previous Year Questions have been updated.",
          category: "General",
          description: `${examName} (${subject}) paper has been modified.`,
          publish_date: new Date().toISOString(),
          important_links: [],
          is_pinned: false
        });
        toast.success("Paper updated successfully!");
      } else {
        const { error } = await supabase.from("previous_papers").insert(payload);
        if (error) throw error;
        await supabase.from("notifications").insert({
          title: "New Previous Year Questions have been uploaded.",
          category: "General",
          description: `Previous Year Paper for ${examName} (${subject}) is now available.`,
          publish_date: new Date().toISOString(),
          important_links: [],
          is_pinned: false
        });
        toast.success("Paper published successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this paper?")) return;
    try {
      const { error } = await supabase.from("previous_papers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Paper deleted.");
      loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const filtered = items.filter((item) => {
    return (
      item.exam_name.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.year.toString().includes(search)
    );
  });

  return (
    <div className="space-y-5 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Previous Year Papers</h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Upload Paper
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search by exam, subject, or year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 grid grid-cols-[1fr_auto] items-center gap-3 hover:bg-muted/10"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                    📅 Year {item.year}
                  </span>
                  <span className="font-semibold uppercase text-[10px] text-muted-foreground">
                    {item.subject}
                  </span>
                </div>
                <div className="font-semibold mt-1 text-foreground truncate">{item.exam_name}</div>
                <a
                  href={item.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-mono mt-1 hover:underline inline-flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Download Paper PDF
                </a>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setExamName(item.exam_name);
                    setYear(item.year);
                    setSubject(item.subject);
                    setPdfUrl(item.pdf_url);
                    setModalOpen(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No papers found in database.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl animate-fade-in text-xs space-y-4"
          >
            <h3 className="font-display text-lg font-bold">
              {editingItem ? "Edit Paper Details" : "Upload Previous Paper"}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Target Exam
                </label>
                <select
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                >
                  {allExams.map((ex) => (
                    <option key={ex.slug} value={ex.fullName}>
                      {ex.fullName} ({ex.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Year</label>
                  <input
                    required
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Subject</label>
                  <input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. General Studies 1"
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Upload PDF Document
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Direct PDF URL"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button
                      type="button"
                      className="h-10 px-3 bg-muted border border-border rounded-lg text-xs font-semibold hover:bg-muted/80 flex items-center gap-1"
                    >
                      {uploading ? (
                        <span className="h-3.5 w-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload
                    </button>
                  </div>
                </div>
                {uploadProgress !== null && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>Uploading PDF...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  disabled={loading || uploading}
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  Save Paper
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: MOCK TESTS CMS
// ----------------------------------------------------
async function extractTextFromPdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve("");
      return;
    }
    if (!(window as any).pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        startExtraction();
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js library from CDN."));
      document.head.appendChild(script);
    } else {
      startExtraction();
    }

    async function startExtraction() {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join("\n");
              fullText += pageText + "\n";
            }
            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      } catch (err) {
        reject(err);
      }
    }
  });
}

function parseQuestionsFromText(text: string): any[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const questions: any[] = [];
  let currentQuestion: any = null;

  // Try to parse bulk answer keys such as: 1-C, 2-B, 3-A, 4-D or 1.C, 2.B
  const bulkKeyMap: Record<number, number> = {};
  const bulkMatches = Array.from(text.matchAll(/(?:\b|[^a-zA-Z0-9])(\d{1,3})\s*[\-\s\.\:]\s*([A-Da-d])(?:\b|[^a-zA-Z0-9])/g));
  for (const match of bulkMatches) {
    const qNum = parseInt(match[1]);
    const ansChar = match[2].toUpperCase();
    const ansIdx = ansChar.charCodeAt(0) - 65;
    if (qNum >= 1 && qNum <= 500) {
      bulkKeyMap[qNum] = ansIdx;
    }
  }
  
  // Option markers regex
  const optionRegex = /^\s*[\(\[]?([A-Da-d])[\)\.]\s+(.+)$/;
  // Question marker regex
  const questionRegex = /^\s*(?:Q\s*)?(\d+)\s*[\.\)]\s+(.+)$/;
  // Answer marker regex (supports various labels with boundaries)
  const answerRegex = /^\s*(?:Correct\s+)?(?:Answer|Ans|Option)(?:\s+is)?\s*[:\-\.\s\)]+\s*\(?([A-Da-d]|\d)\)?(?:\b|[\)\.\-\s]|$)/i;
  // Explanation marker regex
  const explanationRegex = /^\s*(?:Explanation|Exp|Detail)\s*:\s*(.+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains inline options like (A) ... (B) ... (C) ... (D) ...
    if (currentQuestion && line.includes("(A)") && line.includes("(B)")) {
      const inlineMatch1 = line.match(/^\s*\(A\)\s*(.+?)\s*\(B\)\s*(.+?)\s*\(C\)\s*(.+?)\s*\(D\)\s*(.+)$/i);
      const inlineMatch2 = line.match(/^\s*A\.\s*(.+?)\s*B\.\s*(.+?)\s*C\.\s*(.+?)\s*D\.\s*(.+)$/i);
      const inlineMatch3 = line.match(/^\s*\(a\)\s*(.+?)\s*\(b\)\s*(.+?)\s*\(c\)\s*(.+?)\s*\(d\)\s*(.+)$/i);
      const inlineMatch = inlineMatch1 || inlineMatch2 || inlineMatch3;
      if (inlineMatch) {
        currentQuestion.o.push(inlineMatch[1].trim(), inlineMatch[2].trim(), inlineMatch[3].trim(), inlineMatch[4].trim());
        continue;
      }
    }

    // Check if line is a question
    const qMatch = line.match(questionRegex);
    if (qMatch) {
      if (currentQuestion && currentQuestion.o.length >= 2) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        q: qMatch[2],
        o: [],
        a: -1, // default to -1 (No Answer Available)
        exp: "",
        has_inline_answer: false
      };
      continue;
    }

    // Check if line is an option
    const oMatch = line.match(optionRegex);
    if (oMatch && currentQuestion) {
      let optionText = oMatch[2].trim();
      const hasCorrectMarker = optionText.includes("✓") || 
                               optionText.toLowerCase().includes("(correct)") || 
                               optionText.toLowerCase().includes("[correct]") || 
                               optionText.startsWith("*");
      if (hasCorrectMarker) {
        // Strip the marker from option text
        optionText = optionText.replace("✓", "")
                               .replace(/\(correct\)/i, "")
                               .replace(/\[correct\]/i, "")
                               .replace(/^\*/, "")
                               .trim();
        const oIdx = currentQuestion.o.length; // current index
        currentQuestion.a = oIdx;
        currentQuestion.has_inline_answer = true;
      }
      currentQuestion.o.push(optionText);
      continue;
    }

    // Check if line is an answer key
    const aMatch = line.match(answerRegex);
    if (aMatch && currentQuestion) {
      const ansChar = aMatch[1].toUpperCase();
      if (ansChar >= "A" && ansChar <= "D") {
        currentQuestion.a = ansChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        currentQuestion.has_inline_answer = true;
      } else {
        const val = parseInt(ansChar);
        if (!isNaN(val) && val >= 1 && val <= 4) {
          currentQuestion.a = val - 1;
          currentQuestion.has_inline_answer = true;
        }
      }
      continue;
    }

    // Fallback text check: If line starts with "Answer:" or "Ans:", check if it contains the exact option text
    const textAnsMatch = line.match(/^\s*(?:Correct\s+)?(?:Answer|Ans|Option)(?:\s+is)?\s*[:\-\.\s]+\s*(.+)$/i);
    if (textAnsMatch && currentQuestion) {
      const candidateText = textAnsMatch[1].trim().toLowerCase();
      
      // Look for a clean option text match
      const cleanText = candidateText.replace(/^([a-d])[\)\.\s\-]+/i, "").trim();
      const optIdx = currentQuestion.o.findIndex(
        (opt: string) => {
          const cleanOpt = opt.trim().toLowerCase();
          return cleanOpt === candidateText || cleanOpt === cleanText;
        }
      );
      if (optIdx !== -1) {
        currentQuestion.a = optIdx;
        currentQuestion.has_inline_answer = true;
      }
      continue;
    }

    // Check if line is an explanation
    const expMatch = line.match(explanationRegex);
    if (expMatch && currentQuestion) {
      currentQuestion.exp = expMatch[1];
      continue;
    }

    // If it doesn't match any but we have an active question, append it
    if (currentQuestion) {
      if (currentQuestion.o.length === 0) {
        currentQuestion.q += " " + line;
      } else if (currentQuestion.o.length > 0 && currentQuestion.o.length <= 4) {
        currentQuestion.o[currentQuestion.o.length - 1] += " " + line;
      } else if (currentQuestion.exp) {
        currentQuestion.exp += " " + line;
      }
    }
  }

  // Push last question
  if (currentQuestion && currentQuestion.o.length >= 2) {
    questions.push(currentQuestion);
  }

  // Post-process to merge bulk keys for questions that don't have an inline answer
  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    if ((q.a === -1 || q.a === undefined) && bulkKeyMap[qNum] !== undefined) {
      q.a = bulkKeyMap[qNum];
    }
    
    // Predict answer: default to Option A (0) if no answer key was detected anywhere
    if (q.a === -1 || q.a === undefined) {
      q.a = 0; 
    }
    delete q.has_inline_answer;
  });

  return questions;
}

type DbMockTest = {
  id?: string;
  exam_id: string;
  title: string;
  questions_count: number;
  duration: string;
  difficulty: string;
  start_date: string;
  end_date: string;
  pdf_url?: string;
  questions_json?: any[];
  is_enabled: boolean;
};

function MocksCMS() {
  const [items, setItems] = useState<DbMockTest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbMockTest | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [examId, setExamId] = useState("");
  const [questionsCount, setQuestionsCount] = useState(100);
  const [duration, setDuration] = useState("120 mins");
  const [difficulty, setDifficulty] = useState("Medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [questionsJson, setQuestionsJson] = useState<any[] | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // PDF Preview Verification States & Handlers
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);

  const handleOpenPreview = () => {
    setPreviewQuestions(JSON.parse(JSON.stringify(questionsJson || [])));
    setPreviewOpen(true);
  };

  const handleSavePreview = () => {
    setQuestionsJson(previewQuestions);
    setQuestionsCount(previewQuestions.length);
    setPreviewOpen(false);
    toast.success("Extracted questions updated successfully!");
  };

  // Filter & Search
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");

  const loadData = async () => {
    const { data, error } = await supabase
      .from("mock_tests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setTitle("");
    setExamId(allExams[0]?.slug || "");
    setQuestionsCount(100);
    setDuration("120 mins");
    setDifficulty("Medium");
    setStartDate("");
    setEndDate("");
    setPdfUrl("");
    setQuestionsJson(null);
    setUploadProgress(null);
    setIsEnabled(true);
    setModalOpen(true);
  };

  const openEdit = (t: DbMockTest) => {
    setEditingItem(t);
    setTitle(t.title);
    setExamId(t.exam_id);
    setQuestionsCount(t.questions_count);
    setDuration(t.duration);
    setDifficulty(t.difficulty);
    setStartDate(t.start_date ? t.start_date.split("T")[0] : "");
    setEndDate(t.end_date ? t.end_date.split("T")[0] : "");
    setPdfUrl(t.pdf_url || "");
    setQuestionsJson(t.questions_json || null);
    setUploadProgress(null);
    setIsEnabled(t.is_enabled);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    setUploadProgress(0);
    try {
      const url = await uploadToStorage(file, "mocks", (percent) => {
        setUploadProgress(percent);
      });
      setPdfUrl(url);
      toast.success("Questions PDF uploaded successfully!");
      
      // Parse questions from PDF
      setParsingPdf(true);
      try {
        const text = await extractTextFromPdf(file);
        const parsed = parseQuestionsFromText(text);
        if (parsed && parsed.length > 0) {
          setQuestionsJson(parsed);
          setQuestionsCount(parsed.length);
          toast.success(`Successfully parsed ${parsed.length} questions from PDF!`);
        } else {
          toast.warning("Uploaded PDF did not contain clearly formatted questions. Mock test will use default questions.");
        }
      } catch (parseErr) {
        console.error("PDF Parsing error:", parseErr);
        toast.error("Failed to extract questions from PDF text.");
      } finally {
        setParsingPdf(false);
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingPdf(false);
      setUploadProgress(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      exam_id: examId,
      title,
      questions_count: Number(questionsCount),
      duration,
      difficulty,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      pdf_url: pdfUrl || null,
      questions_json: questionsJson || null,
      is_enabled: isEnabled,
    };

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("mock_tests")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        await supabase.from("notifications").insert({
          title: `Mock Test Updated: ${title} details have been updated.`,
          category: examId.toUpperCase(),
          description: `The mock practice test for ${examId} has been updated.`,
          publish_date: new Date().toISOString(),
          important_links: [],
          is_pinned: false
        });
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "Mock Test Updated",
          message: `Mock test "${title}" in ${examId.toUpperCase()} has been updated.`,
          type: "mock_test",
          link_to: "/exams"
        });
        toast.success("Mock test updated successfully!");
      } else {
        const { error } = await supabase.from("mock_tests").insert(payload);
        if (error) throw error;
        await supabase.from("notifications").insert({
          title: `New Mock Test Created: ${title} is now available.`,
          category: examId.toUpperCase(),
          description: `A new mock practice test has been created for ${examId}.`,
          publish_date: new Date().toISOString(),
          important_links: [],
          is_pinned: false
        });
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "New Mock Test Created",
          message: `New mock practice test "${title}" in ${examId.toUpperCase()} is now available.`,
          type: "mock_test",
          link_to: "/exams"
        });
        toast.success("Mock test created successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item: DbMockTest) => {
    try {
      const { error } = await supabase
        .from("mock_tests")
        .update({ is_enabled: !item.is_enabled })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(`Mock test ${item.is_enabled ? "Disabled" : "Enabled"} successfully!`);
      loadData();
    } catch (err: any) {
      toast.error(`Status change failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mock test?")) return;
    try {
      const { error } = await supabase.from("mock_tests").delete().eq("id", id);
      if (error) throw error;
      toast.success("Mock test deleted.");
      loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesExam = examFilter === "all" || item.exam_id === examFilter;
    return matchesSearch && matchesExam;
  });

  return (
    <div className="space-y-5 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Mock Tests Engine</h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create Test
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search mock tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-xs focus:outline-none"
          />
        </div>
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
        >
          <option value="all">All Exams</option>
          {allExams.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.name} ({e.category.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 grid grid-cols-[1fr_auto] items-center gap-3 hover:bg-muted/10"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.exam_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.difficulty === "Easy"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : item.difficulty === "Medium"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {item.difficulty}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    ⏱ {item.duration} • 📝 {item.questions_count} MCQs
                  </span>
                </div>
                <div className="font-semibold mt-1.5 text-foreground truncate">{item.title}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {item.start_date && (
                    <span className="text-[10px] text-muted-foreground">
                      📅 Schedule: {new Date(item.start_date).toLocaleDateString()} to{" "}
                      {item.end_date ? new Date(item.end_date).toLocaleDateString() : "No end"}
                    </span>
                  )}
                  {item.pdf_url && (
                    <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-0.5 font-mono">
                      📄 PDF Attached
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleStatus(item)}
                  className={`px-2.5 h-6 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                    item.is_enabled
                      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  }`}
                >
                  {item.is_enabled ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {item.is_enabled ? "Enabled" : "Disabled"}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No mock tests found in database.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl animate-fade-in text-xs space-y-4"
          >
            <h3 className="font-display text-lg font-bold">
              {editingItem ? "Edit Mock Test" : "Create New Mock Test"}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Test Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. UPSC IAS General Studies Mock Exam #12"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Target Exam ID
                  </label>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    {allExams.map((e) => (
                      <option key={e.slug} value={e.slug}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Questions Count
                  </label>
                  <input
                    required
                    type="number"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Duration (Label)
                  </label>
                  <input
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 120 mins"
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Upload Question Paper PDF
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Document PDF URL"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button
                      type="button"
                      className="h-10 px-3 bg-muted border border-border rounded-lg text-xs font-semibold hover:bg-muted/80 flex items-center gap-1"
                    >
                      {uploadingPdf ? (
                        <span className="h-3.5 w-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload
                    </button>
                  </div>
                </div>
                {uploadProgress !== null && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>Uploading PDF...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {parsingPdf && (
                <div className="flex items-center gap-2 text-xs font-semibold text-primary animate-pulse py-1">
                  <span className="h-4.5 w-4.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Parsing PDF & extracting questions...</span>
                </div>
              )}

              {questionsJson && questionsJson.length > 0 && (
                <div className="bg-muted/40 border border-border p-3.5 rounded-xl max-h-[160px] overflow-y-auto space-y-2">
                  <div className="font-semibold text-xs text-primary flex items-center justify-between">
                    <span>📝 Extracted {questionsJson.length} Questions</span>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={handleOpenPreview}
                        className="text-primary hover:underline text-[10px] font-bold"
                      >
                        Verify & Edit Questions
                      </button>
                      <span className="text-muted-foreground/30">|</span>
                      <button
                        type="button"
                        onClick={() => setQuestionsJson(null)}
                        className="text-destructive hover:underline text-[10px] font-bold"
                      >
                        Clear Parsed
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-border/60 text-[10px] space-y-1">
                    {questionsJson.slice(0, 5).map((q: any, idx: number) => (
                      <div key={idx} className="pt-1.5 first:pt-0">
                        <strong className="text-foreground">Q{idx+1}:</strong> {q.q}
                        <div className="text-muted-foreground ml-3 mt-0.5">
                          Options: {q.o.join(" | ")}
                        </div>
                        {q.exp && (
                          <div className="text-primary ml-3 mt-0.5 text-[9px]">
                            Explanation: {q.exp}
                          </div>
                        )}
                      </div>
                    ))}
                    {questionsJson.length > 5 && (
                      <div className="text-muted-foreground text-center pt-2 italic border-t border-border/40">
                        + {questionsJson.length - 5} more questions...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                />
                <label
                  htmlFor="enabled"
                  className="font-semibold text-muted-foreground select-none cursor-pointer"
                >
                  Activate test immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingItem ? "Update Test" : "Create Test"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col p-6 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4 shrink-0">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Verify & Edit Extracted Questions
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Confirm or correct the questions, options, and correct answers automatically extracted from your PDF paper.
                </p>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold font-mono">
                {previewQuestions.length} Questions
              </span>
            </div>

            {/* Scrollable Questions list */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-thin min-h-0">
              {previewQuestions.map((q, idx) => (
                <div key={idx} className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3 relative">
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewQuestions((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-4 right-4 text-destructive hover:text-destructive/80 font-bold hover:underline transition"
                  >
                    Delete Question
                  </button>

                  <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-1">
                    <span>Question {idx + 1}</span>
                  </div>

                  {/* Question textarea */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                      Question Text
                    </label>
                    <textarea
                      value={q.q || ""}
                      onChange={(e) => {
                        const updated = [...previewQuestions];
                        updated[idx].q = e.target.value;
                        setPreviewQuestions(updated);
                      }}
                      rows={2}
                      className="w-full rounded-lg border border-input bg-background p-2.5 text-xs font-medium focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Options row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["A", "B", "C", "D"].map((optChar, oIdx) => (
                      <div key={oIdx}>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                          Option {optChar}
                        </label>
                        <input
                          type="text"
                          value={q.o[oIdx] || ""}
                          onChange={(e) => {
                            const updated = [...previewQuestions];
                            updated[idx].o[oIdx] = e.target.value;
                            setPreviewQuestions(updated);
                          }}
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Answer Select and Explanation */}
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                        Correct Answer
                      </label>
                      <select
                        value={q.a !== undefined && q.a !== null && q.a !== -1 ? q.a : 0}
                        onChange={(e) => {
                          const updated = [...previewQuestions];
                          updated[idx].a = parseInt(e.target.value);
                          setPreviewQuestions(updated);
                        }}
                        className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value={0}>Option A (A)</option>
                        <option value={1}>Option B (B)</option>
                        <option value={2}>Option C (C)</option>
                        <option value={3}>Option D (D)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={q.exp || ""}
                        onChange={(e) => {
                          const updated = [...previewQuestions];
                          updated[idx].exp = e.target.value;
                          setPreviewQuestions(updated);
                        }}
                        placeholder="Explain the solution to this question..."
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {previewQuestions.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  No questions parsed. Click below to add one manually.
                </div>
              )}
            </div>

            {/* Bottom Actions bar */}
            <div className="pt-4 border-t border-border mt-4 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPreviewQuestions((prev) => [
                    ...prev,
                    { q: "New Question", o: ["", "", "", ""], a: -1, exp: "" },
                  ]);
                }}
                className="h-9 px-4 border border-border hover:bg-muted font-bold rounded-xl flex items-center gap-1 cursor-pointer transition"
              >
                + Add Question Manually
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="h-9 px-4 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleSavePreview}
                  className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition shadow cursor-pointer"
                >
                  Save & Apply Questions ({previewQuestions.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: STUDY MATERIALS CMS
// ----------------------------------------------------
type DbMaterial = {
  id?: string;
  title: string;
  pdf_url: string;
  exam_id: string;
  subject: string;
  size: string;
};

function MaterialsCMS() {
  const [items, setItems] = useState<DbMaterial[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbMaterial | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [examId, setExamId] = useState("");
  const [subject, setSubject] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [size, setSize] = useState("1.5 MB");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setTitle("");
    setExamId(allExams[0]?.slug || "");
    setSubject("");
    setPdfUrl("");
    setSize("1.5 MB");
    setUploadProgress(null);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadToStorage(file, "materials", (percent) => {
        setUploadProgress(percent);
      });
      setPdfUrl(url);
      const computedSize = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      setSize(computedSize);
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUrl) {
      toast.error("Please upload a file or specify a PDF link.");
      return;
    }
    setLoading(true);
    const payload = {
      title,
      pdf_url: pdfUrl,
      exam_id: examId,
      subject,
      size,
    };

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("study_materials")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        await supabase.from("notifications").insert({
          title: `Study Material updated: ${title}.`,
          category: examId.toUpperCase(),
          description: `${title} study material for subject ${subject} has been modified.`,
          publish_date: new Date().toISOString(),
          important_links: [],
          is_pinned: false
        });
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "Study Material Updated",
          message: `Study material "${title}" for subject "${subject}" in ${examId.toUpperCase()} has been updated.`,
          type: "study_material",
          link_to: "/exams"
        });
        toast.success("Study material updated successfully!");
      } else {
        const { error } = await supabase.from("study_materials").insert(payload);
        if (error) throw error;
        await supabase.from("notifications").insert({
          title: "New Study Material has been uploaded.",
          category: examId.toUpperCase(),
          description: `${title} study material for subject ${subject} is now available.`,
          publish_date: new Date().toISOString(),
          important_links: [],
          is_pinned: false
        });
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "New Study Material Uploaded",
          message: `New study material "${title}" for subject "${subject}" in ${examId.toUpperCase()} is now available.`,
          type: "study_material",
          link_to: "/exams"
        });
        toast.success("Study material added successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study material?")) return;
    try {
      const { error } = await supabase.from("study_materials").delete().eq("id", id);
      if (error) throw error;
      toast.success("Material deleted.");
      loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const filtered = items.filter((item) => {
    return (
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.exam_id.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-5 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Study Materials</h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Material
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search by title, subject, or exam code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-xs focus:outline-none"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 grid grid-cols-[1fr_auto] items-center gap-3 hover:bg-muted/10"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    📁 {item.exam_id}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {item.subject} • {item.size}
                  </span>
                </div>
                <div className="font-semibold mt-1 text-foreground truncate">{item.title}</div>
                <a
                  href={item.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-mono mt-1 hover:underline inline-flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" /> Preview Document
                </a>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setTitle(item.title);
                    setExamId(item.exam_id);
                    setSubject(item.subject);
                    setPdfUrl(item.pdf_url);
                    setSize(item.size);
                    setModalOpen(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No study materials found in database.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl animate-fade-in text-xs space-y-4"
          >
            <h3 className="font-display text-lg font-bold">
              {editingItem ? "Edit Material" : "Add Study Material"}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Material Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Standard Reference Notes for Indian Polity"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Target Exam ID
                  </label>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    {allExams.map((e) => (
                      <option key={e.slug} value={e.slug}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Subject</label>
                  <input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Polity / Geography"
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Upload PDF Document
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Document PDF URL"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button
                      type="button"
                      className="h-10 px-3 bg-muted border border-border rounded-lg text-xs font-semibold hover:bg-muted/80 flex items-center gap-1"
                    >
                      {uploading ? (
                        <span className="h-3.5 w-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload
                    </button>
                  </div>
                </div>
                {uploadProgress !== null && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>Uploading PDF...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  disabled={loading || uploading}
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  Save Material
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: CURRENT AFFAIRS CMS
// ----------------------------------------------------
type DbAffair = {
  id?: string;
  title: string;
  content: string;
  pdf_url: string;
  image_url: string;
  category: string;
  period: string;
  publish_date: string;
};

function AffairsCMS() {
  const [items, setItems] = useState<DbAffair[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbAffair | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("UPSC");
  const [period, setPeriod] = useState("daily");
  const [publishDate, setPublishDate] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [imgProgress, setImgProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");

  const loadData = async () => {
    const { data, error } = await supabase
      .from("current_affairs")
      .select("*")
      .order("publish_date", { ascending: false });
    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setTitle("");
    setContent("");
    setCategory("UPSC");
    setPeriod("daily");
    setPublishDate(new Date().toISOString().split("T")[0]);
    setPdfUrl("");
    setImageUrl("");
    setPdfProgress(null);
    setImgProgress(null);
    setModalOpen(true);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "pdf" | "image",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "pdf") {
      setUploadingPdf(true);
      setPdfProgress(0);
    } else {
      setUploadingImg(true);
      setImgProgress(0);
    }

    try {
      const url = await uploadToStorage(
        file,
        type === "pdf" ? "affairs/pdf" : "affairs/image",
        (percent) => {
          if (type === "pdf") setPdfProgress(percent);
          else setImgProgress(percent);
        }
      );
      if (type === "pdf") setPdfUrl(url);
      else setImageUrl(url);
      toast.success(`${type.toUpperCase()} file uploaded!`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      if (type === "pdf") {
        setUploadingPdf(false);
        setPdfProgress(null);
      } else {
        setUploadingImg(false);
        setImgProgress(null);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      title,
      content,
      category,
      period,
      publish_date: new Date(publishDate).toISOString(),
      pdf_url: pdfUrl || null,
      image_url: imageUrl || null,
    };

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("current_affairs")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "Current Affairs Updated",
          message: `Current affairs article "${title}" has been updated.`,
          type: "current_affairs",
          link_to: "/exams"
        });
        toast.success("Current affair updated successfully!");
      } else {
        const { error } = await supabase.from("current_affairs").insert(payload);
        if (error) throw error;
        await supabase.from("user_notifications").insert({
          user_id: null,
          title: "New Current Affairs Published",
          message: `New current affairs article "${title}" is now available.`,
          type: "current_affairs",
          link_to: "/exams"
        });
        toast.success("Current affair published successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this current affairs entry?")) return;
    try {
      const { error } = await supabase.from("current_affairs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entry deleted.");
      loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(search.toLowerCase()));
    const matchesPeriod = periodFilter === "all" || item.period === periodFilter;
    return matchesSearch && matchesPeriod;
  });

  return (
    <div className="space-y-5 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Current Affairs CMS</h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Current Affair
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search current affairs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-xs focus:outline-none"
          />
        </div>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
        >
          <option value="all">All Periods</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 grid grid-cols-[1fr_auto] items-center gap-3 hover:bg-muted/10"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    ⚡ {item.period}
                  </span>
                  <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">
                    📁 {item.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    📅 {new Date(item.publish_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="font-semibold mt-1.5 text-foreground truncate">{item.title}</div>
                <div className="flex gap-3 text-xs mt-1.5 font-semibold text-primary">
                  {item.pdf_url && (
                    <a
                      href={item.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-0.5 font-mono"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </a>
                  )}
                  {item.image_url && (
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-0.5 font-mono"
                    >
                      <Camera className="h-3 w-3" /> Image
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setTitle(item.title);
                    setContent(item.content || "");
                    setCategory(item.category);
                    setPeriod(item.period);
                    setPublishDate(item.publish_date.split("T")[0]);
                    setPdfUrl(item.pdf_url || "");
                    setImageUrl(item.image_url || "");
                    setModalOpen(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No current affairs records found in database.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fade-in text-xs max-h-[85vh] overflow-y-auto space-y-4"
          >
            <h3 className="font-display text-lg font-bold">
              {editingItem ? "Edit Current Affair" : "Add Current Affair Entry"}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Headline Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Union Budget 2026 Key Highlights"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Periodicity
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Date</label>
                  <input
                    required
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Content / Summarized Text
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter summaries, bullet points, or articles here..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    PDF File (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="PDF URL"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-input bg-background px-2.5 text-[11px] focus:outline-none"
                    />
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, "pdf")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <button
                        type="button"
                        className="h-9 px-2 bg-muted border border-border rounded-lg text-[10px] font-semibold hover:bg-muted/80"
                      >
                        {uploadingPdf ? "..." : "Upload"}
                      </button>
                    </div>
                  </div>
                  {pdfProgress !== null && (
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                        <span>Uploading PDF...</span>
                        <span>{pdfProgress}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-150"
                          style={{ width: `${pdfProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Banner Image (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-input bg-background px-2.5 text-[11px] focus:outline-none"
                    />
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "image")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <button
                        type="button"
                        className="h-9 px-2 bg-muted border border-border rounded-lg text-[10px] font-semibold hover:bg-muted/80"
                      >
                        {uploadingImg ? "..." : "Upload"}
                      </button>
                    </div>
                  </div>
                  {imgProgress !== null && (
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                        <span>Uploading Image...</span>
                        <span>{imgProgress}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-150"
                          style={{ width: `${imgProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  disabled={loading || uploadingPdf || uploadingImg}
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  Save Entry
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: FAQ CMS
// ----------------------------------------------------
type DbFaq = {
  id?: string;
  exam_id: string;
  question: string;
  answer: string;
  category: string;
};

function FaqCMS() {
  const [items, setItems] = useState<DbFaq[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbFaq | null>(null);

  // Form State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [examId, setExamId] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");

  const loadData = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setQuestion("");
    setAnswer("");
    setExamId(allExams[0]?.slug || "");
    setCategory("General");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      exam_id: examId,
      question,
      answer,
      category,
    };

    try {
      if (editingItem?.id) {
        const { error } = await supabase.from("faqs").update(payload).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("FAQ updated successfully!");
      } else {
        const { error } = await supabase.from("faqs").insert(payload);
        if (error) throw error;
        toast.success("FAQ created successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
      toast.success("FAQ deleted.");
      loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    const matchesExam = examFilter === "all" || item.exam_id === examFilter;
    return matchesSearch && matchesExam;
  });

  return (
    <div className="space-y-5 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Frequently Asked Questions (FAQ)</h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-xs focus:outline-none"
          />
        </div>
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
        >
          <option value="all">All Exams</option>
          {allExams.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {filtered.map((item) => (
            <details key={item.id} className="group p-4 hover:bg-muted/10 transition">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      📁 {item.exam_id}
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">
                      🏷️ {item.category}
                    </span>
                  </div>
                  <div className="font-semibold mt-1 text-foreground">{item.question}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingItem(item);
                      setQuestion(item.question);
                      setAnswer(item.answer);
                      setExamId(item.exam_id);
                      setCategory(item.category);
                      setModalOpen(true);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(item.id!);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </summary>
              <div className="mt-3 p-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No FAQs found in database.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl animate-fade-in text-xs space-y-4"
          >
            <h3 className="font-display text-lg font-bold">
              {editingItem ? "Edit FAQ" : "Add FAQ Entry"}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Question</label>
                <input
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What is the minimum qualification for UPSC?"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Target Exam ID
                  </label>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    {allExams.map((e) => (
                      <option key={e.slug} value={e.slug}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    FAQ Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Eligibility">Eligibility</option>
                    <option value="Registration">Registration</option>
                    <option value="Syllabus">Syllabus</option>
                    <option value="Admit Card">Admit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Answer</label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Explain details thoroughly..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  Save FAQ
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: USERS TABLE (READ-ONLY WITH MOCK ACTIONS)
// ----------------------------------------------------
const demoUsers = [
  {
    id: "u1",
    name: "Aarthi K.",
    email: "aarthi@example.com",
    joined: "12 Jun 2026",
    status: "Active",
  },
  {
    id: "u2",
    name: "Rahul S.",
    email: "rahul@example.com",
    joined: "08 Jun 2026",
    status: "Active",
  },
  {
    id: "u3",
    name: "Meera P.",
    email: "meera@example.com",
    joined: "30 May 2026",
    status: "Inactive",
  },
  {
    id: "u4",
    name: "Vikram T.",
    email: "vikram@example.com",
    joined: "22 May 2026",
    status: "Active",
  },
];

function UsersTable() {
  const [users, setUsers] = useState<{ id: string; name: string; email: string; isSubscribed: boolean; joined: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setUsers(
          data.map((u: any) => ({
            id: u.user_id,
            name: u.name,
            email: u.email,
            isSubscribed: u.is_subscribed,
            joined: new Date(u.created_at).toLocaleDateString(),
          }))
        );
      } else if (error) {
        console.error("Failed to fetch users from database:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSubscription = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ is_subscribed: !currentStatus })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to toggle subscription in database:", error);
        toast.error("Failed to update subscription in database.");
        return;
      }
      
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isSubscribed: !currentStatus } : u
        )
      );
      toast.success("User subscription status toggled successfully!");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user subscription record?")) return;
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to delete user subscription:", error);
        toast.error("Failed to delete record.");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User subscription record removed.");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-xs sm:text-sm">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-bold">Registered Users & Subscriptions</h2>
        <button
          onClick={fetchUsers}
          className="px-3.5 py-1.5 rounded-xl border border-border bg-card font-semibold text-xs hover:bg-muted/50 transition"
        >
          Refresh List
        </button>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-xs sm:text-sm min-w-[600px]">
          <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Joined</th>
              <th className="text-left p-4">Subscription</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/10">
                <td className="p-4 font-semibold">{u.name}</td>
                <td className="p-4 text-muted-foreground font-mono">{u.email}</td>
                <td className="p-4 text-muted-foreground">{u.joined}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      u.isSubscribed
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {u.isSubscribed ? "Premium" : "Free"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleSubscription(u.id, u.isSubscribed)}
                    className="text-xs font-semibold text-primary hover:underline mr-4"
                  >
                    Toggle Subscription
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="text-xs font-semibold text-destructive hover:underline"
                  >
                    Delete Record
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No users synced in user_subscriptions table yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SECTION: LOGGED IN USERS MANAGEMENT
// ----------------------------------------------------
function LoggedInUsersCMS() {
  interface LoggedUser {
    user_id: string;
    full_name: string;
    email: string;
    profile_image: string | null;
    login_time: string;
    last_active_time: string;
    status: "Online" | "Offline";
  }

  const [loggedUsers, setLoggedUsers] = useState<LoggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Online" | "Offline">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("logged_in_users")
        .select("*")
        .order("last_active_time", { ascending: false });

      if (!error && data) {
        setLoggedUsers(data as LoggedUser[]);
      } else if (error) {
        console.error("Failed to fetch logged in users:", error);
        toast.error("Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel("logged-in-users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logged_in_users" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newUser = payload.new as LoggedUser;
            setLoggedUsers((prev) => {
              const exists = prev.some((u) => u.user_id === newUser.user_id);
              if (exists) {
                return prev.map((u) => u.user_id === newUser.user_id ? newUser : u);
              }
              return [newUser, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedUser = payload.new as LoggedUser;
            setLoggedUsers((prev) =>
              prev.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedUser = payload.old as any;
            setLoggedUsers((prev) => prev.filter((u) => u.user_id !== deletedUser.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleKickUser = async (userId: string) => {
    if (!confirm("Are you sure you want to force set this user as Offline?")) return;
    try {
      const { error } = await supabase
        .from("logged_in_users")
        .update({ status: "Offline", last_active_time: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to set user offline:", error);
        toast.error("Failed to mark user offline.");
      } else {
        toast.success("User status changed to Offline.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecord = async (userId: string) => {
    if (!confirm("Are you sure you want to completely delete this user's account? This will permanently remove their authentication credentials, profile data, and session tracking. This action cannot be undone.")) return;
    try {
      const { error: rpcError } = await supabase.rpc("delete_user_by_admin", {
        target_user_id: userId,
      });

      if (rpcError) {
        console.error("Failed to delete user via RPC:", rpcError);
        const { error: dbError } = await supabase
          .from("logged_in_users")
          .delete()
          .eq("user_id", userId);

        if (dbError) {
          console.error("Failed to delete record:", dbError);
          toast.error("Failed to delete user: " + rpcError.message);
        } else {
          toast.warning("Deleted session record, but could not delete auth account: " + rpcError.message);
          setLoggedUsers((prev) => prev.filter((u) => u.user_id !== userId));
        }
      } else {
        toast.success("User account and all related data deleted successfully.");
        setLoggedUsers((prev) => prev.filter((u) => u.user_id !== userId));
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred: " + err.message);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 15) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatAbsoluteTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredUsers = loggedUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === "All" ? true : u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = loggedUsers.length;
  const onlineCount = loggedUsers.filter((u) => u.status === "Online").length;
  const offlineCount = loggedUsers.filter((u) => u.status === "Offline").length;

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6 text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Logged In Users</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Monitor and manage currently authenticated user sessions in real-time.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-border bg-card font-semibold text-xs hover:bg-muted/50 transition cursor-pointer"
        >
          Refresh List
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-semibold">Total Sessions</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{totalCount}</p>
          </div>
          <div className="p-3 bg-muted rounded-xl text-foreground">
            <UsersIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-sm flex items-center justify-between transition hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500/80 font-semibold">Currently Online</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">{onlineCount}</p>
              {onlineCount > 0 && (
                <span className="relative flex h-2 w-2 mb-1 sm:mb-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between transition hover:shadow-md relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-semibold">Currently Offline</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-muted-foreground">{offlineCount}</p>
          </div>
          <div className="p-3 bg-muted rounded-xl text-muted-foreground">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 hover:bg-muted/70 focus:bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="flex bg-muted/60 p-1 rounded-xl w-full md:w-auto">
          {(["All", "Online", "Offline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="h-10 bg-muted/30 border-b border-border animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-border last:border-0 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="h-10 w-10 bg-muted rounded-full shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/6" />
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-x-auto shadow-sm">
            <table className="w-full min-w-[750px]">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">
                <tr>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Login Time</th>
                  <th className="text-left p-4">Last Active</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                          {u.profile_image ? (
                            <img
                              src={u.profile_image}
                              alt={u.full_name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="font-bold text-xs uppercase text-primary">
                              {getInitials(u.full_name)}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-foreground">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-xs">{u.email}</td>
                    <td className="p-4 text-muted-foreground">{formatAbsoluteTime(u.login_time)}</td>
                    <td className="p-4 text-muted-foreground font-medium">{formatRelativeTime(u.last_active_time)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          u.status === "Online"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.status === "Online"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-red-500"
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      {u.status === "Online" && (
                        <button
                          onClick={() => handleKickUser(u.user_id)}
                          className="text-xs font-semibold text-primary hover:text-primary/80 transition hover:underline cursor-pointer"
                        >
                          Mark Offline
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(u.user_id)}
                        className="text-xs font-semibold text-destructive hover:text-destructive/80 transition hover:underline cursor-pointer"
                      >
                        Delete Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginatedUsers.map((u) => (
              <div
                key={u.user_id}
                className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3 hover:shadow transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {u.profile_image ? (
                      <img
                        src={u.profile_image}
                        alt={u.full_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="font-bold text-xs uppercase text-primary">
                        {getInitials(u.full_name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{u.full_name}</p>
                    <p className="text-muted-foreground font-mono text-[11px] truncate">{u.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      u.status === "Online"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        u.status === "Online"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    />
                    {u.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border">
                  <div>
                    <span className="text-muted-foreground block uppercase text-[9px] font-bold tracking-wider">Login Time</span>
                    <span className="text-foreground">{formatAbsoluteTime(u.login_time)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block uppercase text-[9px] font-bold tracking-wider">Last Active</span>
                    <span className="text-foreground font-medium">{formatRelativeTime(u.last_active_time)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  {u.status === "Online" && (
                    <button
                      onClick={() => handleKickUser(u.user_id)}
                      className="px-2.5 py-1.5 rounded-lg border border-border font-semibold text-xs hover:bg-muted/50 text-foreground transition cursor-pointer"
                    >
                      Mark Offline
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRecord(u.user_id)}
                    className="px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-semibold text-xs hover:bg-destructive/20 transition cursor-pointer"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
              <UsersIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground text-sm">No matching sessions found</p>
              <p className="text-muted-foreground text-xs mt-1">
                Try adjusting your search criteria or filter.
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm text-xs">
              <span className="text-muted-foreground font-medium">
                Page <span className="font-bold text-foreground">{currentPage}</span> of{" "}
                <span className="font-bold text-foreground">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border font-semibold disabled:opacity-40 hover:bg-muted/50 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-border font-semibold disabled:opacity-40 hover:bg-muted/50 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: MY PROFILE
// ----------------------------------------------------
function AdminProfileSection() {
  const { user, updateAdminProfile, updateAvatar } = useAuth();

  const [profileName, setProfileName] = useState(user?.name || "Kalaiarasan E");
  const [profileEmail, setProfileEmail] = useState(user?.email || "kalaiarasane28@gmail.com");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "+91 93455 06257");
  const [profileLocation, setProfileLocation] = useState(user?.location || "Tamil Nadu, India");

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file format. Please upload JPG, JPEG, PNG, or WebP images.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    if (!user) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      setUploadProgress(30);

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setUploadProgress(90);

      await updateAvatar(publicUrl);
      
      setUploadProgress(100);
      toast.success("Profile photo uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Failed to upload profile photo: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setUploading(true);
    try {
      await updateAvatar(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile({
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      location: profileLocation,
    });
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPass !== confPass) {
      toast.error("Passwords do not match.");
      return;
    }

    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setOldPass("");
      setNewPass("");
      setConfPass("");
      toast.success("Password updated successfully in Supabase!");
    } catch (err: any) {
      toast.error(`Password update failed: ${err.message}`);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm animate-fade-in">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
          Settings
        </div>
        <h1 className="font-display text-3xl font-bold">My Profile</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Avatar Card */}
        <div className="md:col-span-1 rounded-2xl border border-border bg-card p-6 text-center shadow-sm relative overflow-hidden">
          <div 
            onClick={handleUploadClick}
            className="relative mx-auto h-28 w-28 rounded-full overflow-hidden border-4 border-primary bg-muted shadow-[0_0_20px_rgba(56,189,248,0.2)] flex items-center justify-center cursor-pointer group"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                className="h-full w-full object-cover rounded-full"
                alt="Admin Avatar"
              />
            ) : (
              <span className="font-bold text-3xl uppercase text-primary">
                {getInitials(user?.name || "Super Admin")}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition duration-200">
              <Camera className="h-6 w-6 text-white" />
              <span className="text-[10px] text-white font-bold mt-1">Upload Photo</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[10px] font-bold mt-1">{uploadProgress}%</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />
          {user?.avatar && (
            <button
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="mt-2 text-xs font-semibold text-destructive hover:underline cursor-pointer"
            >
              Remove Photo
            </button>
          )}
          <h2 className="font-display text-lg font-bold mt-4">{user?.name || "Super Admin"}</h2>
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mt-1 bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
            Super Admin
          </p>

          <div className="mt-6 border-t border-border pt-4 text-xs text-left space-y-3 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{user?.email || "kalaiarasane28@gmail.com"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>{user?.phone || "+91 93455 06257"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{user?.location || "Tamil Nadu, India"}</span>
            </div>
          </div>
        </div>

        {/* Form and Change Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-5">
              Edit Profile Details
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    Phone Number
                  </label>
                  <input
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    Location
                  </label>
                  <input
                    required
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="h-10 px-5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
              >
                Save Changes
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-5">
              Change Password
            </h3>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1.5">
                  Current Password
                </label>
                <input
                  required
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    New Password
                  </label>
                  <input
                    required
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    required
                    type="password"
                    value={confPass}
                    onChange={(e) => setConfPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                disabled={passLoading}
                type="submit"
                className="h-10 px-5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {passLoading && (
                  <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                )}
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SECTION: EXAM CATEGORY IMAGES CMS
// ----------------------------------------------------
function CategoryImagesCMS() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  const categoriesList = [
    { slug: "upsc", name: "UPSC", default: "/upsc_banner.jpg" },
    { slug: "ssc", name: "SSC", default: "/ssc_banner.jpg" },
    { slug: "rrb", name: "RRB", default: "/railways_banner.jpg" },
    { slug: "ibps", name: "IBPS", default: "/banking_banner.jpg" },
    { slug: "sbi", name: "SBI", default: "/banking_banner.jpg" },
    { slug: "tnpsc", name: "TNPSC", default: "/tnpsc_banner.jpg" },
    { slug: "defence", name: "Defence", default: "/hero_background.jpg" },
  ];

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_details")
        .select("*")
        .like("exam_key", "category_image:%");
      if (!error && data) {
        const mapping: Record<string, string> = {};
        data.forEach((row: any) => {
          const catSlug = row.exam_key.replace("category_image:", "");
          mapping[catSlug] = row.official_website_url;
        });
        setImages(mapping);
      }
    } catch (err) {
      console.warn("Failed to load category images:", err);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slug: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed formats validation
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Allowed formats: JPG, JPEG, PNG, WEBP");
      return;
    }

    // Size limit validation: 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Maximum file size allowed is 5 MB");
      return;
    }

    setSelectedFiles(prev => ({ ...prev, [slug]: file }));
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [slug]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (slug: string) => {
    const file = selectedFiles[slug];
    if (!file) return;

    setUploading(prev => ({ ...prev, [slug]: true }));
    try {
      // Upload to supabase storage bucket "resources" in folder "category_images"
      const url = await uploadToStorage(file, "category_images");
      
      // Save to database
      const { error } = await supabase
        .from("exam_details")
        .upsert({
          exam_key: `category_image:${slug}`,
          official_website_url: url
        });

      if (error) throw error;

      setImages(prev => ({ ...prev, [slug]: url }));
      // Clean preview and file selection
      setPreviews(prev => {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      });
      setSelectedFiles(prev => {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      });

      setImageTimestamp(Date.now());
      toast.success(`${slug.toUpperCase()} category image saved successfully!`);
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [slug]: false }));
    }
  };

  const handleReset = async (slug: string) => {
    try {
      const { error } = await supabase
        .from("exam_details")
        .delete()
        .eq("exam_key", `category_image:${slug}`);

      if (error) throw error;

      setImages(prev => {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      });
      setPreviews(prev => {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      });
      setSelectedFiles(prev => {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      });

      setImageTimestamp(Date.now());
      toast.success(`${slug.toUpperCase()} image reset to default.`);
    } catch (err: any) {
      toast.error(`Reset failed: ${err.message}`);
    }
  };

  const getActiveUrl = (slug: string, defaultVal: string) => {
    if (previews[slug]) return previews[slug];
    if (images[slug]) {
      return images[slug].includes('?') ? `${images[slug]}&t=${imageTimestamp}` : `${images[slug]}?t=${imageTimestamp}`;
    }
    return defaultVal;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
          Asset Management
        </div>
        <h2 className="font-display text-2xl font-bold">Exam Category Images</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          Customize the card backgrounds displayed in the Exam Categories section on the homepage. Changes take effect immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoriesList.map((cat) => {
          const hasPreview = !!previews[cat.slug];
          const hasCustom = !!images[cat.slug];
          const isUploading = uploading[cat.slug] || false;
          const displayUrl = getActiveUrl(cat.slug, cat.default);

          return (
            <div key={cat.slug} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <span className="font-display text-sm font-bold">{cat.name} Category Card</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${hasCustom ? "bg-primary/8 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {hasCustom ? "Custom Active" : "Default Graphic"}
                  </span>
                </div>

                <div className="h-44 rounded-xl overflow-hidden border border-border bg-muted relative group">
                  <img
                    src={displayUrl}
                    alt={`${cat.name} Background`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="font-display text-lg font-bold">{cat.name} Category</div>
                    <div className="text-[10px] text-white/80">Preview Banner Background</div>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => handleFileChange(e, cat.slug)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button
                      type="button"
                      className="w-full h-9 bg-muted border border-border rounded-lg text-xs font-semibold hover:bg-muted/80 flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Select Image
                    </button>
                  </div>
                  {hasPreview && (
                    <button
                      type="button"
                      onClick={() => handleSave(cat.slug)}
                      disabled={isUploading}
                      className="h-9 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                  )}
                  {(hasCustom || hasPreview) && (
                    <button
                      type="button"
                      onClick={() => handleReset(cat.slug)}
                      className="h-9 px-4 bg-destructive/10 text-destructive text-xs font-semibold rounded-lg hover:bg-destructive/15 flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset to Default
                    </button>
                  )}
                </div>
                {hasPreview && (
                  <div className="text-[10px] text-amber-600 font-medium">
                    ⚠️ Preview active. Click "Save" to save this background permanently.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SECTION: PAYMENT VERIFICATION REQUESTS CMS
// ----------------------------------------------------
type DbPaymentRequest = {
  id: string;
  user_id: string;
  email: string;
  plan_type: "monthly" | "yearly";
  amount: number;
  transaction_id: string;
  payment_method: string;
  screenshot_url: string;
  payment_status: "pending" | "approved" | "rejected";
  admin_remark: string | null;
  created_at: string;
  verified_at: string | null;
  verified_by?: string | null;
};

function PaymentsCMS() {
  const { user: currentAdmin } = useAuth();
  const [requests, setRequests] = useState<DbPaymentRequest[]>([]);
  const [usersList, setUsersList] = useState<Record<string, string>>({});
  const [examList, setExamList] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Modals
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rejectingRequest, setRejectingRequest] = useState<DbPaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load users to map names
      const { data: usersData } = await supabase.from("users").select("id, full_name");
      const userMap: Record<string, string> = {};
      if (usersData) {
        usersData.forEach((u) => {
          userMap[u.id] = u.full_name;
        });
      }
      setUsersList(userMap);

      // 2. Load roadmap progress to map selected exams
      const { data: progressData } = await supabase.from("roadmap_progress").select("user_id, exam_id");
      const examMap: Record<string, string> = {};
      if (progressData) {
        progressData.forEach((p) => {
          examMap[p.user_id] = p.exam_id.toUpperCase();
        });
      }
      setExamList(examMap);

      // 3. Load payment requests
      const { data: reqs, error } = await supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(reqs || []);

      // 4. Calculate statistics
      let pending = 0;
      let approved = 0;
      let rejected = 0;
      let monthlyRev = 0;
      let yearlyRev = 0;

      if (reqs) {
        reqs.forEach((r) => {
          if (r.payment_status === "pending") pending++;
          else if (r.payment_status === "approved") {
            approved++;
            const amt = Number(r.amount) || 0;
            if (r.plan_type === "monthly") {
              monthlyRev += amt;
            } else if (r.plan_type === "yearly") {
              yearlyRev += amt;
            }
          } else if (r.payment_status === "rejected") rejected++;
        });
      }

      // 5. Load Active Subscribers count from user_subscriptions
      const { count: activeSub } = await supabase
        .from("user_subscriptions")
        .select("user_id", { count: "exact", head: true })
        .eq("is_subscribed", true);

      setStats({
        pending,
        approved,
        rejected,
        activeSubscribers: activeSub || 0,
        monthlyRevenue: monthlyRev,
        yearlyRevenue: yearlyRev,
      });
    } catch (err: any) {
      toast.error("Failed to load payment requests: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Supabase Realtime Listener
    const channel = supabase
      .channel("admin_payments_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_requests" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (req: DbPaymentRequest) => {
    if (savingAction) return;
    setSavingAction(true);
    toast.info("Approving payment request...");

    try {
      const now = new Date();
      const expiry = new Date();
      if (req.plan_type === "yearly") {
        expiry.setDate(now.getDate() + 365);
      } else {
        expiry.setDate(now.getDate() + 30);
      }

      // 1. Update payment_requests status
      const { error: reqError } = await supabase
        .from("payment_requests")
        .update({
          payment_status: "approved",
          verified_at: now.toISOString(),
          verified_by: currentAdmin?.email || "admin",
          admin_remark: "Payment approved by Admin"
        })
        .eq("id", req.id);

      if (reqError) throw reqError;

      // 2. Create/Update user subscription
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: req.user_id,
          email: req.email,
          name: usersList[req.user_id] || "Aspirant",
          is_subscribed: true,
          payment_status: "approved",
          plan_type: req.plan_type,
          amount: req.amount,
          transaction_id: req.transaction_id,
          payment_method: req.payment_method,
          start_date: now.toISOString(),
          expiry_date: expiry.toISOString(),
          admin_remark: null,
          updated_at: now.toISOString()
        });

      if (subError) throw subError;

      // 3. Create user notification on approval
      await supabase.from("user_notifications").insert({
        user_id: req.user_id,
        title: "Premium Activated",
        message: "🎉 Congratulations! Your CrackSpark Premium Subscription has been activated successfully.",
        type: "premium_activated",
        link_to: "/dashboard"
      });

      // Log mock email notification
      console.log(`[Email Mock] Sending premium subscription confirmation email to: ${req.email}`);

      toast.success("Subscription approved and activated successfully!");
      loadData();
    } catch (err: any) {
      toast.error("Failed to approve payment: " + err.message);
    } finally {
      setSavingAction(false);
    }
  };

  const handleOpenReject = (req: DbPaymentRequest) => {
    setRejectingRequest(req);
    setRejectionReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest || savingAction) return;
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }

    setSavingAction(true);
    toast.info("Rejecting payment request...");

    try {
      const now = new Date();

      // 1. Update payment_requests status
      const { error: reqError } = await supabase
        .from("payment_requests")
        .update({
          payment_status: "rejected",
          verified_at: now.toISOString(),
          verified_by: currentAdmin?.email || "admin",
          admin_remark: rejectionReason.trim()
        })
        .eq("id", rejectingRequest.id);

      if (reqError) throw reqError;

      // 2. Update user subscription status to rejected
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .update({
          payment_status: "rejected",
          is_subscribed: false,
          admin_remark: rejectionReason.trim(),
          updated_at: now.toISOString()
        })
        .eq("user_id", rejectingRequest.user_id);

      if (subError) throw subError;

      // 3. Create user notification on rejection
      await supabase.from("user_notifications").insert({
        user_id: rejectingRequest.user_id,
        title: "Premium Rejected",
        message: "❌ Your payment verification was rejected. Please check the admin remarks and submit a new payment screenshot.",
        type: "premium_rejected",
        link_to: "/subscription"
      });

      // Log mock email notification
      console.log(`[Email Mock] Sending rejection email to ${rejectingRequest.email}. Reason: ${rejectionReason}`);

      toast.success("Payment verification request rejected.");
      setRejectingRequest(null);
      setRejectionReason("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to reject payment: " + err.message);
    } finally {
      setSavingAction(false);
    }
  };

  const handleCancelPremium = async (req: DbPaymentRequest) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this user's Premium subscription?");
    if (!confirmCancel) return;

    if (savingAction) return;
    setSavingAction(true);
    toast.info("Cancelling premium subscription...");

    try {
      const now = new Date();

      // 1. Update payment_requests status to rejected
      const { error: reqError } = await supabase
        .from("payment_requests")
        .update({
          payment_status: "rejected",
          verified_at: now.toISOString(),
          verified_by: currentAdmin?.email || "admin",
          admin_remark: "Subscription cancelled by Admin"
        })
        .eq("id", req.id);

      if (reqError) throw reqError;

      // 2. Update user_subscriptions status to inactive/rejected
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .update({
          payment_status: "rejected",
          is_subscribed: false,
          admin_remark: "Subscription cancelled by Admin",
          updated_at: now.toISOString()
        })
        .eq("user_id", req.user_id);

      if (subError) throw subError;

      // 3. Create user-specific cancellation notification
      await supabase.from("user_notifications").insert({
        user_id: req.user_id,
        title: "Subscription Cancelled",
        message: "Your Premium subscription has been cancelled by the administrator.",
        type: "premium_cancelled",
        link_to: "/subscription"
      });

      toast.success("Premium subscription has been cancelled successfully.");
      loadData();
    } catch (err: any) {
      toast.error("Failed to cancel subscription: " + err.message);
    } finally {
      setSavingAction(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const term = search.toLowerCase();
    const name = (usersList[r.user_id] || "").toLowerCase();
    return (
      r.email.toLowerCase().includes(term) ||
      r.transaction_id.toLowerCase().includes(term) ||
      r.payment_method.toLowerCase().includes(term) ||
      name.includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
            Subscription Control Panel
          </div>
          <h2 className="font-display text-2xl font-bold">Payment Verification Requests</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Review, approve, or reject pending premium subscription payment verification requests from users.
          </p>
        </div>
      </div>

      {/* SUMMARY STATISTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Pending Requests</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Clock className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold font-display">{stats.pending}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Approved Payments</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold font-display">{stats.approved}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Rejected Payments</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
              <XCircle className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold font-display">{stats.rejected}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Subscribers</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
              <UsersIcon className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold font-display">{stats.activeSubscribers}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Revenue</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
              <TrendingUp className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold font-display">₹{stats.monthlyRevenue}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Yearly Revenue</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
              <TrendingUp className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold font-display">₹{stats.yearlyRevenue}</span>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="flex items-center gap-3 bg-card border border-border px-3.5 py-2.5 rounded-2xl max-w-md shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by email, name, transaction ID, method..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 outline-none text-xs w-full placeholder:text-muted-foreground"
        />
      </div>

      {/* TABLE PANEL */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full divide-y divide-border text-left text-xs">
            <thead className="bg-muted/50 font-bold text-muted-foreground select-none">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Exam</th>
                <th className="px-5 py-3.5">Plan Details</th>
                <th className="px-5 py-3.5">Transaction Info</th>
                <th className="px-5 py-3.5">Screenshot</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredRequests.map((req) => {
                const userName = usersList[req.user_id] || "Aspirant";
                const selectedExam = examList[req.user_id] || "NONE";

                return (
                  <tr key={req.id} className="hover:bg-muted/20 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground">{userName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{req.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded bg-muted text-[10px] font-bold text-foreground">
                        {selectedExam}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="capitalize font-bold text-foreground">{req.plan_type}</div>
                      <div className="text-[10px] text-muted-foreground">₹{req.amount}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-foreground">{req.transaction_id}</div>
                      <div className="text-[10px] text-muted-foreground">{req.payment_method}</div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelectedScreenshot(req.screenshot_url);
                          setZoomLevel(1);
                        }}
                        className="flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline transition font-bold font-sans"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.payment_status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : req.payment_status === "rejected"
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-amber-500/10 text-amber-600 animate-pulse"
                        }`}
                      >
                        {req.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {req.payment_status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={savingAction}
                            className="p-1.5 rounded-lg border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 transition cursor-pointer"
                            title="Approve Request"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReject(req)}
                            disabled={savingAction}
                            className="p-1.5 rounded-lg border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Reject Request"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : req.payment_status === "approved" ? (
                        <button
                          onClick={() => handleCancelPremium(req)}
                          disabled={savingAction}
                          className="px-2 py-1 rounded-lg border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                          title="Cancel Premium"
                        >
                          <Ban className="h-3 w-3" /> Cancel Premium
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Cancelled/Rejected</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    {loading ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading payment requests...
                      </div>
                    ) : (
                      "No payment verification requests found."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Reject Payment Verification</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Provide a reason for rejecting the payment request from <strong>{rejectingRequest.email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Rejection Remark
              </label>
              <textarea
                rows={3}
                required
                placeholder="Example: Transaction UTR matches no records, or payment receipt belongs to another user..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="h-9 px-4 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={savingAction}
                className="h-9 px-4 rounded-xl bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/95 transition shadow cursor-pointer text-xs flex items-center gap-1"
              >
                {savingAction && <Loader2 className="h-3 w-3 animate-spin" />}
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT LIGHTBOX MODAL WITH ZOOM */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex flex-col justify-between p-4 text-white">
          <div className="flex items-center justify-between shrink-0 pb-3 border-b border-white/10 w-full max-w-4xl mx-auto">
            <span className="text-xs font-semibold">Payment Screenshot Preview</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                title="Zoom Out"
              >
                Zoom -
              </button>
              <span className="text-xs font-mono font-bold select-none">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                title="Zoom In"
              >
                Zoom +
              </button>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
                title="Close"
              >
                Close ✕
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 w-full overflow-auto flex items-center justify-center py-4">
            <img
              src={selectedScreenshot}
              alt="Uploaded Receipt"
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/5 transition-transform duration-200 ease-out"
            />
          </div>

          <div className="text-white/60 text-[10px] text-center w-full max-w-4xl mx-auto pt-2 border-t border-white/10">
            Use the Zoom buttons above to inspect the receipt details, timestamp, amount and sender names. Click Close or tap ✕ to exit.
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SECTION: EXAM COUNTDOWNS CMS
// ----------------------------------------------------
type DbCountdown = {
  id?: string;
  exam_name: string;
  exam_category: string;
  exam_datetime: string;
  badge?: string;
  color: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

function CountdownsCMS() {
  const [items, setItems] = useState<DbCountdown[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbCountdown | null>(null);

  // Form states
  const [examName, setExamName] = useState("");
  const [examCategory, setExamCategory] = useState("upsc");
  const [examDatetime, setExamDatetime] = useState("");
  const [badge, setBadge] = useState("");
  const [color, setColor] = useState("#d4af37");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const { data, error } = await supabase
      .from("exam_countdowns")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates on countdowns table
    const channel = supabase
      .channel("admin_countdowns_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_countdowns" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setExamName("");
    setExamCategory("upsc");
    setExamDatetime("");
    setBadge("");
    setColor("#d4af37");
    setDisplayOrder(0);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: DbCountdown) => {
    setEditingItem(c);
    setExamName(c.exam_name);
    setExamCategory(c.exam_category);
    const dt = new Date(c.exam_datetime);
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
    setExamDatetime(localISOTime);
    setBadge(c.badge || "");
    setColor(c.color);
    setDisplayOrder(c.display_order);
    setIsActive(c.is_active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDatetime) {
      toast.error("Please fill in the exam name and datetime.");
      return;
    }

    setLoading(true);
    const payload = {
      exam_name: examName.trim(),
      exam_category: examCategory,
      exam_datetime: new Date(examDatetime).toISOString(),
      badge: badge.trim() || null,
      color,
      display_order: Number(displayOrder),
      is_active: isActive,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("exam_countdowns")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Countdown ticker updated successfully!");
      } else {
        const { error } = await supabase.from("exam_countdowns").insert(payload);
        if (error) throw error;
        toast.success("Countdown ticker added successfully!");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this countdown ticker?")) return;
    try {
      const { error } = await supabase.from("exam_countdowns").delete().eq("id", id);
      if (error) throw error;
      toast.success("Countdown ticker deleted.");
      loadData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleActive = async (item: DbCountdown) => {
    try {
      const { error } = await supabase
        .from("exam_countdowns")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(`Countdown ticker ${item.is_active ? "Disabled" : "Enabled"} successfully!`);
      loadData();
    } catch (err: any) {
      toast.error(`Status update failed: ${err.message}`);
    }
  };

  const filtered = items.filter((item) => {
    return (
      item.exam_name.toLowerCase().includes(search.toLowerCase()) ||
      item.exam_category.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">
            Home Tickers Config
          </div>
          <h2 className="font-display text-2xl font-bold">Exam Countdown Manager</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Configure real-time live countdown tickers visible to users on the home landing page.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/95 transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Countdown
        </button>
      </div>

      <div className="flex items-center gap-3 bg-card border border-border px-3.5 py-2.5 rounded-2xl max-w-md shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search by exam name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 outline-none text-xs w-full placeholder:text-muted-foreground"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {filtered.map((item) => {
            const hasStarted = new Date(item.exam_datetime).getTime() <= Date.now();
            return (
              <div
                key={item.id}
                className="p-4 grid grid-cols-[1fr_auto] items-center gap-3 hover:bg-muted/10"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                      style={{ 
                        backgroundColor: `${item.color}15`, 
                        color: item.color, 
                        borderColor: `${item.color}30` 
                      }}
                    >
                      📁 {item.exam_category.toUpperCase()}
                    </span>
                    {item.badge && (
                      <span className="bg-muted px-2 py-0.5 rounded text-[9px] font-bold text-muted-foreground uppercase">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      📅 {new Date(item.exam_datetime).toLocaleString()}
                    </span>
                    {hasStarted && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-bold">
                        Exam Started
                      </span>
                    )}
                  </div>
                  <div className="font-semibold mt-1.5 text-foreground truncate">{item.exam_name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Display Order: <strong>{item.display_order}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`px-2.5 h-6 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      item.is_active
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id!)}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No exam countdown tickers found.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-card border border-border rounded-3xl w-full max-w-md p-6 shadow-xl animate-fade-in text-xs space-y-4"
          >
            <h3 className="font-display text-lg font-bold">
              {editingItem ? "Edit Countdown Ticker" : "Create New Countdown Ticker"}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Exam Name</label>
                <input
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. UPSC IAS Prelims"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3.5 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Category</label>
                  <select
                    value={examCategory}
                    onChange={(e) => setExamCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none capitalize"
                  >
                    {allExams.map((e) => (
                      <option key={e.slug} value={e.slug}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Exam Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={examDatetime}
                    onChange={(e) => setExamDatetime(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Badge (Optional)</label>
                  <input
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. HIGH PREP, TRENDING"
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Card Color Theme</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 border border-input rounded-lg overflow-hidden bg-background cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#d4af37"
                      className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                  />
                  <label
                    htmlFor="isActive"
                    className="font-semibold text-muted-foreground select-none cursor-pointer"
                  >
                    Ticker Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingItem ? "Update Ticker" : "Create Ticker"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

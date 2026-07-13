import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Trophy,
  Activity,
  Award,
  Zap,
  Play,
  Download,
  Calendar,
  User as UserIcon,
  BookOpen,
  MessageSquare,
  Send,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Brain,
  BellRing,
  Target,
  Camera,
  Upload,
  Loader2,
  Star,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "User Dashboard — CrackSpark" }] }),
  component: UserDashboard,
});

// Mock Initial data for Dashboard modules
const initialBadges = [
  { id: "b1", title: "Early Bird", desc: "Started prep before 7 AM", icon: Clock, earned: true },
  { id: "b2", title: "Streak Master", desc: "Maintained a 7-day streak", icon: Zap, earned: true },
  {
    id: "b3",
    title: "Mock Champion",
    desc: "Scored >90% in a mock test",
    icon: Trophy,
    earned: false,
  },
  { id: "b4", title: "AI Scholar", desc: "Generated 3 AI Study Plans", icon: Brain, earned: true },
];

const initialLeaderboard = [
  { rank: 1, name: "Amit Sharma", score: 985, streak: 32 },
  { rank: 2, name: "Priyanjali S.", score: 960, streak: 18 },
  { rank: 3, name: "Karthik R.", score: 942, streak: 25 },
  { rank: 4, name: "Aarthi K. (You)", score: 890, streak: 12 },
  { rank: 5, name: "Vikram Teja", score: 875, streak: 7 },
];

const mockQuizQuestions = [
  {
    q: "Which Indian state shares the longest border with Bhutan?",
    options: ["Assam", "Arunachal Pradesh", "West Bengal", "Sikkim"],
    answer: 0,
    exp: "Assam shares the longest border with Bhutan (267 km), followed by Arunachal Pradesh (217 km).",
  },
  {
    q: "Under which Article of the Constitution can the President declare a Financial Emergency?",
    options: ["Article 352", "Article 356", "Article 360", "Article 368"],
    answer: 2,
    exp: "Article 360 authorizes the President to declare a financial emergency if the financial stability of India is threatened.",
  },
  {
    q: "The term 'double fault' is associated with which of the following sports?",
    options: ["Tennis", "Badminton", "Squash", "Table Tennis"],
    answer: 0,
    exp: "Double fault occurs in Tennis when a player serves twice consecutively into the net or outside the service box.",
  },
  {
    q: "Which organization releases the World Economic Outlook report?",
    options: ["World Bank", "IMF", "WEF", "WTO"],
    answer: 1,
    exp: "The World Economic Outlook (WEO) is a survey conducted and published twice a year by the International Monetary Fund (IMF).",
  },
  {
    q: "Who was the first governor general of independent India?",
    options: ["Warren Hastings", "Lord Mountbatten", "C. Rajagopalachari", "Dr. Rajendra Prasad"],
    answer: 1,
    exp: "Lord Mountbatten was the first Governor-General of independent India. C. Rajagopalachari was the first and last Indian Governor-General.",
  },
];

const mockCurrentAffairsQuiz = [
  {
    q: "Which city topped the Mercer's 2026 Quality of Living Survey?",
    options: ["Vienna", "Zurich", "Auckland", "Geneva"],
    answer: 0,
    exp: "Vienna secured the top spot once again in the Quality of Living Index for 2026.",
  },
  {
    q: "Who has been appointed as the new Chairperson of SEBI in June 2026?",
    options: ["Madhabi Puri Buch", "R. K. Gupta", "Ananth Narayan", "K. V. Kamath"],
    answer: 0,
    exp: "Madhabi Puri Buch continues her tenure steering crucial SEBI market reforms.",
  },
];

function UserDashboard() {
  const { user, loading, updateAvatar, isSubscribed, subscriptionDetails } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/user-login",
        search: {
          redirect: location.pathname,
          message: "Please login to continue.",
        },
      });
    }
  }, [user, loading, navigate, location]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "roadmap" | "mocks" | "affairs" | "ai" | "forum" | "calendar" | "profile" | "reviews"
  >("overview");

  // 1. STREAK & LOG STUDY HOURS STATE
  const [streakCount, setStreakCount] = useState(12);
  const [studyHoursLog, setStudyHoursLog] = useState<Record<string, number>>({
    Mon: 6.5,
    Tue: 7.0,
    Wed: 8.0,
    Thu: 5.5,
    Fri: 6.0,
    Sat: 4.5,
    Sun: 0,
  });
  const [newLogDay, setNewLogDay] = useState("Sun");
  const [newLogHours, setNewLogHours] = useState("6");

  const totalStudyHoursThisWeek = useMemo(() => {
    return Object.values(studyHoursLog).reduce((acc, h) => acc + h, 0);
  }, [studyHoursLog]);

  const handleAddHours = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(newLogHours);
    if (isNaN(hrs) || hrs < 0 || hrs > 24) {
      toast.error("Please enter a valid study hour amount (0-24).");
      return;
    }
    setStudyHoursLog((prev) => ({ ...prev, [newLogDay]: hrs }));
    toast.success(`Logged ${hrs} hours of study for ${newLogDay}!`);
  };

  // 2. TIMELINE ROADMAP STAGES STATE
  const [roadmapStages, setRoadmapStages] = useState([
    {
      id: 1,
      stage: "Understand Syllabus",
      completed: true,
      desc: "Go through exam notification & mark weightage.",
    },
    {
      id: 2,
      stage: "Create Study Plan",
      completed: true,
      desc: "Set up week-by-week calendar goals.",
    },
    {
      id: 3,
      stage: "Learn Concepts",
      completed: false,
      desc: "Study core quantitative, reasoning, and GS topics.",
    },
    {
      id: 4,
      stage: "Practice Questions",
      completed: false,
      desc: "Attempt topic-wise quizzes & chapter-end exercises.",
    },
    {
      id: 5,
      stage: "Solve Previous Year Papers",
      completed: false,
      desc: "Solve at least 5 years of original papers.",
    },
    {
      id: 6,
      stage: "Attend Mock Tests",
      completed: false,
      desc: "Attempt 10 full-length timed mock tests.",
    },
    {
      id: 7,
      stage: "Revision",
      completed: false,
      desc: "Revise high-yield shortcuts & GS capsules.",
    },
    {
      id: 8,
      stage: "Final Exam Preparation",
      completed: false,
      desc: "Calm revision and exam center strategy.",
    },
  ]);

  const roadmapCompletionPercent = useMemo(() => {
    const done = roadmapStages.filter((s) => s.completed).length;
    return Math.round((done / roadmapStages.length) * 100);
  }, [roadmapStages]);

  const toggleStage = (id: number) => {
    setRoadmapStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    );
    toast.success("Study roadmap updated!");
  };

  // AI STUDY PLANNER GENERATION STATE
  const [aiPlannerTargetExam, setAiPlannerTargetExam] = useState("UPSC IAS");
  const [aiPlannerTargetWeeks, setAiPlannerTargetWeeks] = useState("12");
  const [generatedPlanner, setGeneratedPlanner] = useState<string | null>(null);
  const [generatingPlanner, setGeneratingPlanner] = useState(false);

  const generateAIPlan = () => {
    setGeneratingPlanner(true);
    setGeneratedPlanner(null);
    setTimeout(() => {
      setGeneratedPlanner(
        `### AI Custom Roadmap: ${aiPlannerTargetExam} (${aiPlannerTargetWeeks} Weeks Planner)\n\n` +
          `*   **Phase 1 (Week 1-3): Basics & Foundation**\n` +
          `    Focus heavily on NCERTs and high-weightage chapters. Spend 3 hours/day on Core subjects, 1 hour on daily news.\n` +
          `*   **Phase 2 (Week 4-7): High-Yield Syllabus Coverage**\n` +
          `    Dive into Quantitative Aptitude, Logical Reasoning, and General Studies. Complete weekly sectional tests with >75% accuracy.\n` +
          `*   **Phase 3 (Week 8-10): Intense Mock Practice & Analysis**\n` +
          `    Solve previous 5 year question papers. Take one full mock test every 3 days. Dedicate 2 hours analyzing mock mistakes.\n` +
          `*   **Phase 4 (Week 11-12): Revision & Formulas**\n` +
          `    Revise formula sheets, daily current affairs journals, and high-frequency topics. Avoid learning brand-new topics now.`,
      );
      setGeneratingPlanner(false);
      toast.success("AI Personalized Study Plan Generated!");
    }, 1500);
  };

  // 3. MOCK TEST PLAY ENGINE STATE
  const [activeQuiz, setActiveQuiz] = useState<"general" | "affairs" | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizTimer, setQuizTimer] = useState(120); // 2 minutes
  const [quizFinished, setQuizFinished] = useState(false);
  const [mockHistory, setMockHistory] = useState([
    {
      examName: "UPSC Civils Prelims Mini Mock",
      score: "72/100",
      accuracy: "78%",
      date: "24 Jun 2026",
    },
    { examName: "SSC CGL Quant Sectional", score: "42/50", accuracy: "88%", date: "19 Jun 2026" },
  ]);

  const activeQuestions = activeQuiz === "affairs" ? mockCurrentAffairsQuiz : mockQuizQuestions;

  // Timer countdown hook for Mock Quiz
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeQuiz && quizTimer > 0 && !quizFinished) {
      interval = setInterval(() => {
        setQuizTimer((t) => t - 1);
      }, 1000);
    } else if (quizTimer === 0 && !quizFinished && activeQuiz) {
      finishQuiz();
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizTimer, quizFinished]);

  const startQuiz = (type: "general" | "affairs") => {
    setActiveQuiz(type);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizTimer(120);
    setQuizFinished(false);
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    // Calculate final scores
    let correct = 0;
    let incorrect = 0;
    activeQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        correct++;
      } else if (selectedAnswers[idx] !== undefined) {
        incorrect++;
      }
    });

    // Score calculation with -0.25 negative marking
    const grossScore = correct * 2;
    const negativeMarks = incorrect * 0.5;
    const finalScore = parseFloat((grossScore - negativeMarks).toFixed(2));
    const maxScore = activeQuestions.length * 2;

    const newResult = {
      examName:
        activeQuiz === "affairs" ? "Current Affairs Daily Blitz" : "General Ability Booster",
      score: `${finalScore}/${maxScore}`,
      accuracy: `${Math.round((correct / activeQuestions.length) * 100)}%`,
      date: "Today",
    };

    setMockHistory((prev) => [newResult, ...prev]);
    toast.success("Mock Test Completed successfully!");
  };

  // 4. FORUM BOARD STATE
  const [forumPosts, setForumPosts] = useState([
    {
      id: 1,
      author: "Rahul Roy",
      role: "Aspirant",
      category: "UPSC",
      title: "How to memorize Indian Polity Articles effectively?",
      content:
        "I keep forgetting the difference between Articles 352, 356, and 360. Any mnemonic tips or revision sheets someone can share?",
      likes: 14,
      comments: [
        {
          author: "Kiran S.",
          text: "Draw a simple comparative tree table: National (352), State (356), Financial (360). Review it daily before sleep!",
        },
      ],
    },
    {
      id: 2,
      author: "Pooja Hegde",
      role: "Topper (SSC 2024)",
      category: "SSC",
      title: "Daily vocabulary list for English CHSL/CGL",
      content:
        "Sharing my personal excel sheet containing 500 high-frequency words for SSC exams. Download from my drive link.",
      likes: 42,
      comments: [],
    },
  ]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCat, setNewPostCat] = useState("UPSC");
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) {
      toast.error("Please fill out both the title and content.");
      return;
    }
    const newPost = {
      id: Date.now(),
      author: user?.name || "Aspirant",
      role: "Aspirant",
      category: newPostCat,
      title: newPostTitle,
      content: newPostContent,
      likes: 0,
      comments: [],
    };
    setForumPosts((prev) => [newPost, ...prev]);
    setNewPostTitle("");
    setNewPostContent("");
    toast.success("Community discussion post published!");
  };

  const handleAddComment = (postId: number) => {
    const txt = newCommentText[postId];
    if (!txt || !txt.trim()) return;

    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, { author: user?.name || "Aspirant", text: txt }],
          };
        }
        return p;
      }),
    );
    setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
    toast.success("Comment added!");
  };

  // 5. CALENDAR SCHEDULE STATE
  const [plannerEvents, setPlannerEvents] = useState([
    { date: "2026-06-28", text: "UPSC IAS Prelims Exam Cycle" },
    { date: "2026-06-30", text: "SSC CGL Registration Deadline" },
    { date: "2026-07-05", text: "IBPS Clerk Mock Challenge #2" },
  ]);
  const [newPlannerDate, setNewPlannerDate] = useState("2026-06-29");
  const [newPlannerText, setNewPlannerText] = useState("");

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlannerText.trim()) return;
    setPlannerEvents((prev) => [...prev, { date: newPlannerDate, text: newPlannerText }]);
    setNewPlannerText("");
    toast.success("Event scheduled on Study Calendar!");
  };

  // 6. AI COACH CHAT BOT STATE
  const [aiCoachHistory, setAiCoachHistory] = useState([
    {
      sender: "coach",
      text: "Hello! I am your CrackSpark AI Preparation Assistant. Ask me anything about syllabus breakdown, study tips, or time management!",
    },
  ]);
  const [aiCoachInput, setAiCoachInput] = useState("");
  const [aiCoachTyping, setAiCoachTyping] = useState(false);

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCoachInput.trim()) return;
    const userMsg = aiCoachInput;
    setAiCoachHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setAiCoachInput("");
    setAiCoachTyping(true);

    // Mock AI responses based on common keywords
    setTimeout(() => {
      let reply =
        "That is a great preparation question. I highly recommend spending 50% of your time on core concepts, 30% solving previous papers, and 20% analyzing mistakes. Focus on revision sprints every 10 days.";
      if (userMsg.toLowerCase().includes("polity") || userMsg.toLowerCase().includes("upsc")) {
        reply =
          "For UPSC Indian Polity, M. Laxmikanth is the gold standard book. Pay deep attention to Fundamental Rights, DPSP, Parliament, and Judiciary chapters. Make mind maps of important constitutional articles.";
      } else if (
        userMsg.toLowerCase().includes("quant") ||
        userMsg.toLowerCase().includes("ssc") ||
        userMsg.toLowerCase().includes("math")
      ) {
        reply =
          "For SSC Quant, speed and accuracy are key. Memorize tables up to 30, square roots up to 30, and cube roots up to 20. Focus on percentage, ratio, and algebra shortcuts to save time.";
      } else if (
        userMsg.toLowerCase().includes("schedule") ||
        userMsg.toLowerCase().includes("planner")
      ) {
        reply =
          "A balanced schedule involves: Slot 1 (2 hours): GS/Conceptual learning, Slot 2 (2 hours): Quant/Reasoning practice, Slot 3 (1 hour): Daily current affairs + vocabulary list, Slot 4 (1 hour): Revision.";
      }
      setAiCoachHistory((prev) => [...prev, { sender: "coach", text: reply }]);
      setAiCoachTyping(false);
    }, 1000);
  };

  // 7. PROFILE SAVED CHANGES
  const [profilePhone, setProfilePhone] = useState("+91 93455 06257");
  const [profileQual, setProfileQual] = useState("B.E. Computer Science");
  const [profilePref, setProfilePref] = useState("UPSC & SSC");

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

    if (!user) {
      toast.error("You must be logged in to upload a profile picture.");
      return;
    }

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

  const getDaysRemaining = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return 0;
    const diffTime = new Date(expiryDateStr).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile details saved successfully!");
  };

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

  if (!user) return null;

  return (
    <SiteLayout>
      <section className="bg-mesh-emerald text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold">Preparation Dashboard</h1>
              <p className="text-sm text-white/70 mt-1">
                Track study metrics, attempt mock tests, schedule tasks, and consult your personal
                AI Coach.
              </p>
            </div>
            {/* Gamification Streak Display */}
            <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-4 py-2 rounded-2xl backdrop-blur-sm">
              <Zap className="h-5 w-5 text-gold fill-current animate-bounce" />
              <div>
                <div className="text-[10px] uppercase font-bold text-white/60 leading-none">
                  Daily Streak
                </div>
                <div className="font-display text-lg font-extrabold">{streakCount} Days Active</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID CONTAINER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-[250px_minmax(0,1fr)] gap-8">
          {/* DASHBOARD TAB SELECTOR */}
          <aside className="rounded-2xl border border-border bg-card p-3 shadow-sm self-start">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto">
              {[
                { id: "overview", label: "Overview & Badges", icon: Activity },
                { id: "roadmap", label: "Timeline Roadmap", icon: Target },
                { id: "mocks", label: "Mock Test Engine", icon: Play },
                { id: "affairs", label: "Current Affairs", icon: BookOpen },
                { id: "ai", label: "AI Coach", icon: Brain },
                { id: "forum", label: "Community Forum", icon: MessageSquare },
                { id: "calendar", label: "Study Calendar", icon: Calendar },
                { id: "reviews", label: "Write a Review", icon: Award },
                { id: "profile", label: "User Profile", icon: UserIcon },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id as any);
                      // Close active quiz when swapping tabs
                      setActiveQuiz(null);
                    }}
                    className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* DASHBOARD CONTENT VIEWS */}
          <div className="min-w-0">
            {/* ================== TAB 1: OVERVIEW ================== */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* SUBSCRIPTION STATUS CARD */}
                {subscriptionDetails && subscriptionDetails.payment_status !== "none" && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                        <h3 className="font-display font-bold text-sm text-foreground">Subscription Status</h3>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          subscriptionDetails.payment_status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : subscriptionDetails.payment_status === "rejected"
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
                        }`}
                      >
                        {subscriptionDetails.payment_status === "approved" && "🟢 Approved"}
                        {subscriptionDetails.payment_status === "rejected" && "🔴 Rejected"}
                        {subscriptionDetails.payment_status === "pending" && "🟡 Pending"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Current Plan</span>
                        <span className="font-bold text-foreground capitalize">
                          {subscriptionDetails.plan_type ? `${subscriptionDetails.plan_type} Plan` : "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Amount Paid</span>
                        <span className="font-bold text-foreground">
                          {subscriptionDetails.amount ? `₹${subscriptionDetails.amount}` : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Transaction ID</span>
                        <span className="font-mono font-bold text-foreground">
                          {subscriptionDetails.transaction_id || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Access Status</span>
                        <span className={`font-bold ${isSubscribed ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {isSubscribed ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {subscriptionDetails.payment_status === "approved" && subscriptionDetails.expiry_date && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs mt-4 pt-4 border-t border-border/80">
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Start Date</span>
                          <span className="font-bold text-foreground">
                            {subscriptionDetails.start_date ? new Date(subscriptionDetails.start_date).toLocaleDateString() : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Expiry Date</span>
                          <span className="font-bold text-foreground">
                            {new Date(subscriptionDetails.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Days Remaining</span>
                          <span className="font-bold text-primary">
                            {getDaysRemaining(subscriptionDetails.expiry_date)} Days
                          </span>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.admin_remark && (
                      <div className="mt-4 p-3 bg-muted/40 rounded-xl border border-border text-xs">
                        <span className="font-bold text-foreground block mb-0.5">Admin Remark:</span>
                        <span className="text-muted-foreground italic">"{subscriptionDetails.admin_remark}"</span>
                      </div>
                    )}

                    {subscriptionDetails.payment_status === "rejected" && (
                      <div className="mt-4 flex items-center justify-between gap-4 pt-3 border-t border-border">
                        <span className="text-[11px] text-muted-foreground">Please upload a valid receipt screenshot and UTR number to resubmit.</span>
                        <Link 
                          to="/subscription"
                          className="px-4.5 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/95 transition cursor-pointer"
                        >
                          Resubmit Request
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {/* Stats Bento Grid */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary mb-3">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      Study Hours Logged
                    </div>
                    <div className="font-display text-2xl font-bold mt-1 text-primary">
                      {totalStudyHoursThisWeek} hrs
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      Logged this current week
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold-foreground mb-3">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      Roadmap Completion
                    </div>
                    <div className="font-display text-2xl font-bold mt-1 text-gold-foreground">
                      {roadmapCompletionPercent}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {roadmapStages.filter((s) => s.completed).length} of {roadmapStages.length}{" "}
                      stages checked
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary mb-3">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      Accuracy Score
                    </div>
                    <div className="font-display text-2xl font-bold mt-1 text-primary">82%</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      Average across all mocks taken
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Log Study Hours Module */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4">
                      Log Daily Study Hours
                    </h3>
                    <form
                      onSubmit={handleAddHours}
                      className="grid grid-cols-3 gap-2 items-end mb-5"
                    >
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">
                          Day
                        </label>
                        <select
                          value={newLogDay}
                          onChange={(e) => setNewLogDay(e.target.value)}
                          className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none"
                        >
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={newLogHours}
                          onChange={(e) => setNewLogHours(e.target.value)}
                          className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Log
                      </button>
                    </form>

                    {/* Chart Preview */}
                    <div className="h-28 flex items-end gap-3 px-4 pt-4 bg-muted/30 border border-border rounded-xl">
                      {Object.entries(studyHoursLog).map(([day, val]) => (
                        <div
                          key={day}
                          className="flex-1 flex flex-col items-center gap-1 justify-end h-full"
                        >
                          <span className="text-[8px] font-bold text-primary">{val}h</span>
                          <div
                            style={{ height: `${Math.min((val / 12) * 100, 100)}%` }}
                            className="w-full max-w-[14px] rounded-t bg-primary-glow/70"
                          />
                          <span className="text-[9px] font-bold text-muted-foreground pb-1">
                            {day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" /> AI Smart Recommendations
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <div className="font-bold text-primary flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-gold" /> Study Math Shortcuts
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            Based on your CGL Quant mock score, review Vedic math trick sheets for
                            fast multiplications.
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
                          <div className="font-bold text-gold-foreground flex items-center gap-1.5">
                            <BellRing className="h-3.5 w-3.5 text-gold-foreground" /> SSC
                            Registration Deadline
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            SSC CGL application closing soon in 3 days. We suggest submitting form
                            now to avoid server lag.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("ai")}
                      className="mt-4 text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Consult AI Coach <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Gamification Badges Module */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Achievement Badges
                  </h3>
                  <div className="grid sm:grid-cols-4 gap-4">
                    {initialBadges.map((badge) => {
                      const Icon = badge.icon;
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-xl border text-center transition ${
                            badge.earned
                              ? "bg-primary/5 border-primary/20 text-foreground"
                              : "bg-muted/35 border-border opacity-50 text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`mx-auto grid h-10 w-10 place-items-center rounded-full mb-3 ${badge.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="text-xs font-bold">{badge.title}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">
                            {badge.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leaderboard Rankings */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-gold fill-current" /> Leaderboard Rankings
                  </h3>
                  <div className="divide-y divide-border">
                    {initialLeaderboard.map((u) => (
                      <div
                        key={u.rank}
                        className="flex items-center justify-between py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-lg font-bold text-[10px] ${
                              u.rank === 1
                                ? "bg-gold text-gold-foreground"
                                : u.rank === 4
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.rank}
                          </span>
                          <span
                            className={
                              u.rank === 4 ? "font-bold text-primary" : "text-foreground/90"
                            }
                          >
                            {u.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{u.score} pts</span>
                          <span className="flex items-center gap-0.5">
                            <Zap className="h-3.5 w-3.5 text-gold fill-current" /> {u.streak}d
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================== TAB 2: TIMELINE ROADMAP ================== */}
            {activeTab === "roadmap" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-border pb-3 mb-5">
                    <div>
                      <h3 className="font-display text-lg font-bold">Timeline Study Roadmap</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Toggle stages to track your path completion status.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold text-primary">
                        {roadmapCompletionPercent}%
                      </div>
                      <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        Completion
                      </div>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-8">
                    <div
                      style={{ width: `${roadmapCompletionPercent}%` }}
                      className="h-full bg-primary rounded-full transition-all duration-300"
                    />
                  </div>

                  {/* Vertically Styled Checklist Timeline */}
                  <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
                    {roadmapStages.map((stage) => (
                      <div key={stage.id} className="relative">
                        {/* Bullet mark */}
                        <button
                          onClick={() => toggleStage(stage.id)}
                          className={`absolute left-[-31px] top-0.5 grid h-4 w-4 place-items-center rounded-full border transition-all ${
                            stage.completed
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-card border-border text-transparent hover:border-primary/50"
                          }`}
                        >
                          {stage.completed && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white fill-primary" />
                          )}
                        </button>
                        <div>
                          <span
                            className={`text-sm font-bold block ${stage.completed ? "text-primary line-through opacity-70" : "text-foreground"}`}
                          >
                            {stage.id}. {stage.stage}
                          </span>
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {stage.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Planner Generator */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" /> AI Study Plan Generator
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Target Exam
                      </label>
                      <select
                        value={aiPlannerTargetExam}
                        onChange={(e) => setAiPlannerTargetExam(e.target.value)}
                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="UPSC IAS">UPSC IAS</option>
                        <option value="SSC CGL">SSC CGL</option>
                        <option value="RRB NTPC">RRB NTPC</option>
                        <option value="IBPS PO">IBPS PO</option>
                        <option value="SBI Clerk">SBI Clerk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Syllabus Span (Weeks)
                      </label>
                      <select
                        value={aiPlannerTargetWeeks}
                        onChange={(e) => setAiPlannerTargetWeeks(e.target.value)}
                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="8">8 Weeks (Crash Course)</option>
                        <option value="12">12 Weeks (Balanced)</option>
                        <option value="24">24 Weeks (Deep Preparation)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={generateAIPlan}
                    disabled={generatingPlanner}
                    className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5"
                  >
                    {generatingPlanner
                      ? "Generating Customized Plan..."
                      : "Generate AI Planner Strategy"}
                  </button>

                  {generatedPlanner && (
                    <div className="mt-5 p-5 bg-primary/5 border border-primary/10 rounded-xl text-xs space-y-3 leading-relaxed whitespace-pre-line animate-in fade-in">
                      {generatedPlanner}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================== TAB 3: MOCK TEST ENGINE ================== */}
            {activeTab === "mocks" && (
              <div className="space-y-6">
                {!activeQuiz ? (
                  <>
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4">
                        Available Mock Challenges
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                          <div>
                            <div className="text-xs uppercase font-bold text-primary">
                              GK &amp; Aptitude Booster
                            </div>
                            <h4 className="font-display text-base font-bold mt-1">
                              General Ability Blitz Mock
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Timed questions testing History, Polity, Geography, and Math.
                            </p>
                            <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground font-semibold">
                              <span>5 Qs</span>
                              <span>•</span>
                              <span>2 Mins</span>
                              <span>•</span>
                              <span className="text-destructive">-0.25 Neg Marking</span>
                            </div>
                          </div>
                          <button
                            onClick={() => startQuiz("general")}
                            className="mt-4 h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-1"
                          >
                            <Play className="h-3.5 w-3.5 text-white fill-current" /> Start Challenge
                          </button>
                        </div>

                        <div className="p-5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
                          <div>
                            <div className="text-xs uppercase font-bold text-primary">
                              Current Affairs
                            </div>
                            <h4 className="font-display text-base font-bold mt-1">
                              Current Affairs Mini Blitz
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Questions based on latest national and international updates.
                            </p>
                            <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground font-semibold">
                              <span>2 Qs</span>
                              <span>•</span>
                              <span>2 Mins</span>
                              <span>•</span>
                              <span className="text-destructive">-0.25 Neg Marking</span>
                            </div>
                          </div>
                          <button
                            onClick={() => startQuiz("affairs")}
                            className="mt-4 h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-1"
                          >
                            <Play className="h-3.5 w-3.5 text-white fill-current" /> Start Challenge
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Score History */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4">
                        My Mock Results &amp; Analytics
                      </h3>
                      <div className="divide-y divide-border">
                        {mockHistory.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-3 text-xs">
                            <div>
                              <div className="font-bold text-foreground">{item.examName}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {item.date}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{item.score}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                Accuracy: {item.accuracy}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* LIVE MOCK EXAM VIEW */
                  <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-md animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-border pb-3 mb-5">
                      <div className="text-sm font-bold text-primary uppercase">
                        Live Mock Assessment
                      </div>
                      <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/25 text-destructive px-3 py-1 rounded-lg text-xs font-bold">
                        <Clock className="h-3.5 w-3.5 animate-spin" /> {Math.floor(quizTimer / 60)}:
                        {(quizTimer % 60).toString().padStart(2, "0")}
                      </div>
                    </div>

                    {!quizFinished ? (
                      <div>
                        {/* Progress */}
                        <div className="text-xs text-muted-foreground font-semibold mb-2">
                          Question {currentQuestionIndex + 1} of {activeQuestions.length}
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden mb-6">
                          <div
                            style={{
                              width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%`,
                            }}
                            className="h-full bg-primary"
                          />
                        </div>

                        {/* Question Text */}
                        <div className="font-display font-bold text-base text-foreground mb-4">
                          {activeQuestions[currentQuestionIndex].q}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {activeQuestions[currentQuestionIndex].options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() =>
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [currentQuestionIndex]: oIdx,
                                  }))
                                }
                                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition ${
                                  isSelected
                                    ? "bg-primary/8 border-primary text-primary font-semibold"
                                    : "border-border bg-card hover:bg-muted"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Navigation */}
                        <div className="mt-8 flex justify-between">
                          <button
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                            className="h-9 px-4 rounded-lg border border-border text-xs font-semibold hover:bg-muted disabled:opacity-40"
                          >
                            Previous
                          </button>
                          {currentQuestionIndex < activeQuestions.length - 1 ? (
                            <button
                              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                              className="h-9 px-5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              onClick={finishQuiz}
                              className="h-9 px-6 bg-gold-shine text-gold-foreground text-xs font-bold rounded-lg hover:opacity-95"
                            >
                              Finish Test
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* QUIZ RESULTS & EXPLANATIONS VIEW */
                      <div className="space-y-6">
                        <div className="text-center py-4 border-b border-border">
                          <Trophy className="h-10 w-10 text-gold fill-current mx-auto mb-2" />
                          <h4 className="font-display text-lg font-bold text-foreground">
                            Test Finished!
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Review your solutions and rank projection below.
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">
                              Final Score
                            </div>
                            <div className="font-display text-2xl font-extrabold text-primary mt-1">
                              {mockHistory[0].score}
                            </div>
                          </div>
                          <div className="p-4 bg-gold/5 rounded-xl border border-gold/10 text-center">
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">
                              Predicted Rank
                            </div>
                            <div className="font-display text-2xl font-extrabold text-gold-foreground mt-1">
                              Rank 142 / 10K
                            </div>
                          </div>
                        </div>

                        {/* Detailed solutions */}
                        <div className="space-y-4">
                          <div className="text-xs font-bold text-foreground border-b border-border pb-2">
                            Solutions &amp; Explanations
                          </div>
                          {activeQuestions.map((q, qIdx) => {
                            const userAns = selectedAnswers[qIdx];
                            const correct = userAns === q.answer;
                            return (
                              <div
                                key={qIdx}
                                className="p-4 bg-muted/20 border border-border rounded-xl space-y-2 text-xs"
                              >
                                <div className="font-bold flex items-start gap-1.5">
                                  <span
                                    className={`h-4 w-4 shrink-0 rounded-full text-[9px] font-bold text-white grid place-items-center ${correct ? "bg-primary" : "bg-destructive"}`}
                                  >
                                    {qIdx + 1}
                                  </span>
                                  <span>{q.q}</span>
                                </div>
                                <div className="text-muted-foreground pl-5">
                                  Your answer:{" "}
                                  <span
                                    className={
                                      correct
                                        ? "text-primary font-bold"
                                        : "text-destructive font-bold"
                                    }
                                  >
                                    {userAns !== undefined ? q.options[userAns] : "Not answered"}
                                  </span>
                                </div>
                                <div className="text-muted-foreground pl-5">
                                  Correct answer:{" "}
                                  <span className="text-primary font-bold">
                                    {q.options[q.answer]}
                                  </span>
                                </div>
                                <div className="bg-card p-3 rounded-lg border border-border mt-2 pl-2 text-[11px] text-foreground/80 leading-relaxed italic">
                                  <strong>Explanation:</strong> {q.exp}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setActiveQuiz(null)}
                          className="w-full h-10 border border-border text-xs font-semibold rounded-lg hover:bg-muted"
                        >
                          Back to dashboard mocks
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================== TAB 4: CURRENT AFFAIRS ================== */}
            {activeTab === "affairs" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-border pb-3 mb-5">
                    <div>
                      <h3 className="font-display text-lg font-bold">Current Affairs Journal</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stay updated with daily, weekly, and monthly news capsules.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 border border-border rounded-xl">
                      <div className="text-xs text-primary font-bold uppercase tracking-wider">
                        Today's Highlight
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1">
                        Reserve Bank of India retains repo rate at 6.50% in MPC session
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Citing persistent food inflation concerns and solid GDP growth momentum, the
                        RBI Monetary Policy Committee voted to keep the key lending rate unchanged
                        to secure target stability.
                      </p>
                    </div>

                    <div className="p-4 bg-muted/30 border border-border rounded-xl">
                      <div className="text-xs text-primary font-bold uppercase tracking-wider">
                        Weekly Roundup
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1">
                        G20 Summit 2026 hosts ministerial meetings on climate change &amp;
                        digitalization
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Nations discussed frameworks for artificial intelligence regulation,
                        transition pathways for renewable energy grids, and cross-border digital
                        payment integration.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button className="inline-flex h-9 items-center gap-1.5 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition">
                      <Download className="h-4 w-4" /> Download Monthly Current Affairs PDF
                    </button>
                    <button
                      onClick={() => startQuiz("affairs")}
                      className="inline-flex h-9 items-center gap-1.5 px-4 bg-gold-shine text-gold-foreground text-xs font-semibold rounded-lg hover:opacity-95 transition"
                    >
                      <Play className="h-4 w-4" /> Take Current Affairs Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================== TAB 5: AI COACH CHAT ================== */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm h-[480px] flex flex-col justify-between">
                  <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-display text-sm font-bold text-foreground">
                          AI Coach Chat
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Online</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-primary font-semibold bg-primary/8 px-2 py-0.5 rounded-full">
                      GPT-3.5 Coach
                    </span>
                  </div>

                  {/* Messages box */}
                  <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 text-xs scrollbar-thin">
                    {aiCoachHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground border border-border"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {aiCoachTyping && (
                      <div className="flex justify-start">
                        <div className="p-3 bg-muted text-muted-foreground rounded-xl flex items-center gap-1 font-semibold italic">
                          AI Coach is thinking...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preloaded suggestion tags */}
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground mr-1 mt-0.5">Suggested:</span>
                    {[
                      "How to study Polity?",
                      "Math calculation tricks",
                      "Balanced Study Schedule",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setAiCoachInput(s)}
                        className="px-2 py-1 bg-muted hover:bg-muted/80 rounded border border-border transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={handleSendAiMessage}
                    className="mt-4 flex gap-2 border-t border-border pt-4"
                  >
                    <input
                      value={aiCoachInput}
                      onChange={(e) => setAiCoachInput(e.target.value)}
                      placeholder="Ask AI Coach a question..."
                      className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-10 w-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/95 transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ================== TAB 6: COMMUNITY FORUM ================== */}
            {activeTab === "forum" && (
              <div className="space-y-6">
                {/* Create post */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4">
                    Post a Query / Share Notes
                  </h3>
                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          placeholder="Topic Title (e.g. NCERT History Summary)..."
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <select
                          value={newPostCat}
                          onChange={(e) => setNewPostCat(e.target.value)}
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                        >
                          <option value="UPSC">UPSC Civils</option>
                          <option value="SSC">SSC Exams</option>
                          <option value="Railways">Railways (RRB)</option>
                          <option value="Banking">Banking (IBPS/SBI)</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Explain your doubt, share helpful resources, or discuss exam patterns with peers..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-9 px-5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Publish Post
                    </button>
                  </form>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                  {forumPosts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{post.author}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            ({post.role})
                          </span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                          {post.category}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm text-foreground">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {/* Comments mapping */}
                      {post.comments.length > 0 && (
                        <div className="pl-4 border-l-2 border-primary/20 space-y-3 mt-4">
                          {post.comments.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border/60"
                            >
                              <span className="font-bold text-foreground block">{c.author}</span>
                              <span className="text-muted-foreground mt-0.5 block">{c.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex gap-2 pt-2">
                        <input
                          value={newCommentText[post.id] || ""}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Reply to this query..."
                          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="h-9 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================== TAB 7: STUDY CALENDAR ================== */}
            {activeTab === "calendar" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-4">
                    Study Planner &amp; Event Calendar
                  </h3>

                  {/* Calendar Add Event */}
                  <form
                    onSubmit={handleAddEvent}
                    className="grid sm:grid-cols-3 gap-2 items-end mb-6"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newPlannerDate}
                        onChange={(e) => setNewPlannerDate(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                        Study Goal / Exam Date
                      </label>
                      <input
                        required
                        value={newPlannerText}
                        onChange={(e) => setNewPlannerText(e.target.value)}
                        placeholder="e.g. Quant Sectional Mock Test"
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Schedule Event
                    </button>
                  </form>

                  {/* List of Calendar events */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-foreground border-b border-border pb-2">
                      Upcoming Calendar Dates
                    </div>
                    {plannerEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-xl text-xs"
                      >
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <span className="font-bold text-foreground">{evt.date}</span>
                          <span className="text-muted-foreground ml-2">— {evt.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================== TAB 8: USER PROFILE ================== */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-bold border-b border-border pb-3 mb-5">
                    Personal Details &amp; Exam Preferences
                  </h3>

                  {/* Profile Header with Avatar for Google Sign-in / Regular User */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
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
                        {uploading && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-[8px] mt-0.5 font-bold">{uploadProgress}%</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                        <span className="inline-block mt-2 text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-primary/8 text-primary">
                          {user.role === "admin" ? "Administrator" : "Aspirant Account"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted/50 transition cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload Photo
                      </button>
                      {user.avatar && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={uploading}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 px-3.5 text-xs font-semibold hover:bg-destructive/20 transition cursor-pointer disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <form onSubmit={saveProfile} className="space-y-4 text-xs">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          Full Name
                        </label>
                        <input
                          disabled
                          value={user.name}
                          className="w-full h-10 rounded-lg border border-input bg-muted/50 px-3 text-xs focus:outline-none text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          Registered Email
                        </label>
                        <input
                          disabled
                          value={user.email}
                          className="w-full h-10 rounded-lg border border-input bg-muted/50 px-3 text-xs focus:outline-none text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          Phone Number
                        </label>
                        <input
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1.5">
                          Educational Qualification
                        </label>
                        <input
                          value={profileQual}
                          onChange={(e) => setProfileQual(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1.5">
                        Target Exam Preferences
                      </label>
                      <input
                        value={profilePref}
                        onChange={(e) => setProfilePref(e.target.value)}
                        placeholder="e.g. UPSC IAS, SSC CGL"
                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <button
                      type="submit"
                      className="h-10 px-5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
                    >
                      Save Profile Changes
                    </button>
                  </form>
                </div>
              </div>
            )}
            {activeTab === "reviews" && (
              <UserReviewsSection />
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

// ----------------------------------------------------
// SECTION: USER REVIEWS SECTION (SUBMIT REVIEW)
// ----------------------------------------------------
function UserReviewsSection() {
  const { user } = useAuth();
  const [review, setReview] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingReview, setLoadingReview] = useState(true);

  const fetchUserReview = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_reviews")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) {
        setReview(data);
        setRating(data.rating);
        setTitle(data.review_title);
        setDesc(data.review_description);
      } else {
        setReview(null);
      }
    } catch (err) {
      console.warn("Failed to check review status:", err);
    } finally {
      setLoadingReview(false);
    }
  };

  useEffect(() => {
    fetchUserReview();
  }, [user]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your review?")) return;
    try {
      const { error } = await supabase
        .from("user_reviews")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Review deleted successfully!");
      setReview(null);
      setTitle("");
      setDesc("");
      setRating(5);
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Failed to delete review: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      toast.error("Please fill in both title and description.");
      return;
    }
    setSubmitting(true);
    const payload = {
      user_id: user.id,
      user_name: user.name || user.email,
      profile_image: user.avatar || null,
      rating,
      review_title: title.trim(),
      review_description: desc.trim(),
      is_approved: false, // Reset approval status for admin verification
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase
        .from("user_reviews")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Review submitted successfully! It will appear on the homepage once approved by the administrator.");
      setIsEditing(false);
      fetchUserReview();
    } catch (err: any) {
      toast.error("Failed to submit review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingReview) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in text-xs sm:text-sm">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Aspirant Feedback & Reviews</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Share your prep journey experience on CrackSpark. Your review will be featured on our landing page once verified.
        </p>
      </div>

      {review && !isEditing ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm relative overflow-hidden space-y-4">
          <Quote className="absolute top-6 right-6 h-10 w-10 text-muted-foreground/10 pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Your Submitted Review</span>
              <span 
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  review.is_approved 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                }`}
              >
                {review.is_approved ? "Approved" : "Pending Verification"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              📅 {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex gap-0.5">
              {[...Array(review.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
              ))}
            </div>

            <div className="font-display font-bold text-base text-foreground leading-tight">
              {review.review_title}
            </div>

            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed italic">
              "{review.review_description}"
            </p>
          </div>

          <div className="flex gap-2 pt-3 border-t border-border mt-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 h-8 bg-muted text-foreground hover:bg-muted/80 rounded-lg font-bold text-xs transition cursor-pointer"
            >
              Edit Review
            </button>
            <button
              onClick={handleDelete}
              className="px-3.5 h-8 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg font-bold text-xs transition cursor-pointer"
            >
              Delete Review
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            {user.avatar ? (
              <img src={user.avatar} className="h-10 w-10 rounded-full object-cover border border-border" alt={user.name} />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase border">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-bold text-sm text-foreground leading-none">{user.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Reviewing as Verified Aspirant</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-muted-foreground mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-amber-500 hover:scale-110 transition duration-150 cursor-pointer"
                  >
                    <Star 
                      className={`h-5 w-5 ${
                        rating >= star ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1.5">Review Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience (e.g. Best mock test platform!)"
                className="w-full h-10 rounded-lg border border-input bg-background px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1.5">Review Description</label>
              <textarea
                required
                rows={4}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Tell us what you liked about CrackSpark (syllabus roadmap, mock tests, study materials, etc.)"
                className="w-full rounded-lg border border-input bg-background p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-border mt-2">
            <button
              disabled={submitting}
              type="submit"
              className="px-4 h-9 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {review ? "Update Review" : "Submit Review"}
            </button>
            {review && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 h-9 bg-muted text-foreground hover:bg-muted/80 rounded-lg font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

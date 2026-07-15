import { Toaster as Sonner, toast as rawToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

// Custom premium toast renderer matching all visibility, light/dark mode, icon, animation, progress bar, and responsiveness requirements
const renderCustomToast = (
  message: string,
  type: "success" | "error" | "warning" | "info",
  options?: any
) => {
  // 1. Durations (Slower, giving the user ample time to read the toast)
  const durationMap = {
    success: 7000, // 7 seconds
    error: 11000,  // 11 seconds
    warning: 9000,  // 9 seconds
    info: 7000,    // 7 seconds
  };
  const duration = options?.duration || durationMap[type];
  const position = "top-center"; // Always top center

  // 2. Type Configuration: Icon, Theme Classes, and Shadows
  let icon = "✅";
  let themeClasses = "bg-[#16A34A] dark:bg-[#22C55E] text-white";
  let shadowColor = "rgba(22, 163, 74, 0.4)";
  let progressColor = "bg-white/40";

  if (type === "error") {
    icon = "❌";
    themeClasses = "bg-[#DC2626] dark:bg-[#EF4444] text-white";
    shadowColor = "rgba(220, 38, 38, 0.4)";
  } else if (type === "warning") {
    icon = "⚠️";
    themeClasses = "bg-[#F59E0B] dark:bg-[#FBBF24] text-black";
    shadowColor = "rgba(245, 158, 11, 0.4)";
    progressColor = "bg-black/30";
  } else if (type === "info") {
    icon = "ℹ️";
    themeClasses = "bg-[#2563EB] dark:bg-[#3B82F6] text-white";
    shadowColor = "rgba(37, 99, 235, 0.4)";
  }

  rawToast.custom((t) => (
    <div
      className={`relative flex items-center gap-4.5 px-6 py-5 rounded-[18px] w-full max-w-[92vw] sm:max-w-[480px] pointer-events-auto select-none border border-black/5 dark:border-white/10 ${themeClasses}`}
      style={{
        animation: t.visible
          ? "cs-toast-in 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          : "cs-toast-out 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.28), 0 0 25px ${shadowColor}`,
        zIndex: 999999,
      }}
    >
      {/* Animation Styles */}
      <style>{`
        @keyframes cs-toast-in {
          0% { transform: translateY(-40px) scale(0.93); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes cs-toast-out {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-20px) scale(0.95); opacity: 0; }
        }
        @keyframes cs-toast-progress {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}</style>

      {/* Large Custom Icon (24–28px) */}
      <span 
        style={{
          fontSize: "26px",
          lineHeight: "1",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      {/* Vertical separator */}
      <div 
        className="w-[1px] h-9 self-center" 
        style={{
          backgroundColor: type === "warning" ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.25)",
        }}
      />

      {/* Content text */}
      <div className="flex-1 text-left min-w-0 pr-2">
        <p className="text-[15px] sm:text-[16px] font-bold leading-snug tracking-wide break-words m-0">
          {message}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-black/10 overflow-hidden rounded-b-[18px]">
        <div 
          className={`h-full ${progressColor}`}
          style={{
            animation: `cs-toast-progress ${duration}ms linear forwards`,
            transformOrigin: "left",
          }}
        />
      </div>
    </div>
  ), {
    duration,
    position,
    className: "!bg-transparent !border-0 !shadow-none !p-0 !m-0 !w-auto !h-auto !max-w-none !pointer-events-auto",
  });
};

export const toast = {
  success: (message: string, options?: any) => {
    renderCustomToast(message, "success", options);
  },
  error: (message: string, options?: any) => {
    renderCustomToast(message, "error", options);
  },
  warning: (message: string, options?: any) => {
    renderCustomToast(message, "warning", options);
  },
  info: (message: string, options?: any) => {
    renderCustomToast(message, "info", options);
  },
  custom: rawToast.custom,
  dismiss: rawToast.dismiss,
};

export { Toaster };

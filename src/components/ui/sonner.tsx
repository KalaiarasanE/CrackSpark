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

// Helper to render the premium toast layout matching the user's screenshot
const renderPremiumToast = (
  title: string,
  message: string,
  type: "success" | "error" | "info" | "warning",
  options?: any
) => {
  // Determine accent color and glow based on type
  let accentColor = "#06b6d4"; // default electric cyan
  let glowColor = "rgba(6, 182, 212, 0.3)";
  let checkmarkSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3.5}
      stroke="currentColor"
      style={{ width: "14px", height: "14px" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );

  if (type === "success") {
    // Keep beautiful cyan/teal from the screenshot for success
    accentColor = "#00f2fe";
    glowColor = "rgba(0, 242, 254, 0.3)";
  } else if (type === "error") {
    accentColor = "#ef4444"; // red
    glowColor = "rgba(239, 68, 68, 0.3)";
    checkmarkSvg = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={3.5}
        stroke="currentColor"
        style={{ width: "14px", height: "14px" }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  } else if (type === "warning") {
    accentColor = "#f59e0b"; // gold/amber
    glowColor = "rgba(245, 158, 11, 0.3)";
    checkmarkSvg = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={3.5}
        stroke="currentColor"
        style={{ width: "14px", height: "14px" }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    );
  }

  const duration = options?.duration || 4000;
  const position = options?.position || "top-center";

  rawToast.custom((t) => (
    <div
      style={{
        animation: t.visible
          ? "ag-toast-enter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards"
          : "ag-toast-exit 0.25s cubic-bezier(0.21, 1.02, 0.73, 1) forwards",
        background: "rgba(9, 14, 17, 0.95)", // Glassmorphic very dark background
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderBottom: `3px solid ${accentColor}`, // Glowing bottom border highlight
        borderRadius: "12px",
        padding: "16px 20px",
        boxShadow: `0 15px 35px rgba(0, 0, 0, 0.6), 0 0 25px ${glowColor}`,
        display: "flex",
        alignItems: "center",
        gap: "16px",
        minWidth: "320px",
        pointerEvents: "auto",
      }}
    >
      <style>{`
        @keyframes ag-toast-enter {
          0% { transform: translateY(-30px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes ag-toast-exit {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-15px) scale(0.95); opacity: 0; }
        }
        @keyframes ag-icon-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
      
      {/* Rounded icon container with glowing borders */}
      <div 
        style={{
          display: "flex",
          height: "36px",
          width: "36px",
          borderRadius: "50%",
          border: `2px solid ${accentColor}`,
          color: accentColor,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 12px ${glowColor}`,
          animation: "ag-icon-pulse 2s infinite ease-in-out",
        }}
      >
        {checkmarkSvg}
      </div>

      {/* Vertical separator */}
      <div 
        style={{
          height: "32px",
          width: "1px",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
        }}
      />

      {/* Content text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
        <span style={{ fontWeight: 800, fontSize: "15px", color: "#ffffff", letterSpacing: "0.2px" }}>
          {title}
        </span>
        <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500, lineHeight: "1.4" }}>
          {message}
        </span>
      </div>
    </div>
  ), {
    duration,
    position,
  });
};

export const toast = {
  success: (message: string, options?: any) => {
    const title = typeOfMessage(message) === "update" ? "Updated!" : "Success!";
    renderPremiumToast(title, message, "success", options);
  },
  error: (message: string, options?: any) => {
    renderPremiumToast("Error!", message, "error", options);
  },
  warning: (message: string, options?: any) => {
    renderPremiumToast("Warning!", message, "warning", options);
  },
  info: (message: string, options?: any) => {
    renderPremiumToast("Info", message, "info", options);
  },
  custom: rawToast.custom,
  dismiss: rawToast.dismiss,
};

// Helper to determine title content dynamically based on text keywords
function typeOfMessage(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("update") || lower.includes("modif") || lower.includes("edit") || lower.includes("chang")) {
    return "update";
  }
  return "success";
}

export { Toaster };

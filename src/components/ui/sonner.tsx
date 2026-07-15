import React from "react";
import { Toaster as Sonner, toast as rawToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <>
      <style>{`
        .premium-toast-item {
          width: 95vw !important;
          max-width: 440px !important;
          min-width: unset !important;
          background: var(--toast-bg) !important;
          color: var(--toast-color) !important;
          border-radius: 18px !important;
          padding: 18px 24px !important;
          border: var(--toast-border) !important;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4) !important;
          opacity: 1 !important;
          z-index: 999999 !important;
          pointer-events: auto !important;
        }
        .premium-toast-item[data-visible="true"] {
          animation: premium-toast-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .premium-toast-item[data-visible="false"] {
          animation: premium-toast-exit 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        @media (min-width: 480px) {
          .premium-toast-item {
            width: auto !important;
            min-width: 420px !important;
          }
        }
        @keyframes premium-toast-enter {
          0% {
            opacity: 0;
            transform: translate3d(0, -60px, 0) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes premium-toast-exit {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -20px, 0) scale(0.95);
          }
        }
        @keyframes premium-progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .premium-toast-item:hover .premium-progress-bar {
          animation-play-state: paused;
        }
        [data-sonner-toaster] {
          z-index: 999999 !important;
        }
        [data-sonner-toaster] [data-sonner-toast] {
          background: var(--toast-bg) !important;
          color: var(--toast-color) !important;
          border-radius: 18px !important;
          padding: 18px 24px !important;
          border: var(--toast-border) !important;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4) !important;
          width: 95vw !important;
          max-width: 440px !important;
          min-width: unset !important;
          height: auto !important;
          opacity: 1 !important;
        }
        @media (min-width: 480px) {
          [data-sonner-toaster] [data-sonner-toast] {
            width: auto !important;
            min-width: 420px !important;
          }
        }
      `}</style>
      <Sonner
        className="toaster group"
        style={{
          zIndex: 999999,
        }}
        toastOptions={{
          classNames: {
            toast: "premium-toast-item",
          },
        }}
        {...props}
      />
    </>
  );
};

// Icons for each type (Large 28px)
const getIcon = (type: "success" | "error" | "warning" | "info", color: string) => {
  const style = { width: "28px", height: "28px", color, flexShrink: 0 };
  switch (type) {
    case "success":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
          style={style}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
    case "error":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
          style={style}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
          style={style}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      );
    case "info":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
          style={style}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0-3h.008v.008H12V9.75Zm9 2.25a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      );
  }
};

interface PremiumToastProps {
  t: {
    id: string | number;
    visible: boolean;
  };
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration: number;
  color: string;
  progressColor: string;
}

const PremiumToastContent = ({
  t,
  title,
  message,
  type,
  duration,
  color,
  progressColor,
}: PremiumToastProps) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Icon */}
      {getIcon(type, color)}

      {/* Vertical divider */}
      <div
        style={{
          width: "2px",
          height: "36px",
          backgroundColor: type === "warning" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.3)",
          flexShrink: 0,
        }}
      />

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1, minWidth: 0 }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: "17px",
            lineHeight: "1.3",
            color: color,
            letterSpacing: "-0.01em",
            wordBreak: "break-word",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: "17px",
            lineHeight: "1.4",
            color: color,
            wordBreak: "break-word",
          }}
        >
          {message}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="premium-progress-bar"
        style={{
          position: "absolute",
          bottom: "-18px",
          left: "-24px",
          right: "-24px",
          height: "5px",
          backgroundColor: progressColor,
          animation: `premium-progress-shrink ${duration}ms linear forwards`,
          borderBottomLeftRadius: "18px",
          borderBottomRightRadius: "18px",
        }}
      />
    </div>
  );
};

// Helper to render the premium toast layout
const renderPremiumToast = (
  title: string,
  message: string,
  type: "success" | "error" | "info" | "warning",
  options?: any
) => {
  const defaultDurations = {
    success: 4000,
    error: 6000,
    warning: 5000,
    info: 4000,
  };

  const duration = options?.duration || defaultDurations[type];
  const position = options?.position || "top-center";

  // Pure high contrast colors matching requirements
  const stylesMap = {
    success: { bg: "#16A34A", text: "#FFFFFF", progress: "#86EFAC" },
    error: { bg: "#DC2626", text: "#FFFFFF", progress: "#FCA5A5" },
    warning: { bg: "#F59E0B", text: "#000000", progress: "#78350F" },
    info: { bg: "#2563EB", text: "#FFFFFF", progress: "#BFDBFE" },
  };

  const config = stylesMap[type];

  rawToast.custom(
    (t) => (
      <PremiumToastContent
        t={t}
        title={title}
        message={message}
        type={type}
        duration={duration}
        color={config.text}
        progressColor={config.progress}
      />
    ),
    {
      duration,
      position,
      style: {
        "--toast-bg": config.bg,
        "--toast-color": config.text,
        "--toast-border": type === "warning" ? "2px solid #000000" : "2px solid #ffffff",
      } as React.CSSProperties,
      className: "premium-toast-item",
    }
  );
};

export const toast = {
  success: (message: string, options?: any) => {
    const title = options?.title || (typeOfMessage(message) === "update" ? "Updated!" : "Success!");
    renderPremiumToast(title, message, "success", options);
  },
  error: (message: string, options?: any) => {
    const title = options?.title || "Error!";
    renderPremiumToast(title, message, "error", options);
  },
  warning: (message: string, options?: any) => {
    const title = options?.title || "Warning!";
    renderPremiumToast(title, message, "warning", options);
  },
  info: (message: string, options?: any) => {
    const title = options?.title || "Info";
    renderPremiumToast(title, message, "info", options);
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

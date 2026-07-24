import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Definition of the Toast Item type
interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration: number;
  visible: boolean;
}

// Global state for active toast notifications
let activeToasts: ToastItem[] = [];
let toastListeners: Array<(toasts: ToastItem[]) => void> = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...activeToasts]));
};

// Add a new toast to the queue
const addToast = (
  title: string,
  message: string,
  type: "success" | "error" | "warning" | "info",
  options?: any
) => {
  const defaultDurations = {
    success: 3500,
    error: 3500,
    warning: 3500,
    info: 3500,
  };

  const duration = options?.duration || defaultDurations[type];
  const id = Math.random().toString(36).substring(2, 9);

  const newToast: ToastItem = {
    id,
    title,
    message,
    type,
    duration,
    visible: true,
  };

  activeToasts.push(newToast);
  notifyListeners();

  // Schedule removal based on visible status transition
  setTimeout(() => {
    dismissToast(id);
  }, duration);

  return id;
};

// Trigger dismiss animation and then cleanup
const dismissToast = (id: string) => {
  const toastIndex = activeToasts.findIndex((t) => t.id === id);
  if (toastIndex !== -1) {
    activeToasts[toastIndex].visible = false;
    notifyListeners();

    // Allow exit keyframe animation to complete before removing from DOM
    setTimeout(() => {
      activeToasts = activeToasts.filter((t) => t.id !== id);
      notifyListeners();
    }, 300);
  }
};

// Icons (18-20px height/width) matching categories
const getIcon = (type: "success" | "error" | "warning" | "info") => {
  const style = {
    width: "20px",
    height: "20px",
    flexShrink: 0,
    color: "#FFFFFF",
  };
  switch (type) {
    case "success":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
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
          strokeWidth={2.5}
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
          strokeWidth={2.5}
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
          strokeWidth={2.5}
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

// Component rendering each individual toast item (Compact, 280-340px width, 52-64px height)
const ToastElement = ({ toast }: { toast: ToastItem }) => {
  const stylesMap = {
    success: {
      bg: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
      border: "1px solid rgba(74, 222, 128, 0.35)",
      progress: "#86EFAC",
      shadow: "0 10px 25px rgba(22, 163, 74, 0.35)",
    },
    error: {
      bg: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
      border: "1px solid rgba(248, 113, 113, 0.35)",
      progress: "#FCA5A5",
      shadow: "0 10px 25px rgba(220, 38, 38, 0.35)",
    },
    warning: {
      bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      border: "1px solid rgba(253, 230, 138, 0.35)",
      progress: "#FDE047",
      shadow: "0 10px 25px rgba(245, 158, 11, 0.35)",
    },
    info: {
      bg: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
      border: "1px solid rgba(147, 197, 253, 0.35)",
      progress: "#93C5FD",
      shadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
    },
  };

  const config = stylesMap[toast.type];

  return (
    <div
      className="custom-toast-container"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: config.bg,
        color: "#FFFFFF",
        borderRadius: "12px",
        padding: "12px 16px",
        border: config.border,
        boxShadow: config.shadow,
        animation: toast.visible
          ? "compact-toast-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          : "compact-toast-exit 0.25s ease-in forwards",
        width: "100%",
        maxWidth: "340px",
        minHeight: "52px",
        pointerEvents: "auto",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Icon */}
      {getIcon(toast.type)}

      {/* Content Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexGrow: 1, minWidth: 0 }}>
        {toast.title && (
          <span
            style={{
              fontWeight: 600,
              fontSize: "15px",
              lineHeight: "1.25",
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            {toast.title}
          </span>
        )}
        <span
          style={{
            fontWeight: 400,
            fontSize: "13px",
            lineHeight: "1.35",
            color: "rgba(255, 255, 255, 0.92)",
            wordBreak: "break-word",
          }}
        >
          {toast.message}
        </span>
      </div>

      {/* Thin Animated Progress Bar */}
      <div
        className="compact-progress-bar"
        style={{
          position: "absolute",
          bottom: "0px",
          left: "0px",
          height: "2.5px",
          background: config.progress,
          animation: `compact-progress-shrink ${toast.duration}ms linear forwards`,
        }}
      />
    </div>
  );
};

// Portal-rendered list container (Top-right desktop, Top-center mobile)
const Toaster = (props: any) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const listener = (newToasts: ToastItem[]) => {
      setToasts(newToasts);
    };
    toastListeners.push(listener);
    setToasts([...activeToasts]);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <div className="compact-toaster-root">
      <style>{`
        .compact-toaster-root {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          pointer-events: none;
          width: 90vw;
          max-width: 340px;
          box-sizing: border-box;
        }

        @keyframes compact-toast-enter {
          0% {
            opacity: 0;
            transform: translate3d(0, -20px, 0) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes compact-toast-exit {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -15px, 0) scale(0.95);
          }
        }

        @keyframes compact-progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }

        .custom-toast-container:hover .compact-progress-bar {
          animation-play-state: paused;
        }
      `}</style>
      {toasts.map((t) => (
        <ToastElement key={t.id} toast={t} />
      ))}
    </div>,
    document.body
  );
};

// Main toast emitter API
export const toast = {
  success: (message: string, options?: any) => {
    console.log("[TOAST TRIGGERED] Success:", message);
    const title = options?.title || (typeOfMessage(message) === "update" ? "Updated!" : "Success!");
    return addToast(title, message, "success", options);
  },
  error: (message: string, options?: any) => {
    console.log("[TOAST TRIGGERED] Error:", message);
    const title = options?.title || "Error!";
    return addToast(title, message, "error", options);
  },
  warning: (message: string, options?: any) => {
    console.log("[TOAST TRIGGERED] Warning:", message);
    const title = options?.title || "Warning!";
    return addToast(title, message, "warning", options);
  },
  info: (message: string, options?: any) => {
    console.log("[TOAST TRIGGERED] Info:", message);
    const title = options?.title || "Info";
    return addToast(title, message, "info", options);
  },
  custom: (renderer: any, options?: any) => {
    console.log("[TOAST TRIGGERED] Custom emitter:", renderer);
    const message = typeof renderer === "string" ? renderer : "Notification";
    return addToast("Notification", message, "info", options);
  },
  dismiss: (id?: string) => {
    console.log("[TOAST DISMISSED] Dismissing:", id);
    if (id) {
      dismissToast(id);
    } else {
      activeToasts.forEach((t) => dismissToast(t.id));
    }
  },
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

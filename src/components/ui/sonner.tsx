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
    success: 4000,
    error: 6000,
    warning: 5000,
    info: 4000,
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

// Icons (28px height/width) matching categories
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

// Component rendering each individual toast item
const ToastElement = ({ toast }: { toast: ToastItem }) => {
  const stylesMap = {
    success: { bg: "#16A34A", text: "#FFFFFF", progress: "#86EFAC" },
    error: { bg: "#DC2626", text: "#FFFFFF", progress: "#FCA5A5" },
    warning: { bg: "#F59E0B", text: "#000000", progress: "#78350F" },
    info: { bg: "#2563EB", text: "#FFFFFF", progress: "#BFDBFE" },
  };

  const config = stylesMap[toast.type];

  return (
    <div
      className="custom-toast-container"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: config.bg,
        color: config.text,
        borderRadius: "18px",
        padding: "18px 24px",
        border: toast.type === "warning" ? "2px solid #000000" : "2px solid #ffffff",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.4)",
        animation: toast.visible
          ? "custom-toast-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          : "custom-toast-exit 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        width: "100%",
        pointerEvents: "auto",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* Icon */}
      {getIcon(toast.type, config.text)}

      {/* Vertical divider */}
      <div
        style={{
          width: "2px",
          height: "36px",
          backgroundColor: toast.type === "warning" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.3)",
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
            color: config.text,
            letterSpacing: "-0.01em",
            wordBreak: "break-word",
          }}
        >
          {toast.title}
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: "17px",
            lineHeight: "1.4",
            color: config.text,
            wordBreak: "break-word",
          }}
        >
          {toast.message}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="custom-progress-bar"
        style={{
          position: "absolute",
          bottom: "-18px",
          left: "-24px",
          right: "-24px",
          height: "5px",
          backgroundColor: config.progress,
          animation: `custom-progress-shrink ${toast.duration}ms linear forwards`,
          borderBottomLeftRadius: "18px",
          borderBottomRightRadius: "18px",
        }}
      />
    </div>
  );
};

// Portal-rendered list container at document.body level
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
    <div
      className="custom-toaster-root"
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "center",
        pointerEvents: "none",
        width: "95vw",
        maxWidth: "440px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .custom-toaster-root {
          width: 95vw !important;
          max-width: 440px !important;
        }
        @media (min-width: 480px) {
          .custom-toaster-root {
            width: auto !important;
            min-width: 420px !important;
          }
        }
        @keyframes custom-toast-enter {
          0% {
            opacity: 0;
            transform: translate3d(0, -60px, 0) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes custom-toast-exit {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -20px, 0) scale(0.95);
          }
        }
        @keyframes custom-progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .custom-toast-container:hover .custom-progress-bar {
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
    console.log("[TOAST TRIGGERED] Custom custom emitter:", renderer);
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

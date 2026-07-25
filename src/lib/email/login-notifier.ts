import { sendAdminLoginAlertServerFn, AdminLoginAlertPayload } from "./server-fn";

export interface NotifyAdminLoginParams {
  userName: string;
  userEmail: string;
  loginMethod: "Email & Password" | "Google Login" | string;
  userId?: string;
  sessionKey?: string;
}

/**
 * Parses user agent string into Device, Browser, and OS details
 */
export function getClientDeviceInfo(): { device: string; browser: string; os: string } {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { device: "Desktop", browser: "Web Browser", os: "Unknown OS" };
  }

  const ua = navigator.userAgent;

  // OS Detection
  let os = "Unknown OS";
  if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/windows nt 6.2/i.test(ua)) os = "Windows 8";
  else if (/windows nt 6.1/i.test(ua)) os = "Windows 7";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/cros/i.test(ua)) os = "Chrome OS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Device Detection
  let device = "Desktop";
  if (/ipad|tablet/i.test(ua)) device = "Tablet";
  else if (/mobile|iphone|ipod|android/i.test(ua)) device = "Mobile";

  // Browser Detection
  let browser = "Web Browser";
  if (/edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Apple Safari";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  return { device, browser, os };
}

/**
 * Fast asynchronous IP and location retrieval with timeout fallback
 */
export async function getClientIpAndLocation(): Promise<{ ipAddress: string; location: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal }).catch(
      () => null,
    );
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.ip) {
        const city = data.city || "";
        const region = data.region || "";
        const country = data.country_name || "";
        const locParts = [city, region, country].filter(Boolean);
        return {
          ipAddress: data.ip,
          location: locParts.length > 0 ? locParts.join(", ") : "Not Available",
        };
      }
    }
  } catch {
    // Timeout or network restriction fallback
  }

  return {
    ipAddress: "127.0.0.1 (Client)",
    location: "Not Available",
  };
}

/**
 * Triggers Admin Login Email Notification asynchronously.
 * Guarantees zero duplicate emails per session and zero login delays.
 */
export function notifyAdminOnLogin(params: NotifyAdminLoginParams): void {
  const { userName, userEmail, loginMethod, userId, sessionKey } = params;

  if (!userEmail || !userEmail.includes("@")) {
    return;
  }

  // Session deduplication check using sessionStorage
  const storageKey = "cs_admin_login_notified";
  const uniqueSessionId = sessionKey || userId || `${userEmail}_${new Date().toDateString()}`;

  try {
    if (typeof sessionStorage !== "undefined") {
      const alreadyNotified = sessionStorage.getItem(storageKey);
      if (alreadyNotified === uniqueSessionId) {
        // Skip sending - email already sent for this session!
        return;
      }
      sessionStorage.setItem(storageKey, uniqueSessionId);
    }
  } catch (err) {
    console.warn("sessionStorage check failed:", err);
  }

  // Execute asynchronously in background
  (async () => {
    try {
      const deviceInfo = getClientDeviceInfo();
      const ipAndLoc = await getClientIpAndLocation();

      const formattedTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "medium",
      });

      const payload: AdminLoginAlertPayload = {
        userName: userName || userEmail.split("@")[0],
        userEmail: userEmail,
        loginTime: formattedTime,
        ipAddress: ipAndLoc.ipAddress,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        loginMethod: loginMethod,
        location: ipAndLoc.location,
      };

      if (typeof window !== "undefined") {
        await sendAdminLoginAlertServerFn({ data: payload });
      }
    } catch (err) {
      console.error("[ADMIN LOGIN NOTIFICATION FAILED]", err);
    }
  })();
}

/**
 * Clears session lock upon logout
 */
export function clearAdminLoginNotificationLock(): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("cs_admin_login_notified");
      sessionStorage.removeItem("pending_google_login");
    }
  } catch (err) {
    console.warn("Failed to clear notification lock:", err);
  }
}

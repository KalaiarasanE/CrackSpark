export type EmailType =
  | "email_confirmation"
  | "welcome"
  | "password_reset"
  | "change_email"
  | "premium_approved"
  | "premium_rejected"
  | "payment_received"
  | "payment_rejected"
  | "account_security_alert"
  | "login_alert";

export interface EmailData {
  userName?: string;
  userEmail?: string;
  verificationUrl?: string;
  resetUrl?: string;
  dashboardUrl?: string;
  portalUrl?: string;
  subscriptionUrl?: string;
  securityUrl?: string;
  invoiceUrl?: string;
  planName?: string;
  amount?: string | number;
  transactionId?: string;
  adminRemark?: string;
  expiryDate?: string;
  loginTime?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

// Master HTML Shell with CrackSpark Premium Theme (#0B6B3A Dark Emerald, #F4B400 Gold, White)
const wrapEmailTemplate = (
  title: string,
  bodyContent: string,
  appOrigin: string = "https://crackspark.in",
): string => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #061e14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    div[style*="margin: 16px 0"] {
      margin: 0 !important;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    a {
      text-decoration: none;
    }
    .btn-primary:hover {
      background-color: #d99b00 !important;
      box-shadow: 0 6px 24px rgba(244, 180, 0, 0.5) !important;
      transform: translateY(-1px);
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 10px !important;
      }
      .card-body {
        padding: 24px 18px !important;
      }
      .heading-title {
        font-size: 22px !important;
      }
      .btn-primary {
        width: 100% !important;
        display: block !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      .feature-col {
        width: 100% !important;
        display: block !important;
        margin-bottom: 12px !important;
      }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #061e14;">
  <center style="width: 100%; background-color: #061e14; padding: 30px 0;">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">
    <tr>
    <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
    <![endif]-->
    <div style="max-width: 600px; margin: 0 auto;" class="email-container">
      
      <!-- TOP HEADER / BRAND LOGO -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 20px 0 25px 0; text-align: center;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td style="vertical-align: middle;">
                  <img src="${appOrigin}/logo.png" alt="CrackSpark Logo" width="54" height="54" style="display: block; border-radius: 50%; border: 2px solid #F4B400; box-shadow: 0 0 15px rgba(244, 180, 0, 0.4);" />
                </td>
                <td style="padding-left: 14px; text-align: left; vertical-align: middle;">
                  <div style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">
                    CRACK<span style="color: #F4B400;">SPARK</span>
                  </div>
                  <div style="font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #6EE7B7; text-transform: uppercase; margin-top: 2px;">
                    GOVERNMENT EXAM PORTAL
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- MAIN CARD CONTENT -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0F2D1F; border: 1px solid rgba(244, 180, 0, 0.3); border-radius: 18px; box-shadow: 0 14px 45px rgba(0, 0, 0, 0.6); overflow: hidden;">
        <!-- GOLD DECORATIVE ACCENT BAR -->
        <tr>
          <td height="4" style="background: linear-gradient(90deg, #F4B400 0%, #6EE7B7 50%, #F4B400 100%); font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 36px 32px;" class="card-body">
            <!-- INNER SMALL BRAND BADGE -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
              <tr>
                <td>
                  <span style="display: inline-flex; items-center; background: rgba(11, 107, 58, 0.4); border: 1px solid rgba(244, 180, 0, 0.3); border-radius: 20px; padding: 6px 14px;">
                    <img src="${appOrigin}/logo.png" width="18" height="18" style="vertical-align: middle; border-radius: 50%; margin-right: 8px;" alt="logo" />
                    <span style="color: #F4B400; font-size: 12px; font-weight: 700; font-family: 'Segoe UI', sans-serif; letter-spacing: 1px; text-transform: uppercase;">Official CrackSpark Verification</span>
                  </span>
                </td>
              </tr>
            </table>

            ${bodyContent}
          </td>
        </tr>
      </table>

      <!-- FOOTER -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 28px;">
        <tr>
          <td style="text-align: center; padding: 10px 20px; font-size: 13px; line-height: 20px; color: #9CA3AF; font-family: 'Segoe UI', sans-serif;">
            <p style="margin: 0 0 10px 0; color: #E5E7EB;">Need Help? <a href="mailto:support@crackspark.in" style="color: #F4B400; font-weight: 700; text-decoration: underline;">Contact CrackSpark Support</a></p>
            <p style="margin: 0 0 14px 0; opacity: 0.8;">© 2026 CrackSpark Government Exam Portal. All rights reserved.</p>

            <!-- SOCIAL LINKS -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="https://facebook.com" target="_blank" style="color: #F4B400; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.06); border-radius: 6px; padding: 4px 10px; display: inline-block;">Facebook</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="https://instagram.com" target="_blank" style="color: #F4B400; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.06); border-radius: 6px; padding: 4px 10px; display: inline-block;">Instagram</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="https://linkedin.com" target="_blank" style="color: #F4B400; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.06); border-radius: 6px; padding: 4px 10px; display: inline-block;">LinkedIn</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="https://youtube.com" target="_blank" style="color: #F4B400; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.06); border-radius: 6px; padding: 4px 10px; display: inline-block;">YouTube</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </div>
    <!--[if mso | IE]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>
`;

export function getEmailSubjectAndHtml(
  type: EmailType,
  data: EmailData,
): { subject: string; html: string } {
  const name = data.userName || "Aspirant";
  const appOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://crackspark.in";

  const supabaseUrl =
    (typeof process !== "undefined" && process.env.VITE_SUPABASE_URL) ||
    "https://wspaqtirqslarbzrnkhf.supabase.co";

  const defaultVerifyUrl =
    data.verificationUrl ||
    `${supabaseUrl}/auth/v1/verify?type=signup&email=${encodeURIComponent(data.userEmail || "")}&redirect_to=${encodeURIComponent(appOrigin + "/auth/callback")}`;

  const defaultResetUrl = data.resetUrl || `${appOrigin}/user-login`;
  const defaultDashboardUrl = data.dashboardUrl || `${appOrigin}/`;
  const defaultSubscriptionUrl = data.subscriptionUrl || `${appOrigin}/subscription`;

  switch (type) {
    case "email_confirmation": {
      const subject = "Welcome to CrackSpark – Confirm Your Email Address";
      const body = `
        <!-- HERO BANNER -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #0B6B3A 0%, #064E3B 100%); border-radius: 14px; border-left: 4px solid #F4B400; margin-bottom: 26px;">
          <tr>
            <td style="padding: 20px 24px;">
              <div style="font-size: 18px; font-weight: 900; color: #F4B400; margin-bottom: 4px; font-family: 'Segoe UI', sans-serif;">
                Prepare Smart. Perform Better.
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">
                India's Premier Government Exam Preparation Platform
              </div>
            </td>
          </tr>
        </table>

        <!-- GREETING & TEXT -->
        <h1 class="heading-title" style="margin: 0 0 14px 0; font-size: 26px; font-weight: 900; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">
          Welcome to CrackSpark, <span style="color: #F4B400;">${name}</span>! 🎉
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 25px; color: #E5E7EB; font-family: 'Segoe UI', sans-serif;">
          Thank you for creating your account. You're just one click away from accessing India's premium government exam preparation platform.
        </p>
        <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 25px; color: #E5E7EB; font-family: 'Segoe UI', sans-serif;">
          Please verify your email address to complete your registration and activate your account.
        </p>

        <!-- VERIFICATION CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 32px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #F4B400; box-shadow: 0 8px 25px rgba(244, 180, 0, 0.4);">
              <a href="${defaultVerifyUrl}" target="_blank" class="btn-primary" style="font-size: 16px; font-family: 'Segoe UI', sans-serif; font-weight: 900; color: #061E14; text-decoration: none; border-radius: 12px; padding: 16px 40px; border: 1px solid #F4B400; display: inline-block; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                Confirm Email
              </a>
            </td>
          </tr>
        </table>

        <!-- FEATURES SECTION (8 CARDS WITH ICONS) -->
        <div style="margin-bottom: 28px;">
          <div style="font-size: 16px; font-weight: 800; color: #F4B400; margin-bottom: 16px; font-family: 'Segoe UI', sans-serif; text-transform: uppercase; letter-spacing: 1px;">
            ⚡ What You Get Access To:
          </div>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">📚 Premium Study Materials</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">Subject notes & toppers guides</div>
                </div>
              </td>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">📝 Mock Tests</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">Full-length pattern tests</div>
                </div>
              </td>
            </tr>
            <tr>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">📄 Previous Year Papers</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">Solved question banks & keys</div>
                </div>
              </td>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">📈 Performance Analytics</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">Real-time accuracy tracking</div>
                </div>
              </td>
            </tr>
            <tr>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">🧠 AI Study Planner</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">Custom schedule generator</div>
                </div>
              </td>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">📰 Daily Current Affairs</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">Daily & monthly updates</div>
                </div>
              </td>
            </tr>
            <tr>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">🔔 Exam Notifications</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">TNPSC, UPSC, SSC, Banking</div>
                </div>
              </td>
              <td class="feature-col" width="50%" style="padding: 6px; vertical-align: top;">
                <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px 14px;">
                  <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">🏆 Preparation Dashboard</div>
                  <div style="font-size: 12px; color: #9CA3AF; margin-top: 3px;">All-in-one aspirant hub</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- SECURITY NOTICE -->
        <div style="background-color: rgba(255, 255, 255, 0.04); border-radius: 10px; padding: 14px 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="margin: 0; font-size: 13px; line-height: 20px; color: #9CA3AF; font-family: 'Segoe UI', sans-serif;">
            🔒 <strong>For your security:</strong> This verification link expires automatically. If you didn't create an account with CrackSpark, you can safely ignore this email.
          </p>
        </div>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "welcome": {
      const subject = "Welcome to CrackSpark – Your Complete Exam Prep Ecosystem";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 26px; font-weight: 900; color: #FFFFFF;">
          Welcome Aboard, <span style="color: #F4B400;">${name}</span>! 🎉
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 25px; color: #E5E7EB;">
          We are thrilled to have you join <strong>CrackSpark</strong>, India's premier government exam preparation portal.
        </p>

        <!-- FEATURE HIGHLIGHTS -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #E5E7EB; font-size: 14px;">
              📚 <strong>Topper-Curated Study Materials</strong> (TNPSC, UPSC, SSC, Banking, Railways)
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #E5E7EB; font-size: 14px;">
              ⏱️ <strong>Real-Time Exam Timers & Target Deadlines</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #E5E7EB; font-size: 14px;">
              📈 <strong>AI-Powered Performance Analytics</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #E5E7EB; font-size: 14px;">
              📝 <strong>Verified Government Papers & Mock Tests</strong>
            </td>
          </tr>
        </table>

        <!-- CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #F4B400;">
              <a href="${defaultDashboardUrl}" target="_blank" class="btn-primary" style="font-size: 16px; font-weight: 900; color: #061E14; padding: 16px 36px; display: inline-block;">
                Explore CrackSpark Ecosystem
              </a>
            </td>
          </tr>
        </table>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "password_reset": {
      const subject = "Reset Your CrackSpark Password";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">
          Password Reset Request
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          We received a request to reset the password for your CrackSpark account. Click the button below to set a new password.
        </p>

        <!-- CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 32px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #F4B400;">
              <a href="${defaultResetUrl}" target="_blank" class="btn-primary" style="font-size: 16px; font-weight: 900; color: #061E14; padding: 16px 36px; display: inline-block;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>

        <div style="background-color: rgba(239, 68, 68, 0.1); border-radius: 10px; padding: 14px 16px; border: 1px solid rgba(239, 68, 68, 0.25);">
          <p style="margin: 0; font-size: 13px; line-height: 20px; color: #FCA5A5;">
            ⚠️ If you did not request a password reset, please ignore this email or contact CrackSpark Support immediately.
          </p>
        </div>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "change_email": {
      const subject = "Verify Your New CrackSpark Email Address";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">
          Email Change Verification
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          You requested to update your email address on CrackSpark. Please verify your new email address by clicking the button below.
        </p>

        <!-- CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 32px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #F4B400;">
              <a href="${defaultVerifyUrl}" target="_blank" class="btn-primary" style="font-size: 16px; font-weight: 900; color: #061E14; padding: 16px 36px; display: inline-block;">
                Verify New Email Address
              </a>
            </td>
          </tr>
        </table>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "premium_approved": {
      const subject = "Congratulations! Your CrackSpark Premium is Activated";
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">🌟</span>
        </div>
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 26px; font-weight: 900; color: #F4B400; text-align: center;">
          CrackSpark Premium Activated!
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Great news! Your payment for <strong>${data.planName || "CrackSpark Premium Plan"}</strong> has been verified and approved by our administration team.
        </p>

        <!-- RECEIPT BOX -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255,255,255,0.05); border: 1px dashed #F4B400; border-radius: 12px; margin-bottom: 28px;">
          <tr>
            <td style="padding: 18px 22px;">
              <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 6px;">Plan: <strong style="color: #FFFFFF;">${data.planName || "Premium Access"}</strong></div>
              <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 6px;">Amount Paid: <strong style="color: #6EE7B7;">₹${data.amount || "499"}</strong></div>
              <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 6px;">Transaction ID: <strong style="color: #F4B400;">${data.transactionId || "N/A"}</strong></div>
              <div style="font-size: 13px; color: #9CA3AF;">Expiry Date: <strong style="color: #FFFFFF;">${data.expiryDate || "30 Days from today"}</strong></div>
            </td>
          </tr>
        </table>

        <!-- CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #F4B400;">
              <a href="${defaultSubscriptionUrl}" target="_blank" class="btn-primary" style="font-size: 16px; font-weight: 900; color: #061E14; padding: 16px 36px; display: inline-block;">
                Access Premium Features
              </a>
            </td>
          </tr>
        </table>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "premium_rejected": {
      const subject = "Update on Your CrackSpark Premium Subscription Request";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #EF4444;">
          Subscription Request Update
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Your recent request for <strong>${data.planName || "CrackSpark Premium"}</strong> could not be approved at this time.
        </p>

        <!-- REMARKS BOX -->
        <div style="background-color: rgba(239, 68, 68, 0.1); border-radius: 10px; padding: 16px 20px; border-left: 4px solid #EF4444; margin-bottom: 28px;">
          <div style="font-size: 13px; font-weight: 700; color: #FCA5A5; margin-bottom: 6px;">ADMIN REMARKS:</div>
          <div style="font-size: 14px; color: #FFFFFF; font-style: italic;">
            "${data.adminRemark || "Verification document / transaction ID did not match our bank records."}"
          </div>
        </div>

        <!-- CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #F4B400;">
              <a href="${defaultSubscriptionUrl}" target="_blank" class="btn-primary" style="font-size: 16px; font-weight: 900; color: #061E14; padding: 16px 36px; display: inline-block;">
                Update Payment Details
              </a>
            </td>
          </tr>
        </table>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "payment_received": {
      const subject = "Payment Received – CrackSpark Order Invoice";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #6EE7B7;">
          Payment Received! 🧾
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          We have successfully received your payment. Below is your official CrackSpark transaction receipt:
        </p>

        <!-- INVOICE TABLE -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.04); border-radius: 12px; margin-bottom: 28px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <tr>
            <td style="padding: 18px 22px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 13px; color: #9CA3AF; padding-bottom: 8px;">Order Ref:</td>
                  <td align="right" style="font-size: 13px; color: #FFFFFF; font-weight: 700; padding-bottom: 8px;">#${data.transactionId || "CS-" + Date.now().toString(36).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #9CA3AF; padding-bottom: 8px;">Item:</td>
                  <td align="right" style="font-size: 13px; color: #FFFFFF; font-weight: 700; padding-bottom: 8px;">${data.planName || "CrackSpark Exam Ecosystem"}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #9CA3AF;">Total Paid:</td>
                  <td align="right" style="font-size: 16px; color: #F4B400; font-weight: 900;">₹${data.amount || "499"}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "payment_rejected": {
      const subject = "Payment Unsuccessful – Action Required";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #EF4444;">
          Payment Failed
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Your recent transaction of <strong>₹${data.amount || "499"}</strong> could not be processed. No funds were debited to your subscription.
        </p>

        <!-- CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 32px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #F4B400;">
              <a href="${defaultSubscriptionUrl}" target="_blank" class="btn-primary" style="font-size: 16px; font-weight: 900; color: #061E14; padding: 16px 36px; display: inline-block;">
                Retry Payment
              </a>
            </td>
          </tr>
        </table>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "account_security_alert": {
      const subject = "CrackSpark Security Alert – Account Action Required";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #F59E0B;">
          🔒 Security Alert
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          We detected an important security event on your CrackSpark account.
        </p>

        <div style="background-color: rgba(245, 158, 11, 0.1); border-radius: 10px; padding: 16px 20px; border: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 28px;">
          <div style="font-size: 13px; color: #9CA3AF;">Time: <strong style="color: #FFFFFF;">${data.loginTime || new Date().toUTCString()}</strong></div>
          <div style="font-size: 13px; color: #9CA3AF; margin-top: 4px;">IP Address: <strong style="color: #FFFFFF;">${data.ipAddress || "Protected IP"}</strong></div>
          <div style="font-size: 13px; color: #9CA3AF; margin-top: 4px;">Device: <strong style="color: #FFFFFF;">${data.deviceInfo || "Web Browser"}</strong></div>
        </div>

        <!-- CTA BUTTON -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #EF4444;">
              <a href="${defaultResetUrl}" target="_blank" style="font-size: 16px; font-weight: 900; color: #FFFFFF; padding: 16px 36px; display: inline-block;">
                Secure My Account
              </a>
            </td>
          </tr>
        </table>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }

    case "login_alert": {
      const subject = "New Login Detected on Your CrackSpark Account";
      const body = `
        <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">
          New Login Notification 🔔
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Hello <strong style="color: #F4B400;">${name}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #E5E7EB;">
          Your CrackSpark account was logged into successfully.
        </p>

        <div style="background-color: rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 16px 20px; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px;">
          <div style="font-size: 13px; color: #9CA3AF;">Login Time: <strong style="color: #FFFFFF;">${data.loginTime || new Date().toLocaleString()}</strong></div>
          <div style="font-size: 13px; color: #9CA3AF; margin-top: 4px;">Account Email: <strong style="color: #F4B400;">${data.userEmail || name}</strong></div>
        </div>

        <p style="margin: 0; font-size: 13px; line-height: 20px; color: #9CA3AF;">
          If this was you, no action is required. If you did not log in, please reset your password immediately.
        </p>
      `;
      return { subject, html: wrapEmailTemplate(subject, body, appOrigin) };
    }
  }
}

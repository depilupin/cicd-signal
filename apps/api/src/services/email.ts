import { formatLogEntry } from "@signal/shared";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Core Resend delivery client
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      formatLogEntry("api", "warn", "RESEND_API_KEY is not configured; skipping email dispatch", {
        to,
        subject,
      })
    );
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const from = process.env.EMAIL_FROM || "Signal Security <billing@threadsecurity.in>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text: text || subject,
      }),
    });

    const data = (await res.json()) as { id?: string; message?: string; name?: string };

    if (!res.ok) {
      console.error(
        formatLogEntry("api", "error", `Resend API rejected email to ${to}: ${data.message || res.statusText}`, {
          status: res.status,
          error: data,
        })
      );
      return { success: false, error: data.message || `HTTP ${res.status}` };
    }

    console.log(
      formatLogEntry("api", "info", `Transactional email delivered via Resend to ${to} (${subject})`, {
        resendId: data.id,
      })
    );

    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      formatLogEntry("api", "error", `Network failure dispatching email via Resend to ${to}: ${message}`)
    );
    return { success: false, error: message };
  }
}

/**
 * 1. Business Scenario: Subscription Activation & Official Invoice Receipt
 */
export async function sendBillingReceiptEmail(params: {
  to: string;
  name: string;
  invoiceId: string;
  planName: string;
  amount: string;
  currentPeriodEnd: Date;
  paymentMethod?: { brand: string; last4: string };
}) {
  const { to, name, invoiceId, planName, amount, currentPeriodEnd, paymentMethod } = params;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const formattedDate = currentPeriodEnd.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cardDesc = paymentMethod
    ? `${paymentMethod.brand} ending in ${paymentMethod.last4}`
    : "Card on file";

  const subject = `[Receipt] Your Signal ${planName} Subscription is Active (${invoiceId})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #07080c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #0e1119; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .header { border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 24px; }
    .logo { color: #3ee0a0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; text-decoration: none; }
    .badge { display: inline-block; background: rgba(62,224,160,0.12); color: #3ee0a0; border: 1px solid rgba(62,224,160,0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 9999px; }
    h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin: 16px 0 8px 0; }
    p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 16px 0; }
    .invoice-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
    .invoice-table th { text-align: left; color: #71717a; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .invoice-table td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e4e4e7; }
    .total-row td { font-size: 16px; font-weight: 700; color: #3ee0a0; border-top: 1px solid rgba(255,255,255,0.15); border-bottom: none; padding-top: 16px; }
    .features-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin: 24px 0; }
    .features-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #3ee0a0; margin-bottom: 8px; }
    .feature-item { font-size: 13px; color: #d4d4d8; margin: 6px 0; display: flex; align-items: center; }
    .btn { display: inline-block; background-color: #3ee0a0; color: #07080c; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 9999px; margin-right: 12px; }
    .btn-secondary { display: inline-block; background-color: rgba(255,255,255,0.06); color: #ffffff; border: 1px solid rgba(255,255,255,0.12); font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 9999px; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #52525b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <a href="${frontendUrl}" class="logo">● Signal</a>
        <span style="float: right;" class="badge">Paid & Active</span>
      </div>

      <h1>Subscription Activated</h1>
      <p>Hello ${name}, thank you for subscribing to Signal. Your dedicated CI/CD security hunting subscription is now live and provisioned.</p>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Details</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${planName} Plan</strong><br><span style="color:#71717a; font-size:11px;">Invoice ${invoiceId}</span></td>
            <td>Renews ${formattedDate}<br><span style="color:#71717a; font-size:11px;">${cardDesc}</span></td>
            <td style="text-align: right; font-family: monospace;">${amount}</td>
          </tr>
          <tr>
            <td>AST Security Rules Engine (10 Vectors)</td>
            <td>Full Repository Analysis</td>
            <td style="text-align: right; color:#3ee0a0;">Included</td>
          </tr>
          <tr>
            <td>Priority Background Concurrency</td>
            <td>BullMQ Dedicated Workers</td>
            <td style="text-align: right; color:#3ee0a0;">Included</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Total Paid (USD)</td>
            <td style="text-align: right; font-family: monospace;">${amount}</td>
          </tr>
        </tbody>
      </table>

      <div class="features-box">
        <div class="features-title">Unlocked Entitlements</div>
        <div class="feature-item">✓ Automated CI/CD AST workflow evaluation</div>
        <div class="feature-item">✓ Secret exposure, permission escalation, and unpinned actions detection</div>
        <div class="feature-item">✓ Real-time repository monitoring and exportable reports</div>
      </div>

      <div style="margin-top: 32px;">
        <a href="${frontendUrl}/app" class="btn">Open Scanner Workbench</a>
        <a href="${frontendUrl}/billing" class="btn-secondary">Manage Billing</a>
      </div>
    </div>

    <div class="footer">
      <p>Signal Security • Automated CI/CD Workflow Vulnerability Engine</p>
      <p>This email serves as an official receipt. For tax inquiries, visit your <a href="${frontendUrl}/billing" style="color: #a1a1aa;">Billing Portal</a>.</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, html });
}

/**
 * 2. Business Scenario: Researcher Welcome & Account Creation
 */
export async function sendWelcomeEmail(params: { to: string; name: string }) {
  const { to, name } = params;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const subject = "Welcome to Signal — CI/CD Workflow Security Engine";

  const html = `
<!DOCTYPE html>
<html>
<body style="background-color: #07080c; color: #f4f4f5; font-family: sans-serif; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0e1119; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px;">
    <h2 style="color: #3ee0a0; margin-top: 0;">● Welcome to Signal</h2>
    <p>Hello ${name},</p>
    <p>Your researcher account has been successfully created. You now have access to Signal's dedicated CI/CD workflow security evaluation platform.</p>
    <p>To run evaluations, discover unpinned GitHub Actions, and analyze trigger privilege vulnerabilities, choose your dedicated research tier.</p>
    <div style="margin: 28px 0;">
      <a href="${frontendUrl}/pricing" style="background-color: #3ee0a0; color: #07080c; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 9999px;">View Dedicated Pricing</a>
    </div>
    <p style="font-size: 12px; color: #71717a;">Signal Security Platform</p>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, html });
}

/**
 * 3. Business Scenario: Subscription Cancellation Notice
 */
export async function sendSubscriptionCancelledEmail(params: {
  to: string;
  name: string;
  planName: string;
  currentPeriodEnd: Date;
}) {
  const { to, name, planName, currentPeriodEnd } = params;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const formattedDate = currentPeriodEnd.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Signal Subscription Auto-Renew Cancelled (${planName})`;

  const html = `
<!DOCTYPE html>
<html>
<body style="background-color: #07080c; color: #f4f4f5; font-family: sans-serif; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0e1119; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px;">
    <h2 style="color: #f59e0b; margin-top: 0;">Subscription Auto-Renew Notice</h2>
    <p>Hello ${name},</p>
    <p>This confirms that auto-renewal for your <strong>${planName}</strong> plan has been cancelled as requested.</p>
    <p>Your research scanning quota and full 10-vector security rule engine will remain active until <strong>${formattedDate}</strong>. You will not be charged again.</p>
    <p>If you change your mind, you can reactivate auto-renewal anytime before ${formattedDate}.</p>
    <div style="margin: 28px 0;">
      <a href="${frontendUrl}/billing" style="background-color: rgba(255,255,255,0.1); color: #ffffff; border: 1px solid rgba(255,255,255,0.2); font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 9999px;">Manage Billing</a>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, html });
}

/**
 * 4. Business Scenario: Subscription Reactivation Notice
 */
export async function sendSubscriptionReactivatedEmail(params: {
  to: string;
  name: string;
  planName: string;
  currentPeriodEnd: Date;
}) {
  const { to, name, planName, currentPeriodEnd } = params;
  const formattedDate = currentPeriodEnd.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Signal Subscription Reactivated (${planName})`;

  const html = `
<!DOCTYPE html>
<html>
<body style="background-color: #07080c; color: #f4f4f5; font-family: sans-serif; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0e1119; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px;">
    <h2 style="color: #3ee0a0; margin-top: 0;">● Subscription Auto-Renew Active</h2>
    <p>Hello ${name},</p>
    <p>Your <strong>${planName}</strong> subscription has been successfully reactivated. Your continuous CI/CD security scanning access will renew automatically on <strong>${formattedDate}</strong>.</p>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, html });
}

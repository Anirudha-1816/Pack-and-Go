// emailTemplates.js
const SITE_URL = process.env.SITE_URL || "http://localhost:5173";


// Stops user input from breaking (or injecting into) the email HTML
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const withBreaks = (s) => esc(s).replace(/\r?\n/g, "<br>");
const firstName = (name = "") => esc(name.trim().split(" ")[0] || "there");

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const GREEN = "#00483a";
const CORAL = "#f97316";

// Shared outer layout (header + footer) so both emails look related
function layout({ preheader, headerTitle, body, footer }) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#eef2f0;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f0;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:24px;overflow:hidden;font-family:${FONT};">

        <!-- Header -->
        <tr>
          <td bgcolor="${GREEN}" style="background:${GREEN};background-image:linear-gradient(135deg,#00483a,#0a3d5c);padding:32px 36px;">
            <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Pack<span style="color:${CORAL};">&amp;</span>Go</div>
            <div style="margin-top:6px;font-size:13px;color:#bfd9d1;">${headerTitle}</div>
          </td>
        </tr>

        ${body}

        <!-- Footer -->
        <tr>
          <td style="background:#f6f8f7;padding:24px 36px;border-top:1px solid #e5ebe8;font-size:13px;line-height:1.6;color:#6b7a75;">
            ${footer}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const button = (href, label, color = CORAL) =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:700;text-decoration:none;">${label}</a>`;

// 1) Thank-you email for the visitor
function thankYouEmail({ name, message }) {
  const step = (n, title, text) => `
    <tr>
      <td width="40" valign="top" style="padding:0 0 18px;">
        <div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:#e6f0ed;color:${GREEN};font-size:14px;font-weight:800;text-align:center;">${n}</div>
      </td>
      <td valign="top" style="padding:0 0 18px;">
        <div style="font-size:15px;font-weight:700;color:#0f172a;">${title}</div>
        <div style="font-size:14px;line-height:1.6;color:#5b6b66;">${text}</div>
      </td>
    </tr>`;

  const body = `
    <tr>
      <td style="padding:36px 36px 8px;">
        <h1 style="margin:0 0 12px;font-size:30px;line-height:1.15;letter-spacing:-0.5px;color:${GREEN};">Thank you, ${firstName(name)}! 🌿</h1>
        <p style="margin:0;font-size:16px;line-height:1.7;color:#4b5563;">
          Your message reached us safely. Our travel team is already reading it,
          and we'll get back to you within <strong style="color:${GREEN};">24 hours</strong>.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#f3f7f5;border-left:4px solid ${CORAL};border-radius:12px;padding:16px 20px;">
              <div style="margin-bottom:6px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7a75;">Your message</div>
              <div style="font-size:15px;line-height:1.7;color:#334155;">${withBreaks(message)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 36px 0;">
        <div style="margin-bottom:16px;font-size:18px;font-weight:800;color:${GREEN};">What happens next</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${step(1, "We read your message", "Every note is read by a real person, not a bot.")}
          ${step(2, "A travel expert reaches out", "We'll contact you by email or phone, whichever you prefer.")}
          ${step(3, "We plan it together", "From dreamy ideas to booked tickets, we'll guide you.")}
        </table>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:8px 36px 36px;">
        ${button(`${SITE_URL}/packages`, "Explore our trips")}
      </td>
    </tr>`;

  return layout({
    preheader: "We got your message and will reply within 24 hours.",
    headerTitle: "Memories made, journeys completed 🌍",
    body,
    footer: `Want to add something? Just reply to this email, we're happy to help.<br>
             <span style="color:#9aa8a3;">You're receiving this because you contacted Pack&amp;Go through our website.<br>
             © ${new Date().getFullYear()} Pack&amp;Go. All rights reserved.</span>`,
  });
}

// 2) Notification email for you (the owner)
function adminNotificationEmail({ name, email, phone, message }) {
  const row = (label, value) => `
    <tr>
      <td style="padding:10px 0;width:110px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7a75;">${label}</td>
      <td style="padding:10px 0;font-size:15px;color:#0f172a;">${value}</td>
    </tr>`;

  const received = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const body = `
    <tr>
      <td style="padding:32px 36px 8px;">
        <h1 style="margin:0 0 6px;font-size:26px;line-height:1.2;letter-spacing:-0.5px;color:${GREEN};">${esc(name)} just reached out 💌</h1>
        <p style="margin:0;font-size:14px;color:#6b7a75;">Received ${received}</p>
      </td>
    </tr>

    <tr>
      <td style="padding:16px 36px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7f5;border-radius:16px;">
          <tr><td style="padding:8px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${row("Name", esc(name))}
              ${row("Email", `<a href="mailto:${esc(email)}" style="color:${GREEN};font-weight:600;">${esc(email)}</a>`)}
              ${row("Phone", `<a href="tel:${esc(phone)}" style="color:${GREEN};font-weight:600;">${esc(phone)}</a>`)}
            </table>
          </td></tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 36px 0;">
        <div style="margin-bottom:8px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7a75;">Message</div>
        <div style="padding:18px 20px;border:1px solid #e5ebe8;border-radius:16px;background:#fbfcfb;font-size:15px;line-height:1.75;color:#334155;">${withBreaks(message)}</div>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:28px 36px 36px;">
        ${button(`mailto:${esc(email)}?subject=${encodeURIComponent("Re: Your message to Pack&Go")}`, `Reply to ${firstName(name)}`, GREEN)}
        &nbsp;
        ${button(`tel:${esc(phone)}`, "Call now")}
      </td>
    </tr>`;

  return layout({
    preheader: `${esc(name)} sent a message through your contact form.`,
    headerTitle: "New contact form message",
    body,
    footer: `Sent automatically from your Pack&amp;Go contact form.<br>
             <span style="color:#9aa8a3;">Tip: hit reply and your answer goes straight to ${firstName(name)}.</span>`,
  });
}

export { thankYouEmail, adminNotificationEmail };
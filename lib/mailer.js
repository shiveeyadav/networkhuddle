// Server-only pluggable mailer.
// Order: Resend (RESEND_API_KEY) -> SMTP (SMTP_HOST) -> console log fallback.
import nodemailer from 'nodemailer';

let smtpTransport = null;

function fromAddress() {
  return process.env.MAIL_FROM || 'NetworkHuddle <no-reply@networkhuddle.com>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textToHtml(text) {
  const body = escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    .replace(/\n/g, '<br>');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1d2b2a">${body}</div>`;
}

async function sendViaResend({ to, subject, text, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromAddress(), to: [to], subject, text, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function sendViaSmtp({ to, subject, text, html }) {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
    });
  }
  await smtpTransport.sendMail({ from: fromAddress(), to, subject, text, html });
}

// Sends an email. Never throws: failures are logged so a mail outage
// doesn't break the user-facing action.
export async function sendMail({ to, subject, text }) {
  const html = textToHtml(text);
  try {
    if (process.env.RESEND_API_KEY) {
      await sendViaResend({ to, subject, text, html });
    } else if (process.env.SMTP_HOST) {
      await sendViaSmtp({ to, subject, text, html });
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `\n[mailer] No RESEND_API_KEY or SMTP_HOST set. Email not sent, logged instead.\n` +
          `  To: ${to}\n  Subject: ${subject}\n  ----\n${text}\n  ----\n`
      );
    }
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mailer] failed to send email to', to, err);
    return false;
  }
}

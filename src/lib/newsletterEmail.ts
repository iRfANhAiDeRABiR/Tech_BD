import nodemailer from "nodemailer";

const DISCOUNT_CODE = process.env.NEWSLETTER_DISCOUNT_CODE ?? "TECHBD10";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u003Clt;")
    .replace(/>/g, "\u003Egt;")
    .replace(/"/g, "\u0022quot;")
    .replace(/'/g, "\u0027#039;");
}

export async function sendNewsletterWelcomeEmail(email: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: String(process.env.SMTP_SECURE ?? "false") === "true",
    auth: { user, pass },
    // Some SMTP providers present a self-signed/intermediate certificate that
    // Node does not trust by default; match the behavior of order emails.
    tls: {
      rejectUnauthorized:
        String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED ?? "false") === "true",
    },
  });

  const from =
    process.env.SMTP_FROM ?? "Tech Solutions BD <no-reply@techsolutions.bd>";
  const safeEmail = escapeHtml(email);

  const textBody = `Welcome to Tech Solutions BD!

Thanks for subscribing. Here is your exclusive discount code:

    ${DISCOUNT_CODE}  -  10% OFF your first order

Use it at checkout on techsolutions.bd. Weekly deals on genuine
software licenses are on the way.`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Welcome to Tech Solutions BD</title>
</head>
<body style="margin:0;padding:0;background:#f4f5fa;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fa;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(20,20,43,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#5b3df5,#8b5cf6);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.5px;">Tech Solutions BD</h1>
              <p style="margin:8px 0 0;color:#e6e1ff;font-size:14px;">Genuine Software Licenses</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#14142b;font-size:22px;">Welcome aboard! 🎉</h2>
              <p style="margin:0 0 24px;color:#55556d;font-size:15px;line-height:1.6;">
                Thanks for subscribing to our newsletter. You now get first access
                to exclusive deals on genuine Windows, Office and other software licenses.
              </p>

              <!-- Discount card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ff;border:2px dashed #7c3aed;border-radius:12px;margin:0 0 28px;">
                <tr>
                  <td style="padding:28px 20px;text-align:center;">
                    <p style="margin:0 0 10px;color:#6b6b80;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your exclusive welcome offer</p>
                    <p style="margin:0 0 6px;font-size:34px;font-weight:bold;letter-spacing:4px;color:#5b3df5;">${DISCOUNT_CODE}</p>
                    <p style="margin:0;color:#6b6b80;font-size:14px;">10% off your first order</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="border-radius:10px;background:#5b3df5;">
                    <a href="https://www.techsolutions.bd" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">Start Shopping</a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#8a8aa0;font-size:13px;line-height:1.6;">
                Simply enter the code at checkout. Keep an eye on your inbox —
                weekly deals are coming your way.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#fafafd;border-top:1px solid #ececf3;">
              <p style="margin:0;color:#9a9ab0;font-size:12px;line-height:1.6;">
                You received this email because ${safeEmail} subscribed at Tech Solutions BD.
                If this wasn't you, you can safely ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from,
    to: email,
    subject: "🎉 Welcome! Your 10% Off Code Inside — Tech Solutions BD",
    text: textBody,
    html: htmlBody,
  });
}
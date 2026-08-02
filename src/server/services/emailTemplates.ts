// Shared HTML wrapper for every transactional email this app sends -
// previously every sendEmail() call passed text only, so real emails
// (verification, password reset, invitations) looked like bare links,
// not something a legitimate product sent. Email clients don't render
// custom web fonts reliably, so this uses a system font stack rather
// than Inter, but keeps the same near-black/accent-blue identity as the
// rest of 3Stone One (see globals.css's brand tokens).
export function renderEmailHtml(opts: { heading: string; bodyHtml: string; ctaLabel: string; ctaUrl: string }): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#050505;padding:20px 28px;">
                <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:-0.01em;">3Stone One</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#111318;">${opts.heading}</h1>
                <div style="font-size:14.5px;line-height:1.6;color:#454b57;">${opts.bodyHtml}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="border-radius:9px;background:#6e93d6;">
                      <a href="${opts.ctaUrl}" style="display:inline-block;padding:11px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${opts.ctaLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:12px;color:#9aa1ad;">If the button doesn't work, copy and paste this link: <br />${opts.ctaUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

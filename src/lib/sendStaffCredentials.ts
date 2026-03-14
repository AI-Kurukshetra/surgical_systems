import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.FROM_EMAIL ?? "SmartOR <onboarding@resend.dev>";

export type SendCredentialsParams = {
  to: string;
  name: string;
  password: string;
  roleLabel: string;
};

/**
 * Sends login credentials by email.
 * If RESEND_API_KEY is not set, logs credentials and returns without error (for local dev).
 */
export async function sendLoginCredentials(params: SendCredentialsParams): Promise<{ ok: boolean; error?: string }> {
  const { to, name, password, roleLabel } = params;

  const html = `
    <h2>Your SmartOR ${roleLabel} Account</h2>
    <p>Hello${name ? ` ${name}` : ""},</p>
    <p>Your ${roleLabel.toLowerCase()} account has been created. Use the credentials below to sign in:</p>
    <ul>
      <li><strong>Email:</strong> ${to}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p>Please change your password after your first login.</p>
  `;

  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[sendLoginCredentials] RESEND_API_KEY not set. Credentials (for dev):`, { to, password });
    return { ok: true };
  }

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: `Your SmartOR ${roleLabel} Login Credentials`,
    html,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export type SendStaffCredentialsParams = SendCredentialsParams;

/** @deprecated Use sendLoginCredentials with roleLabel: "Staff" */
export async function sendStaffCredentials(params: SendStaffCredentialsParams): Promise<{ ok: boolean; error?: string }> {
  return sendLoginCredentials({ ...params, roleLabel: "Staff" });
}

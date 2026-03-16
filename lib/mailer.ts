import nodemailer from "nodemailer";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function asBool(value: string | undefined, defaultValue = false): boolean {
  if (value == null) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function buildFromAddress() {
  const name = process.env.SMTP_FROM_NAME || "Expense Docs";
  const email = required("SMTP_FROM_EMAIL");
  return `"${name}" <${email}>`;
}

export function createMailerTransport() {
  const host = required("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = asBool(process.env.SMTP_SECURE, true);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: required("SMTP_USER"),
      pass: required("SMTP_PASS"),
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export async function sendAuthEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const transporter = createMailerTransport();
  await transporter.sendMail({
    from: buildFromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

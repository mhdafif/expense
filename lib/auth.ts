import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { getTrustedOrigins } from "@/lib/auth-origin";
import { sendAuthEmail } from "@/lib/mailer";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Reset your password using this link: ${url}`,
        html: `<p>Reset your password using this link:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Verify your account using this link: ${url}`,
        html: `<p>Verify your account using this link:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  trustedOrigins: getTrustedOrigins(),
  plugins: [nextCookies()],
});

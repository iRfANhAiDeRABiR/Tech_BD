import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import crypto from "crypto";
import { compare } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { extractClientIp } from "@/lib/ip-utils";
import { checkAccessBan } from "@/lib/bans-store";
import {
  recordFailedAdminLogin,
  clearAdminLoginAttempts,
} from "@/lib/admin-brute-force";

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

// Admin session timeouts
const ADMIN_SESSION_MAX_AGE_SECONDS = 2 * 60 * 60; // 2 hours max session duration
const ADMIN_IDLE_TIMEOUT_SECONDS = 30 * 60; // 30 minutes idle timeout

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Extract client IP
        let clientIp = "127.0.0.1";
        if (req && "headers" in req && req.headers) {
          clientIp = extractClientIp(req.headers as any);
        } else {
          try {
            const { headers } = await import("next/headers");
            const h = await headers();
            clientIp = extractClientIp(h);
          } catch {
            // fallback
          }
        }

        // 1. Guard against banned IPs
        const banCheck = await checkAccessBan({ ip: clientIp });
        if (banCheck.isBanned) {
          return null;
        }

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          await recordFailedAdminLogin(clientIp);
          return null;
        }

        const inputEmail = parsed.data.email;
        const inputPassword = parsed.data.password;

        try {
          const admin = await prisma.adminUser.findUnique({
            where: { email: inputEmail },
          });

          if (admin?.isActive) {
            const validPassword = await compare(
              inputPassword,
              admin.passwordHash
            );

            if (validPassword) {
              clearAdminLoginAttempts(clientIp);
              return {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
              };
            }
          }
        } catch {
          // Fallback to env credentials below if DB is unreachable
        }

        const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const envPassword = process.env.ADMIN_PASSWORD;

        if (envEmail && envPassword && inputEmail === envEmail) {
          const inputPasswordBuf = crypto
            .createHash("sha256")
            .update(inputPassword)
            .digest();
          const envPasswordBuf = crypto
            .createHash("sha256")
            .update(envPassword)
            .digest();

          if (crypto.timingSafeEqual(inputPasswordBuf, envPasswordBuf)) {
            clearAdminLoginAttempts(clientIp);
            return {
              id: "env-admin-owner",
              email: envEmail,
              name: process.env.ADMIN_NAME || "Store Owner",
              role: "OWNER" as const,
            };
          }
        }

        // Credentials failed: record failed attempt & trigger automatic IP ban if threshold reached
        await recordFailedAdminLogin(clientIp, inputEmail);
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);

      if (user) {
        token.role = user.role;
        token.lastActive = now;
        return token;
      }

      // Check idle timeout
      if (token.lastActive && typeof token.lastActive === "number") {
        if (now - token.lastActive > ADMIN_IDLE_TIMEOUT_SECONDS) {
          return null;
        }
      }

      token.lastActive = now;
      return token;
    },
    session({ session, token }) {
      if (!token) return null as any;
      if (session?.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as "OWNER" | "ADMIN" | "SUPPORT";
      }
      return session;
    },
  },
});

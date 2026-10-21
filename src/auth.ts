import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) return null;

        try {
          const admin = await prisma.adminUser.findUnique({
            where: { email: parsed.data.email },
          });

          if (admin?.isActive) {
            const validPassword = await compare(
              parsed.data.password,
              admin.passwordHash,
            );

            if (validPassword) {
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

        if (
          envEmail &&
          envPassword &&
          parsed.data.email === envEmail &&
          parsed.data.password === envPassword
        ) {
          return {
            id: "env-admin-owner",
            email: envEmail,
            name: process.env.ADMIN_NAME || "Store Owner",
            role: "OWNER" as const,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as "OWNER" | "ADMIN" | "SUPPORT";
      }
      return session;
    },
  },
});
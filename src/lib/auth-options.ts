/**
 * NextAuth configuration
 * Credentials provider with RBAC
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== "production",
  logger: {
    error(code, metadata) {
      console.error(`🚨 [NEXTAUTH_ERROR] ${code}`, metadata);
    },
    warn(code) {
      console.warn(`⚠️ [NEXTAUTH_WARN] ${code}`);
    },
    debug(code, metadata) {
      console.log(`🔍 [NEXTAUTH_DEBUG] ${code}`, metadata);
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toLowerCase().trim();
          console.log(`🔐 [AUTH] Attempting login for: ${email}`);

          if (!email || !credentials?.password) {
            throw new Error("Email et mot de passe requis");
          }

          // 🛠️ ISOLATION TEST: Hardcoded user
          // If this works but admin@mellia.pos fails, the problem is DATABASE.
          // If this ALSO fails, the problem is VERCEL/COOKIES/SECRET.
          if (email === "debug@mellia.pos" && credentials.password === "Debug123!") {
            console.log("🛠️ [AUTH] Debug user login successful (DB Bypassed)");
            return {
              id: "debug-id",
              email: "debug@mellia.pos",
              name: "Diagnostic User",
              role: "ADMIN" as any,
            };
          }

          // Database check
          await prisma.$connect();

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.error(`❌ [AUTH] User not found: ${email}`);
            throw new Error("Identifiants incorrects");
          }

          if (user.status !== "ACTIVE") {
            console.error(`❌ [AUTH] Account inactive: ${email}`);
            throw new Error("Compte inactif");
          }

          const isValid = await verifyPassword(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            console.error(`❌ [AUTH] Incorrect password for: ${email}`);
            throw new Error("Identifiants incorrects");
          }

          console.log(`✅ [AUTH] Success: ${email}`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          console.error("🚨 [AUTH] Authorize Error:", error.message || error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET?.trim(),
};

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
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("🔐 [AUTH] Attempting authorization for:", credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.error("❌ [AUTH] Missing email or password");
            return null;
          }

          // Normalize email to avoid case sensitivity issues
          const email = credentials.email.toLowerCase().trim();

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.error(`❌ [AUTH] User not found: ${email}`);
            return null;
          }

          if (user.status !== "ACTIVE") {
            console.error(`❌ [AUTH] User inactive: ${email}`);
            return null;
          }

          const isValid = await verifyPassword(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            console.error(`❌ [AUTH] Invalid password for: ${email}`);
            return null;
          }

          console.log(`✅ [AUTH] Success for: ${email}`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("🚨 [AUTH] Internal error during authorize:", error);
          return null;
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
  secret: process.env.NEXTAUTH_SECRET,
};

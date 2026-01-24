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
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔑 Authorization attempt:", { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Missing credentials");
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        console.log("👤 User found:", user ? { id: user.id, email: user.email, status: user.status } : "null");

        if (!user || user.status !== "ACTIVE") {
          console.error("❌ Invalid user or inactive account");
          throw new Error("Invalid credentials or inactive account");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        console.log("🔐 Password valid:", isValid);

        if (!isValid) {
          console.error("❌ Invalid password");
          throw new Error("Invalid credentials");
        }

        console.log("✅ Authorization successful");
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
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
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

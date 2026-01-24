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
          console.log("🔐 [AUTH] Login attempt for:", credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email et mot de passe requis");
          }

          // Force a database connection test
          await prisma.$connect();
          console.log("📡 [AUTH] Database connected successfully");

          // Normalize email
          const email = credentials.email.toLowerCase().trim();

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.error(`❌ [AUTH] User not found in database: ${email}`);
            throw new Error("Utilisateur non trouvé");
          }

          if (user.status !== "ACTIVE") {
            console.error(`❌ [AUTH] User account is not active: ${email}`);
            throw new Error("Compte inactif");
          }

          const isValid = await verifyPassword(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            console.error(`❌ [AUTH] Invalid password for: ${email}`);
            throw new Error("Mot de passe incorrect");
          }

          console.log(`✅ [AUTH] Authentication successful for: ${email}`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          console.error("🚨 [AUTH] CRITICAL ERROR:", error.message || error);
          // Re-throw or return null, but now it will be in the server logs
          throw new Error(error.message || "Erreur d'authentification");
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

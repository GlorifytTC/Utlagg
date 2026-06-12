import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { collectBankId } from "@/lib/bankid";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours absolute cap (was 7 days)
    updateAge: 30 * 60, // refresh the token at most every 30 min of activity
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .limit(1);

        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
    // BankID: signs up a new user or logs in an existing one. The client starts
    // an order (/api/bankid/auth) and calls signIn("bankid", { orderRef }); this
    // provider polls collect until the user completes, then finds-or-creates the
    // account keyed on a hash of the personnummer.
    CredentialsProvider({
      id: "bankid",
      name: "BankID",
      credentials: { orderRef: { label: "orderRef", type: "text" } },
      async authorize(credentials) {
        const orderRef = credentials?.orderRef;
        if (!orderRef) return null;

        // Poll collect for up to ~50s (BankID orders time out around 30s).
        let completion: Awaited<ReturnType<typeof collectBankId>> | null = null;
        for (let i = 0; i < 25; i++) {
          let res;
          try {
            res = await collectBankId(orderRef);
          } catch {
            return null;
          }
          if (res.status === "complete") {
            completion = res;
            break;
          }
          if (res.status === "failed") return null;
          await new Promise((r) => setTimeout(r, 2000));
        }
        const personalNumber = completion?.completionData?.user?.personalNumber;
        const fullName = completion?.completionData?.user?.name;
        if (!personalNumber) return null;

        const subject = crypto
          .createHash("sha256")
          .update(personalNumber)
          .digest("hex");

        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.bankIdSubject, subject))
          .limit(1);

        if (existing) {
          return {
            id: existing.id,
            email: existing.email,
            name: existing.name ?? fullName ?? undefined,
          };
        }

        // New account. BankID users have no email/password; synthesise a unique
        // placeholder email so the rest of the app (which assumes email exists)
        // keeps working. They can set a real email later in their profile.
        const placeholderEmail = `bankid+${subject.slice(0, 24)}@bankid.local`;
        const [created] = await db
          .insert(users)
          .values({
            email: placeholderEmail,
            bankIdSubject: subject,
            name: fullName ?? null,
          })
          .returning();

        return {
          id: created.id,
          email: created.email,
          name: created.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

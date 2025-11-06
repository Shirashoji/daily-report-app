// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import type { JWT } from "next-auth/jwt";
import type { Account, Session } from "next-auth";

// Check for required environment variables
if (!process.env.AUTH_GITHUB_ID) {
  throw new Error("Missing AUTH_GITHUB_ID environment variable");
}
if (!process.env.AUTH_GITHUB_SECRET) {
  throw new Error("Missing AUTH_GITHUB_SECRET environment variable");
}
if (!process.env.AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

const nextAuthOptions: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: { params: { scope: "repo" } },
    }),
  ],
  callbacks: {
    /**
     * This callback is called whenever a JSON Web Token is created (i.e. on sign in).
     * We want to add the access_token and installationId to the token.
     * @param {object} token - The token that is about to be saved.
     * @param {object} account - The account that was just used to sign in.
     * @returns {object} The token with the access_token and installationId.
     * @see https://next-auth.js.org/configuration/callbacks#jwt-callback
     */
    async jwt({ token, account }: { token: JWT; account?: Account | null | undefined }) {
      if (account) {
        token.accessToken = account.access_token as string;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthOptions);

export const GET = handlers.GET;
export const POST = handlers.POST;
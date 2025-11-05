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

        const res = await fetch("https://api.github.com/user/installations", {
          headers: {
            Authorization: `token ${token.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!res.ok) {
          const errorBody = await res.text();
          console.error(
            `Failed to fetch GitHub installations: ${res.status} ${res.statusText}`,
            errorBody
          );
          token.error = `Failed to fetch GitHub App installations. Please ensure the app is installed and authorized.`;
          return token;
        }

        try {
          const installations = await res.json();
          if (installations.total_count > 0 && installations.installations.length > 0) {
            token.installationId = installations.installations[0].id;
          } else {
            token.error = "GitHub App not installed for this user.";
          }
        } catch (error) {
          console.error("Error parsing GitHub installations response:", error);
          token.error = "Failed to parse GitHub installations response.";
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.error) {
        session.error = token.error as string;
      }
      session.accessToken = token.accessToken as string;
      session.installationId = token.installationId as string;
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthOptions);

export const GET = handlers.GET;
export const POST = handlers.POST;
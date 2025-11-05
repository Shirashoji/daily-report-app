// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github";

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
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
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token as string;

        // Fetch the user's installations for the GitHub App
        const res = await fetch("https://api.github.com/user/installations", {
          headers: {
            Authorization: `token ${token.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!res.ok) {
          console.error(
            `Failed to fetch GitHub installations: ${res.status} ${res.statusText}`
          );
          // Optionally, you might want to throw an error here or set a specific error status in the token
          // For now, we'll just proceed without installationId
        } else {
          try {
            const installations = await res.json();
            if (installations.total_count > 0) {
              token.installationId = installations.installations[0].id;
            }
          } catch (error) {
            console.error("Error parsing GitHub installations response:", error);
          }
        }
      }
      return token;
    },

    /**
     * This callback is called whenever a session is checked.
     * We want to add the access_token and installationId to the session.
     * @param {object} session - The session that is about to be saved.
     * @param {object} token - The token that was just used to sign in.
     * @returns {object} The session with the access_token and installationId.
     * @see https://next-auth.js.org/configuration/callbacks#session-callback
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.installationId = token.installationId as string;
      return session;
    },
  },
})

export const { GET, POST } = handlers
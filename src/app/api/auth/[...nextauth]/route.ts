// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      scope: 'repo',
    }),
  ],
  callbacks: {
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

        if (res.ok) {
          const installations = await res.json();
          // For this example, we'll just use the first installation.
          // In a real-world application, you might want to let the user choose which installation to use.
          // This could be a problem if the user has multiple installations.
          if (installations.total_count > 0) {
            token.installationId = installations.installations[0].id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.installationId = token.installationId as string;
      return session;
    },
  },
})

export const { GET, POST } = handlers
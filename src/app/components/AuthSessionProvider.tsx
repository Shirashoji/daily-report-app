"use client";

import { SessionProvider } from "next-auth/react";

/**
 * A client-side component that wraps the application in a NextAuth.js SessionProvider.
 * This allows the application to access the session from anywhere.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The component's children.
 * @returns {React.ReactNode} The component's children wrapped in a SessionProvider.
 * @see https://next-auth.js.org/getting-started/client#sessionprovider
 */
export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

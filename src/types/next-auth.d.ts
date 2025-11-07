// @ts-expect-error - Module augmentation
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Augment the built-in session types with our custom properties.
   * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
   */
  interface Session {
    accessToken?: string
    error?: string
    user: {
      id?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /**
   * Augment the built-in JWT types with our custom properties.
   * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
   */
  interface JWT {
    accessToken?: string
  }
}
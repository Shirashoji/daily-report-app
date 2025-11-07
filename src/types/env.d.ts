declare namespace NodeJS {
  interface ProcessEnv {
    GITHUB_APP_ID: string;
    GITHUB_APP_PRIVATE_KEY: string;
    AUTH_GITHUB_ID: string;
    AUTH_GITHUB_SECRET: string;
    AUTH_SECRET: string;
    GEMINI_API_KEY: string;
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_GITHUB_APP_NAME?: string;
  }
}

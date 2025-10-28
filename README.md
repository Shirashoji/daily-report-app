# Daily Report App

This is a Next.js application that generates reports based on GitHub commit history.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## GitHub App Setup

To enable fetching commit history from private repositories, you'll need to create a GitHub App and configure the following environment variables:

- `AUTH_GITHUB_ID`: The client ID of your GitHub OAuth App.
- `AUTH_GITHUB_SECRET`: The client secret of your GitHub OAuth App.
- `AUTH_SECRET`: A secret key for NextAuth.js. You can generate a suitable secret on the command line:
  ```bash
  openssl rand -base64 32
  ```
- `GITHUB_APP_ID`: The ID of your GitHub App.
- `GITHUB_APP_PRIVATE_KEY`: The private key of your GitHub App.

### Creating a GitHub App

1. Go to your GitHub developer settings and create a new GitHub App.
2. During the app creation process, you'll be asked to provide a callback URL. For local development, use `http://localhost:3000/api/auth/callback/github`.
3. After creating the app, you'll be given a "Client ID" and you'll need to generate a "Client secret". These are your `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`.
4. You'll also be given an "App ID". This is your `GITHUB_APP_ID`.
5. Finally, you'll need to generate a private key. This will be a `.pem` file. The contents of this file are your `GITHUB_APP_PRIVATE_KEY`.

Once you have these values, create a `.env.local` file in the root of the project and add them to it:

```
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
```

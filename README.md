# Daily Report App

This is a Next.js application that generates reports based on GitHub commit history.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## GitHub App Setup

To enable fetching commit history from private repositories, you'll need to create a single **GitHub App**. This app will provide all the necessary credentials for authentication.

### Creating a GitHub App

1.  **Navigate to Developer Settings:** Go to your GitHub developer settings by clicking on your profile picture in the top-right corner, then selecting **Settings** > **Developer settings**.
2.  **Create a New GitHub App:** Click on **GitHub Apps** in the left sidebar, and then click the **New GitHub App** button.
3.  **Fill in the App Details:**
    *   **GitHub App name:** Give your application a unique name (e.g., "Daily Report App for [Your Name]").
    *   **Homepage URL:** Enter the application's homepage URL. For local development, you can use `http://localhost:3000`.
    *   **Callback URL:** In the "Identifying and authorizing users" section, find the **Callback URL** field. Enter `http://localhost:3000/api/auth/callback/github`.
    *   **Webhook:** Uncheck the "Active" checkbox for now.
4.  **Set Repository Permissions:**
    *   Under the "Repository permissions" section, find **Contents** and select **Read-only** from the dropdown. This is required to read commit history.
5.  **Create the App:** Click the **Create GitHub App** button at the bottom of the page.

### Collecting Credentials

After creating the app, you will be redirected to its settings page. You need to collect the following four credentials:

1.  **Client ID (`AUTH_GITHUB_ID`):**
    *   This is displayed at the top of the settings page under "Client ID".

2.  **Client Secret (`AUTH_GITHUB_SECRET`):**
    *   Click the **Generate a new client secret** button. Copy the generated secret immediately, as you won't be able to see it again.

3.  **App ID (`GITHUB_APP_ID`):**
    *   This is listed in the "About" section of the settings page under "App ID".

4.  **Private Key (`GITHUB_APP_PRIVATE_KEY`):**
    *   Scroll down to the "Private keys" section and click **Generate a private key**. A `.pem` file will be downloaded. Open this file with a text editor and copy its entire contents.

### Configure Environment Variables

Create a `.env.local` file in the root of the project and add the credentials you collected:

```
# .env.local

# Credentials from your GitHub App's settings page
AUTH_GITHUB_ID=YOUR_CLIENT_ID
AUTH_GITHUB_SECRET=YOUR_CLIENT_SECRET

# App ID from the "About" section of your GitHub App
GITHUB_APP_ID=YOUR_APP_ID

# The full contents of the .pem file you downloaded
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# A secret for NextAuth.js session encryption. Generate with: openssl rand -base64 32
AUTH_SECRET=YOUR_GENERATED_SECRET
```

Once your `.env.local` file is set up, you can start the application, and it will be able to authenticate with GitHub.

# Daily Report App

This is a Next.js application that generates reports based on GitHub commit history.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [GitHub App Setup](#github-app-setup)
  - [Creating a GitHub App](#creating-a-github-app)
  - [Collecting Credentials](#collecting-credentials)
  - [Configure Environment Variables](#configure-environment-variables)
- [Deployment](#deployment)
  - [1. Update GitHub App Settings](#1-update-github-app-settings)
  - [2. Configure Netlify](#2-configure-netlify)

## Features

- **GitHub Authentication:** Securely sign in with your GitHub account.
- **Repository Selection:** Select a repository to generate a report from.
- **Date Range Selection:** Choose a start and end date for the report.
- **Commit History Report:** View a report of commits for the selected repository and date range.

## Tech Stack

- **Next.js:** A React framework for building server-side rendered and static web applications.
- **NextAuth.js:** An authentication library for Next.js applications.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **TypeScript:** A statically typed superset of JavaScript.

## Getting Started

1.  **Install Dependencies:**
    Clone the repository and install the required dependencies.

    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    This project requires several environment variables for authentication. Copy the example file:

    ```bash
    cp .env.local.example .env.local
    ```

    Then, follow the detailed instructions in the [GitHub App Setup](#github-app-setup) section to create a GitHub App and populate your `.env.local` file with the necessary credentials.

3.  **Run the Development Server:**
    Once your environment variables are configured, start the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:80](http://localhost:80) with your browser to see the result.

## GitHub App Setup

This application uses a single **GitHub App** to handle both user authentication (OAuth) and API access (as an App installation). This approach is more secure and flexible than using personal access tokens, as it allows for fine-grained permissions and acts on behalf of the application itself. You do not need a separate OAuth App.

The setup process involves creating one GitHub App and collecting four key credentials from its settings page.

### Creating a GitHub App

1.  **Navigate to Developer Settings:** Go to your GitHub developer settings by clicking on your profile picture in the top-right corner, then selecting **Settings** > **Developer settings**.
2.  **Create a New GitHub App:** Click on **GitHub Apps** in the left sidebar, and then click the **New GitHub App** button.
3.  **Fill in the App Details:**
    - **GitHub App name:** Give your application a unique name (e.g., "Daily Report App for [Your Name]").
    - **Homepage URL:** Enter the application's homepage URL. For local development, you can use `http://localhost:80`.
    - **Callback URL:** In the "Identifying and authorizing users" section, find the **Callback URL** field. Enter `http://localhost:80/api/auth/callback/github`.
    - **Webhook:** Uncheck the "Active" checkbox for now.
4.  **Set Repository Permissions:**
    - Under the "Repository permissions" section, find **Contents** and select **Read-only** from the dropdown. This is required to read commit history.
5.  **Create the App:** Click the **Create GitHub App** button at the bottom of the page.

### Collecting Credentials

After creating the app, you will be redirected to its settings page. You need to collect the following four credentials:

1.  **Client ID (`AUTH_GITHUB_ID`):**
    - This is displayed at the top of the settings page under "Client ID".

2.  **Client Secret (`AUTH_GITHUB_SECRET`):**
    - Click the **Generate a new client secret** button. Copy the generated secret immediately, as you won't be able to see it again.

3.  **App ID (`GITHUB_APP_ID`):**
    - This is listed in the "About" section of the settings page under "App ID".

4.  **Private Key (`GITHUB_APP_PRIVATE_KEY`):**
    - Scroll down to the "Private keys" section and click **Generate a private key**. A `.pem` file will be downloaded. Open this file with a text editor and copy its entire contents.

### Configure Environment Variables

Create a `.env.local` file in the root of the project and add the credentials you collected. Note that `AUTH_GITHUB_ID` and `GITHUB_APP_ID` are different values, but they both come from the same GitHub App.

```
# .env.local

# The "Client ID" from your GitHub App. Used for NextAuth.js user login.
AUTH_GITHUB_ID=YOUR_CLIENT_ID

# The "Client Secret" from your GitHub App. Used for NextAuth.js user login.
AUTH_GITHUB_SECRET=YOUR_CLIENT_SECRET

# The "App ID" from your GitHub App. Used for generating API tokens.
GITHUB_APP_ID=YOUR_APP_ID

# The full contents of the .pem private key file you downloaded.
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# A secret for NextAuth.js session encryption. Generate with: openssl rand -base64 32
AUTH_SECRET=YOUR_GENERATED_SECRET
```

Once your `.env.local` file is set up, you can start the application, and it will be able to authenticate with GitHub.

## Deployment

This application is designed to be deployed to [Netlify](https://www.netlify.com/).

### 1. Update GitHub App Settings

Before deploying, you need to update the **Callback URL** in your GitHub App settings to match your Netlify production URL.

1.  Navigate to your **[GitHub App settings](https://github.com/settings/apps)**.
2.  Select the app you created for this project.
3.  Update the **Callback URL** to `https://<YOUR_NETLIFY_SITE_NAME>.netlify.app/api/auth/callback/github`.
4.  Save the changes.

### 2. Configure Netlify

1.  Push your code to a GitHub repository.
2.  Go to your [Netlify dashboard](https://app.netlify.com/) and create a new site from the repository.
3.  During the setup, Netlify will detect that it's a Next.js project and configure the build settings automatically.
4.  Go to **Site settings** > **Build & deploy** > **Environment** and add the same environment variables you defined in your `.env.local` file:
    - `AUTH_GITHUB_ID`
    - `AUTH_GITHUB_SECRET`
    - `GITHUB_APP_ID`
    - `GITHUB_APP_PRIVATE_KEY`
    - `AUTH_SECRET`
5.  Trigger a new deploy from the **Deploys** tab to apply the environment variables.

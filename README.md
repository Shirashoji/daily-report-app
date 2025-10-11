# Daily Report Generator

This is a Next.js application that helps you generate a daily work report from your Git commit history using Google's Gemini model.

## Features

- **AI-Powered Report Generation**: Automatically generates a draft of your daily report based on the day's Git commits.
- **Customizable Date**: You can select any date to generate a report for, not just today.
- **Selectable AI Models**: Choose from different Gemini models (`2.5 Pro` / `2.5 Flash` / `2.5 Flash Lite`) to tailor the generation to your needs.
- **AI-Powered Advice**: Get suggestions from the AI on how to improve your report, based on your past reports and today's commits.
- **esa.io Integration**: 
    - View a list of your past daily reports from esa.io directly within the app.
    - You can specify the esa.io username to fetch reports from. The username is saved in your browser's local storage for convenience.
- **Copy to Clipboard**: Easily copy the generated report to your clipboard.

## Setup

1.  **Clone the repository**

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Create Environment File**:
    Create a `.env.local` file in the root of the `daily-report-app` directory and add the following environment variables:

    ```
    GEMINI_API_KEY="YOUR_GOOGLE_AI_API_KEY"
    ESA_API_KEY="YOUR_ESA_IO_API_KEY"
    ESA_TEAM_NAME="YOUR_ESA_IO_TEAM_NAME"
    ```

    - `GEMINI_API_KEY`: You can get your API key from [Google AI Studio](https://aistudio.google.com/).
    - `ESA_API_KEY`: Your esa.io API access token.
    - `ESA_TEAM_NAME`: Your esa.io team name.

## How to Use

1.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:80`.

2.  **Select the Date**: Choose the date for which you want to generate the report. The commit history for that day will be automatically fetched.

3.  **Choose a Gemini Model**: Select the AI model you want to use for generation.

4.  **Generate Report**: Click the "日報を生成" (Generate Report) button. The AI will generate a report in the text area on the right.

5.  **View Past Reports**: 
    - Click the "esa記事" (esa Articles) tab.
    - Enter an esa.io username (defaults to `shirashoji`) and the app will automatically fetch and display a list of past reports from that user.

6.  **Get Advice**: Click the "アドバイスを生成" (Generate Advice) button to get AI-powered suggestions for your report.

7.  **Copy Report**: Once you are satisfied with the report, click the "クリップボードにコピー" (Copy to Clipboard) button.
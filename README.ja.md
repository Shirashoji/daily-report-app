# Daily Report App

これは、GitHubのコミット履歴に基づいたレポートを生成するNext.jsアプリケーションです。

## 機能

- **GitHub認証:** GitHubアカウントで安全にサインインします。
- **リポジトリ選択:** レポートを生成するリポジトリを選択します。
- **日付範囲選択:** レポートの開始日と終了日を選択します。
- **コミット履歴レポート:** 選択したリポジトリと日付範囲のコミットレポートを表示します。

## 技術スタック

- **Next.js:** サーバーサイドレンダリングおよび静的ウェブアプリケーションを構築するためのReactフレームワーク。
- **NextAuth.js:** Next.jsアプリケーション向けの認証ライブラリ。
- **Tailwind CSS:** 迅速なUI開発のためのユーティリティファーストCSSフレームワーク。
- **TypeScript:** JavaScriptの静的型付けスーパーセット。

## はじめに

まず、開発サーバーを実行します。

```bash
npm run dev
```

ブラウザで[http://localhost:80](http://localhost:80)を開いて結果を確認します。

## GitHub Appのセットアップ

このアプリケーションは、ユーザー認証（OAuth）とAPIアクセス（App installationとして）の両方を処理するために、単一の**GitHub App**を使用します。別途OAuth Appを作成する必要はありません。セットアッププロセスでは、1つのGitHub Appを作成し、その設定ページから4つの主要な資格情報を収集します。

### GitHub Appの作成

1.  **開発者設定に移動:** 右上のプロフィール写真をクリックし、**Settings** > **Developer settings**を選択して、GitHubの開発者設定に移動します。
2.  **新しいGitHub Appを作成:** 左側のサイドバーで**GitHub Apps**をクリックし、**New GitHub App**ボタンをクリックします。
3.  **アプリの詳細を入力:**
    - **GitHub App name:** アプリケーションに一意の名前を付けます（例：「[あなたの名前]のためのDaily Report App」）。
    - **Homepage URL:** アプリケーションのホームページURLを入力します。ローカル開発の場合、`http://localhost:80`を使用できます。
    - **Callback URL:** 「Identifying and authorizing users」セクションで、**Callback URL**フィールドを見つけます。`http://localhost:80/api/auth/callback/github`と入力します。
    - **Webhook:** とりあえず「Active」チェックボックスをオフにします。
4.  **リポジトリの権限を設定:**
    - 「Repository permissions」セクションで、**Contents**を見つけ、ドロップダウンから**Read-only**を選択します。これはコミット履歴の読み取りに必要です。
5.  **アプリを作成:** ページ下部の**Create GitHub App**ボタンをクリックします。

### 資格情報の収集

アプリを作成すると、その設定ページにリダイレクトされます。以下の4つの資格情報を収集する必要があります。

1.  **Client ID (`AUTH_GITHUB_ID`):**
    - 設定ページの上部に「Client ID」として表示されます。

2.  **Client Secret (`AUTH_GITHUB_SECRET`):**
    - **Generate a new client secret**ボタンをクリックします。生成されたシークレットはすぐにコピーしてください。再度表示することはできません。

3.  **App ID (`GITHUB_APP_ID`):**
    - 設定ページの「About」セクションに「App ID」としてリストされています。

4.  **Private Key (`GITHUB_APP_PRIVATE_KEY`):**
    - 「Private keys」セクションまでスクロールダウンし、**Generate a private key**をクリックします。`.pem`ファイルがダウンロードされます。このファイルをテキストエディタで開き、その内容全体をコピーします。

### 環境変数の設定

プロジェクトのルートに`.env.local`ファイルを作成し、収集した資格情報を追加します。`AUTH_GITHUB_ID`と`GITHUB_APP_ID`は異なる値ですが、どちらも同じGitHub Appから取得する点に注意してください。

```
# .env.local

# GitHub Appの「Client ID」。NextAuth.jsのユーザーログインに使用されます。
AUTH_GITHUB_ID=YOUR_CLIENT_ID

# GitHub Appの「Client Secret」。NextAuth.jsのユーザーログインに使用されます。
AUTH_GITHUB_SECRET=YOUR_CLIENT_SECRET

# GitHub Appの「App ID」。APIトークンの生成に使用されます。
GITHUB_APP_ID=YOUR_APP_ID

# ダウンロードした.pem形式の秘密鍵ファイルの内容全体。
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# NextAuth.jsのセッション暗号化用シークレット。openssl rand -base64 32などで生成してください。
AUTH_SECRET=YOUR_GENERATED_SECRET
```

`.env.local`ファイルを設定したら、アプリケーションを起動でき、GitHubでの認証が可能になります。

## デプロイ

このアプリケーションは[Netlify](https://www.netlify.com/)へのデプロイを想定しています。

### 1. GitHub Appの設定を更新する

デプロイする前に、GitHub Appの設定で**Callback URL**をNetlifyの本番URLに更新する必要があります。

1.  **[GitHub Appの設定](https://github.com/settings/apps)**に移動します。
2.  このプロジェクト用に作成したアプリを選択します。
3.  **Callback URL**を`https://<YOUR_NETLIFY_SITE_NAME>.netlify.app/api/auth/callback/github`に更新します。
4.  変更を保存します。

### 2. Netlifyの設定

1.  コードをGitHubリポジトリにプッシュします。
2.  [Netlifyダッシュボード](https://app.netlify.com/)に移動し、リポジトリから新しいサイトを作成します。
3.  セットアップ中に、NetlifyはNext.jsプロジェクトであることを検出し、ビルド設定を自動的に構成します。
4.  **Site settings** > **Build & deploy** > **Environment**に移動し、`.env.local`ファイルで定義したのと同じ環境変数を追加します。
    - `AUTH_GITHUB_ID`
    - `AUTH_GITHUB_SECRET`
    - `GITHUB_APP_ID`
    - `GITHUB_APP_PRIVATE_KEY`
    - `AUTH_SECRET`
5.  **Deploys**タブから新しいデプロイをトリガーして、環境変数を適用します。

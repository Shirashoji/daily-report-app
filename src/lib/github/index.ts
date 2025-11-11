// src/lib/github/index.ts
import jwt from "jsonwebtoken";
import { GitHubAPIError, AppError } from "@/lib/errors";

const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY;

/**
 * GitHub App用のJWT（JSON Web Token）を生成します。
 * このトークンは、GitHub Appとして認証するために使用されます。
 * @returns {string} 生成されたJWT。
 * @throws {AppError} GitHub Appの認証情報が設定されていない場合にスローされます。
 * @private
 */
function getAppToken(): string {
  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
    throw new AppError(
      "GitHub Appの認証情報が設定されていません。",
      "CONFIG_ERROR",
      500
    );
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now, // 発行時刻
    exp: now + 60, // 有効期限 (1分)
    iss: GITHUB_APP_ID, // 発行者
  };

  const privateKey = GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");
  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

/**
 * 指定されたインストレーションIDのアクセストークンを生成します。
 * このトークンは、GitHub Appのインストール先リポジトリに対してAPI操作を行うために使用します。
 * @param {string} installationId - GitHub AppのインストレーションID。
 * @returns {Promise<string>} インストレーションアクセストークンを解決するPromise。
 * @throws {GitHubAPIError} アクセストークンの取得に失敗した場合にスローされます。
 * @private
 */
async function getInstallationAccessToken(
  installationId: string
): Promise<string> {
  const appToken = getAppToken();

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new GitHubAPIError(
      data.message || "インストールアクセストークンの取得に失敗しました。",
      response.status
    );
  }
  return data.token;
}

/**
 * 指定されたリポジトリに対するGitHub APIリクエスト用の認証ヘッダーを取得します。
 * リポジトリにインストールされているGitHub Appを特定し、そのインストレーションアクセストークンを生成して利用します。
 * @param {string} owner - リポジトリのオーナー名。
 * @param {string} repo - リポジトリ名。
 * @returns {Promise<Record<string, string>>} GitHub APIリクエスト用のヘッダーオブジェクトを解決するPromise。
 * @throws {GitHubAPIError} インストール情報が見つからない場合や、アクセストークンが取得できない場合にスローされます。
 * @private
 */
async function getGitHubHeaders(
  owner: string,
  repo: string
): Promise<Record<string, string>> {
  const appToken = getAppToken();

  const installationResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/installation`,
    {
      headers: {
        Authorization: `Bearer ${appToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!installationResponse.ok) {
    if (installationResponse.status === 404) {
      throw new GitHubAPIError(
        `${owner}/${repo} にGitHub Appがインストールされていません。インストールしてください。`,
        404
      );
    }
    throw new GitHubAPIError(
      "リポジトリのインストール情報の取得に失敗しました。",
      installationResponse.status
    );
  }

  const installation = await installationResponse.json();
  const installationId = installation.id;

  if (!installationId) {
    throw new GitHubAPIError(
      `${owner}/${repo} のGitHub Appインストールが見つかりませんでした。`,
      404
    );
  }

  const token = await getInstallationAccessToken(installationId.toString());

  if (!token) {
    throw new GitHubAPIError(
      "認証エラー: インストールアクセストークンを取得できませんでした。",
      401
    );
  }

  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };
}

/**
 * 指定されたリポジトリの認証情報を使用して、GitHub APIからデータを取得します。
 * @param {string} url - 取得先のGitHub APIのURL。
 * @param {string} owner - リポジトリのオーナー名。
 * @param {string} repo - リポジトリ名。
 * @returns {Promise<Response>} GitHub APIからの生のレスポンスを解決するPromise。
 * @throws {GitHubAPIError} APIリクエストが失敗した場合や、レスポンスがエラーを示した場合にスローされます。
 * @throws {AppError} 予期せぬエラーが発生した場合にスローされます。
 * @example
 * const response = await fetchFromGitHub(
 *   'https://api.github.com/repos/owner/repo/commits',
 *   'owner',
 *   'repo'
 * );
 * const commits = await response.json();
 */
export async function fetchFromGitHub(
  url: string,
  owner: string,
  repo: string
): Promise<Response> {
  try {
    const headers = await getGitHubHeaders(owner, repo);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GitHubAPIError(
        errorData.message || `GitHub APIリクエストに失敗しました: ${response.status}`,
        response.status
      );
    }

    return response;
  } catch (error) {
    if (error instanceof GitHubAPIError || error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "GitHubからのデータ取得中に予期せぬエラーが発生しました。",
      "UNKNOWN_ERROR",
      500
    );
  }
}
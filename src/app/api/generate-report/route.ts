import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { AppError, ValidationError } from '@/lib/errors';
import type { ApiResponse } from '@/types/api';
import type { ReportType } from '@/types/report';
import {
  replaceTemplateVariables,
  generateWorkTimeText,
} from '@/lib/utils/report';

import type { CommitData } from '@/types/github';
import type { WorkTime } from '@/types/report';

/**
 * レポート生成APIへのリクエストボディの型定義。
 */
interface RequestBody {
  commits: CommitData[];
  model: string;
  reportType: ReportType;
  workTimes: WorkTime[];
  startDate: string;
  endDate: string;
  customVariables?: Record<string, string>;
}

/**
 * レポート生成APIの成功レスポンスのデータ型定義。
 */
interface ReportResponse {
  report: string;
}

// Gemini APIクライアントを初期化
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * AIモデルに送信するためのプロンプト文字列を作成します。
 * @param reportType - レポートの種類。
 * @param template - ベースとなるテンプレート。
 * @param workTimeText - 生成された作業時間テキスト。
 * @param commits - コミット履歴の文字列。
 * @returns AIモデル用のプロンプト文字列。
 */
function createPrompt(
  reportType: ReportType,
  template: string,
  workTimeText: string,
  commits: CommitData[]
): string {
  const commitsText = commits
    .map(
      (c) => `${c.sha} - ${c.author}, ${new Date(c.date).toLocaleString('ja-JP')} : ${c.message}`
    )
    .join('\n');

  const commonPrompt = `以下のテンプレート、作業時間、コミット履歴を元に、レポートを完成させてください。`;

  if (reportType === 'meeting') {
    return `${commonPrompt}\n「## やったこと」のセクションは、コミット履歴を参考にMarkdown形式で具体的に記述してください。
作業時間は指定されたものをそのまま記載してください。

${template.replace('## 作業時間', workTimeText)}

# コミット履歴
---\n${commitsText}\n---

# 生成されるMTG資料`;
  }

  // 日報の場合
  return `${commonPrompt}\n「# 作業内容」のセクションは、コミット履歴と作業時間中のメモを参考に、Markdown形式で具体的に記述してください。
その他のセクションは空欄のままで構いません。

${template.replace('# 作業予定', `${workTimeText}\n\n# 作業予定`)}

# コミット履歴
---\n${commitsText}\n---

# 生成される日報`;
}

/**
 * レポート生成のメインロジック。テンプレート読み込み、プロンプト作成、AI実行までを行います。
 * @param commits - コミットデータの配列。
 * @param modelName - 使用するAIモデル名。
 * @param reportType - レポートの種類。
 * @param workTimes - 作業時間のリスト。
 * @param startDateStr - 開始日の文字列。
 * @param endDateStr - 終了日の文字列。
 * @param customVariables - ユーザー定義のカスタム変数。
 * @returns 生成されたレポート文字列。
 */
async function generateReport(
  commits: CommitData[],
  modelName: string,
  reportType: ReportType,
  workTimes: WorkTime[],
  startDateStr: string,
  endDateStr: string,
  customVariables: Record<string, string> = {}
): Promise<string> {
  const templateFileName = reportType === 'meeting' ? 'meeting-template.md' : 'daily-template.md';
  const templatePath = path.join(process.cwd(), 'public', templateFileName);

  const template = await fs.readFile(templatePath, 'utf-8');
  const startDate = new Date(startDateStr);

  const processedTemplate = replaceTemplateVariables(template, startDate, {
    ...customVariables,
    endDate: endDateStr,
  });
  const workTimeText = generateWorkTimeText(workTimes, reportType);
  const prompt = createPrompt(reportType, processedTemplate, workTimeText, commits);

  const result = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const text = result.text;

  return text || '';
}

/**
 * エラーをハンドリングし、適切なNextResponseを返します。
 * @param error - 発生したエラー。
 * @param model - 使用されたモデル名（オプション）。
 * @returns エラー情報を含むNextResponse。
 */
function handleError(error: unknown, model?: string): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { data: null, error: error.message, status: error.statusCode },
      { status: error.statusCode }
    );
  }
  // モデルが見つからない場合のエラーを特異的にハンドリング
  if (error instanceof Error && error.message.includes('is not found for API version')) {
    return NextResponse.json(
      {
        data: null,
        error: `選択されたモデル'${model}'が見つかりません。別のモデルを試してください。`,
        status: 404,
      },
      { status: 404 }
    );
  }
  return NextResponse.json(
    {
      data: null,
      error: 'レポート生成中に予期せぬエラーが発生しました。',
      status: 500,
    },
    { status: 500 }
  );
}

/**
 * POST /api/generate-report
 * レポート生成リクエストを処理するAPIルートハンドラ。
 * @param request - Next.jsのRequestオブジェクト。
 * @returns 生成されたレポートまたはエラーを含むNextResponse。
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<ReportResponse | null>>> {
  let model: string | undefined;
  try {
    const body: RequestBody = await request.json();
    const { commits, reportType, workTimes, startDate, endDate, customVariables } = body;
    model = body.model;

    // 必須フィールドの検証
    if (!commits || !model || !reportType || !workTimes || !startDate || !endDate) {
      throw new ValidationError('リクエストボディに必要なフィールドが不足しています。', 'body');
    }

    const report = await generateReport(
      commits,
      model,
      reportType,
      workTimes,
      startDate,
      endDate,
      customVariables
    );
    return NextResponse.json({ data: { report }, status: 200 });
  } catch (error: unknown) {
    return handleError(error, model);
  }
}

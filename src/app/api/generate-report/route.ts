// src/app/api/generate-report/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import { AppError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/types/api";
import type { ReportType } from "@/types/report";

/**
 * 作業時間の情報を格納するインターフェース。
 */
interface WorkTime {
  start: string;
  end: string | null;
  memo: string;
}

/**
 * レポート生成APIへのリクエストボディの型定義。
 */
interface RequestBody {
  commits: string;
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
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Dateオブジェクトを 'YYYY-MM-DD' 形式の文字列にフォーマットします。
 * @param date - フォーマットするDateオブジェクト。
 * @returns フォーマットされた日付文字列。
 */
const formatDate = (date: Date): string => {
  return date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
    .join("-");
};

/**
 * 合計分を「X時間Y分」の形式の文字列にフォーマットします。
 * @param totalMinutes - 合計時間（分）。
 * @returns フォーマットされた時間文字列。
 */
const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0) return "0分";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours > 0 ? `${hours}時間` : ""}${
    minutes > 0 ? `${minutes}分` : ""
  }`;
};

/**
 * テンプレート文字列内の変数を置換します。
 * 変数形式: `%{variableName:offset}`
 * 例: `%{Year}`, `%{month}`, `%{day}`, `%{startDate}`, `%{endDate}`
 * 日付にはオフセットを適用可能 (例: `%{day:+1d}`)
 * @param template - 置換対象のテンプレート文字列。
 * @param startDate - 基準となる開始日。
 * @param customVariables - ユーザー定義のカスタム変数。
 * @returns 変数が置換された文字列。
 */
function replaceTemplateVariables(
  template: string,
  startDate: Date,
  customVariables: Record<string, string>
): string {
  return template.replace(
    /%\{([a-zA-Z_]+)((?:[:+-]?\d+[ymdh])+)?\}/g,
    (match, varName, offsets) => {
      // カスタム変数が存在すればそれを優先
      if (customVariables[varName]) {
        return customVariables[varName];
      }

      const date = new Date(startDate);
      // オフセットがあれば日付を計算
      if (offsets) {
        const offsetRegex = /([+-]\d+)([ymdh])/g;
        let offsetMatch;
        while ((offsetMatch = offsetRegex.exec(offsets)) !== null) {
          const value = parseInt(offsetMatch[1], 10);
          const unit = offsetMatch[2];
          switch (unit) {
            case "y":
              date.setFullYear(date.getFullYear() + value);
              break;
            case "m":
              date.setMonth(date.getMonth() + value);
              break;
            case "d":
              date.setDate(date.getDate() + value);
              break;
            case "h":
              date.setHours(date.getHours() + value);
              break;
          }
        }
      }

      // 標準の変数を置換
      switch (varName) {
        case "Year":
          return date.getFullYear().toString();
        case "month":
          return (date.getMonth() + 1).toString().padStart(2, "0");
        case "day":
          return date.getDate().toString().padStart(2, "0");
        case "startDate":
          return formatDate(startDate);
        case "endDate":
          return formatDate(new Date(customVariables.endDate || startDate));
        case "dateRange":
          return `${formatDate(startDate)} ~ ${formatDate(
            new Date(customVariables.endDate || startDate)
          )}`;
        default:
          return match; // 不明な変数はそのまま返す
      }
    }
  );
}

/**
 * 作業時間の記録からレポート用のテキストを生成します。
 * @param workTimes - 作業時間のリスト。
 * @param reportType - レポートの種類。
 * @param startDate - レポートの開始日。
 * @param endDate - レポートの終了日。
 * @returns 生成された作業時間テキスト。
 */
function generateWorkTimeText(
  workTimes: WorkTime[],
  reportType: ReportType,
  startDate: Date,
  endDate: Date
): string {
  if (!workTimes || workTimes.length === 0) return "";

  // MTG資料の場合、合計時間のみを記載
  if (reportType === "meeting") {
    const totalMinutes = workTimes.reduce((total, wt) => {
      if (wt.end) {
        return (
          total +
          Math.round(
            (new Date(wt.end).getTime() - new Date(wt.start).getTime()) / 60000
          )
        );
      }
      return total;
    }, 0);
    return `## 作業時間\n${formatDate(startDate)} ~ ${formatDate(
      endDate
    )}の合計作業時間：${formatDuration(totalMinutes)}`;
  }

  // 日報の場合、各作業時間とメモをリスト形式で記載
  let totalMinutes = 0;
  const workTimeList = workTimes
    .map((wt) => {
      if (wt.end) {
        const start = new Date(wt.start);
        const end = new Date(wt.end);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        totalMinutes += duration;
        const startTime = start.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTime = end.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
        let text = `- ${startTime}〜${endTime}（${formatDuration(duration)}）`;
        if (wt.memo)
          text += `\n  - メモ: ${wt.memo.replace(/\n/g, "\n    ")}`;
        return text;
      }
      return null;
    })
    .filter(Boolean);

  if (workTimeList.length > 0) {
    return `# 作業時間\n- 合計: ${formatDuration(
      totalMinutes
    )}\n${workTimeList.join("\n")}`;
  }
  return "";
}

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
  commits: string
): string {
  const commonPrompt = `以下のテンプレート、作業時間、コミット履歴を元に、レポートを完成させてください。`;

  if (reportType === "meeting") {
    return `${commonPrompt}\n「## やったこと」のセクションは、コミット履歴を参考にMarkdown形式で具体的に記述してください。
作業時間は指定されたものをそのまま記載してください。

${template.replace("## 作業時間", workTimeText)}

# コミット履歴
---\n${commits}
---

# 生成されるMTG資料`;
  }

  // 日報の場合
  return `${commonPrompt}\n「# 作業内容」のセクションは、コミット履歴と作業時間中のメモを参考に、Markdown形式で具体的に記述してください。
その他のセクションは空欄のままで構いません。

${template.replace("# 作業予定", `${workTimeText}\n\n# 作業予定`)}

# コミット履歴
---\n${commits}
---

# 生成される日報`;
}

/**
 * レポート生成のメインロジック。テンプレート読み込み、プロンプト作成、AI実行までを行います。
 * @param commits - コミット履歴。
 * @param modelName - 使用するAIモデル名。
 * @param reportType - レポートの種類。
 * @param workTimes - 作業時間のリスト。
 * @param startDateStr - 開始日の文字列。
 * @param endDateStr - 終了日の文字列。
 * @param customVariables - ユーザー定義のカスタム変数。
 * @returns 生成されたレポート文字列。
 */
async function generateReport(
  commits: string,
  modelName: string,
  reportType: ReportType,
  workTimes: WorkTime[],
  startDateStr: string,
  endDateStr: string,
  customVariables: Record<string, string> = {}
): Promise<string> {
  const templateFileName =
    reportType === "meeting"
      ? "meeting-template.md"
      : "daily-template.md";
  const templatePath = path.join(process.cwd(), "public", templateFileName);

  const template = await fs.readFile(templatePath, "utf-8");
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const processedTemplate = replaceTemplateVariables(template, startDate, {
    ...customVariables,
    endDate: endDateStr,
  });
  const workTimeText = generateWorkTimeText(
    workTimes,
    reportType,
    startDate,
    endDate
  );
  const prompt = createPrompt(reportType, processedTemplate, workTimeText, commits);

  const result = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const text = result.text;

  return text || "";
}

/**
 * エラーをハンドリングし、適切なNextResponseを返します。
 * @param error - 発生したエラー。
 * @param model - 使用されたモデル名（オプション）。
 * @returns エラー情報を含むNextResponse。
 */
function handleError(
  error: unknown,
  model?: string
): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, status: error.statusCode },
      { status: error.statusCode }
    );
  }
  // モデルが見つからない場合のエラーを特異的にハンドリング
  if (
    error instanceof Error &&
    error.message.includes("is not found for API version")
  ) {
    return NextResponse.json(
      {
        error: `選択されたモデル'${model}'が見つかりません。別のモデルを試してください。`,
        status: 404,
      },
      { status: 404 }
    );
  }
  return NextResponse.json(
    {
      error: "レポート生成中に予期せぬエラーが発生しました。",
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
    const {
      commits,
      reportType,
      workTimes,
      startDate,
      endDate,
      customVariables,
    } = body;
    model = body.model;

    // 必須フィールドの検証
    if (!commits || !model || !reportType || !workTimes || !startDate || !endDate) {
      throw new ValidationError(
        "リクエストボディに必要なフィールドが不足しています。",
        "body"
      );
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

// src/app/api/generate-report/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { AppError, ValidationError } from '@/lib/errors';
import type { ApiResponse } from '@/types/api';
import type { ReportType } from '@/types/report';

interface WorkTime {
  start: string;
  end: string | null;
  memo: string;
}

interface RequestBody {
  commits: string;
  model: string;
  reportType: ReportType;
  workTimes: WorkTime[];
  startDate: string;
  endDate: string;
  customVariables?: Record<string, string>;
}

interface ReportResponse {
  report: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
};

const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0) return '0分';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours > 0 ? `${hours}時間` : ''}${minutes > 0 ? `${minutes}分` : ''}`;
};

/**
 * Replaces variables in a template string.
 * Variables are in the format %{variableName:offset}.
 * e.g. %{Year}, %{month}, %{day}, %{startDate}, %{endDate}, %{dateRange}
 * Offsets can be applied to dates, e.g. %{day:+1d}
 */
function replaceTemplateVariables(template: string, startDate: Date, customVariables: Record<string, string>): string {
    return template.replace(/%\{([a-zA-Z_]+)((?:[:+-]?\d+[ymdh])+)?\}/g, (match, varName, offsets) => {
        if (customVariables[varName]) {
            return customVariables[varName];
        }

        const date = new Date(startDate);
        if (offsets) {
            const offsetRegex = /([+-]\d+)([ymdh])/g;
            let offsetMatch;
            while ((offsetMatch = offsetRegex.exec(offsets)) !== null) {
                const value = parseInt(offsetMatch[1], 10);
                const unit = offsetMatch[2];
                switch (unit) {
                    case 'y': date.setFullYear(date.getFullYear() + value); break;
                    case 'm': date.setMonth(date.getMonth() + value); break;
                    case 'd': date.setDate(date.getDate() + value); break;
                    case 'h': date.setHours(date.getHours() + value); break;
                }
            }
        }

        switch (varName) {
            case 'Year': return date.getFullYear().toString();
            case 'month': return (date.getMonth() + 1).toString().padStart(2, '0');
            case 'day': return date.getDate().toString().padStart(2, '0');
            case 'startDate': return formatDate(startDate);
            case 'endDate': return formatDate(new Date(customVariables.endDate || startDate));
            case 'dateRange': return `${formatDate(startDate)} ~ ${formatDate(new Date(customVariables.endDate || startDate))}`;
            default: return match;
        }
    });
}


function generateWorkTimeText(workTimes: WorkTime[], reportType: ReportType, startDate: Date, endDate: Date): string {
    if (!workTimes || workTimes.length === 0) return '';

    if (reportType === 'meeting') {
        const totalMinutes = workTimes.reduce((total, wt) => {
            if (wt.end) {
                return total + Math.round((new Date(wt.end).getTime() - new Date(wt.start).getTime()) / 60000);
            }
            return total;
        }, 0);
        return `## 作業時間\n${formatDate(startDate)} ~ ${formatDate(endDate)}の合計作業時間：${formatDuration(totalMinutes)}`;
    }

    // Daily report
    let totalMinutes = 0;
    const workTimeList = workTimes.map(wt => {
        if (wt.end) {
            const start = new Date(wt.start);
            const end = new Date(wt.end);
            const duration = Math.round((end.getTime() - start.getTime()) / 60000);
            totalMinutes += duration;
            const startTime = start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            const endTime = end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            let text = `- ${startTime}〜${endTime}（${formatDuration(duration)}）`;
            if (wt.memo) text += `\n  - メモ: ${wt.memo.replace(/\n/g, '\n    ')}`;
            return text;
        }
        return null;
    }).filter(Boolean);

    if (workTimeList.length > 0) {
        return `# 作業時間\n- 合計: ${formatDuration(totalMinutes)}\n${workTimeList.join('\n')}`;
    }
    return '';
}

function createPrompt(reportType: ReportType, template: string, workTimeText: string, commits: string): string {
    const commonPrompt = `以下のテンプレート、作業時間、コミット履歴を元に、レポートを完成させてください。`;

    if (reportType === 'meeting') {
        return `${commonPrompt}
「## やったこと」のセクションは、コミット履歴を参考にMarkdown形式で具体的に記述してください。
作業時間は指定されたものをそのまま記載してください。

${template.replace('## 作業時間', workTimeText)}

# コミット履歴
---
${commits}
---

# 生成されるMTG資料`;
    }

    // Daily report
    return `${commonPrompt}
「# 作業内容」のセクションは、コミット履歴と作業時間中のメモを参考に、Markdown形式で具体的に記述してください。
その他のセクションは空欄のままで構いません。

${template.replace('# 作業予定', `${workTimeText}\n\n# 作業予定`)}

# コミット履歴
---
${commits}
---

# 生成される日報`;
}


async function generateReport(
  commits: string,
  modelName: string,
  reportType: ReportType,
  workTimes: WorkTime[],
  startDateStr: string,
  endDateStr: string,
  customVariables: Record<string, string> = {},
): Promise<string> {
  const templateFileName = reportType === 'meeting' ? 'meeting-template.md' : 'daily-template.md';
  const templatePath = path.join(process.cwd(), 'public', templateFileName);
  
  const template = await fs.readFile(templatePath, 'utf-8');
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const processedTemplate = replaceTemplateVariables(template, startDate, { ...customVariables, endDate: endDateStr });
  const workTimeText = generateWorkTimeText(workTimes, reportType, startDate, endDate);
  const prompt = createPrompt(reportType, processedTemplate, workTimeText, commits);

  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  
  const response = result.response;
  const text = response.text();

  return text;
}

function handleError(error: unknown, model?: string): NextResponse<ApiResponse<null>> {
    if (error instanceof AppError) {
        return NextResponse.json({ error: error.message, status: error.statusCode }, { status: error.statusCode });
    }
    if (error instanceof Error && error.message.includes('is not found for API version')) {
        return NextResponse.json({ error: `選択されたモデル'${model}'が見つかりません。別のモデルを試してください。`, status: 404 }, { status: 404 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while generating the report', status: 500 }, { status: 500 });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<ReportResponse | null>>> {
  let model: string | undefined;
  try {
    const body: RequestBody = await request.json();
    const { commits, reportType, workTimes, startDate, endDate, customVariables } = body;
    model = body.model;

    if (!commits || !model || !reportType || !workTimes || !startDate || !endDate) {
      throw new ValidationError('Missing required fields in request body', 'body');
    }

    const report = await generateReport(commits, model, reportType, workTimes, startDate, endDate, customVariables);
    return NextResponse.json({ data: { report }, status: 200 });
  } catch (error: unknown) {
    return handleError(error, model);
  }
}

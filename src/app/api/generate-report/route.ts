import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface WorkTime {
  start: string;
  end: string | null;
  memo: string;
}

async function generateReportFromCommits(
  commits: string, 
  modelName: string = 'gemini-2.5-flash', 
  reportType: string, 
  workTimes: WorkTime[], 
  targetDateStr: string,
  customVariables: Record<string, string> = {},
  lastMeetingContent?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: `models/${modelName}` });

  // reportTypeに応じてテンプレートファイルを読み込む
  const templateFileName = reportType === 'meeting' ? 'meeting-template.md' : 'daily-template.md';
  const templatePath = path.join(process.cwd(), 'public', templateFileName);
  let template = fs.readFileSync(templatePath, 'utf-8');

  // targetDateの処理
  const targetDate = new Date(targetDateStr);

  // DateをYYYY-MM-DD形式の文字列に変換するヘルパー関数
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // テンプレート変数を置換する
  template = template.replace(/%\{([a-zA-Z_]+)((?::[+-]?\d+[ymdh])+)?\}/g, (match, varName, offsets) => {
    // カスタム変数で置換
    if (customVariables[varName]) {
      return customVariables[varName];
    }

    const date = new Date(targetDate);
    if (offsets) {
      const offsetRegex = /:([+-]?\d+)([ymdh])/g;
      let offsetMatch;
      while ((offsetMatch = offsetRegex.exec(offsets)) !== null) {
        const value = parseInt(offsetMatch[1], 10);
        const unit = offsetMatch[2];
        switch (unit) {
          case 'y':
            date.setFullYear(date.getFullYear() + value);
            break;
          case 'm':
            date.setMonth(date.getMonth() + value);
            break;
          case 'd':
            date.setDate(date.getDate() + value);
            break;
          case 'h':
            date.setHours(date.getHours() + value);
            break;
        }
      }
    }

    switch (varName) {
      case 'Year':
        return date.getFullYear().toString();
      case 'month':
        return (date.getMonth() + 1).toString().padStart(2, '0');
      case 'day':
        return date.getDate().toString().padStart(2, '0');
      default:
        return match; // 不明な変数はそのまま
    }
  });    // 分を「X時間Y分」形式に変換するヘルパー関数
    const formatDuration = (totalMinutes: number) => {
      if (totalMinutes === 0) return '0分';
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      let result = '';
      if (hours > 0) {
        result += `${hours}時間`;
      }
      if (minutes > 0) {
        result += `${minutes}分`;
      }
      return result;
    };
  
    const relevantWorkTimes = workTimes;

    let workTimeText = '';
    if (relevantWorkTimes && relevantWorkTimes.length > 0) {
      const totalWeeklyMinutes = relevantWorkTimes.reduce((total, wt) => {
        if (wt.end) {
          const start = new Date(wt.start);
          const end = new Date(wt.end);
          return total + Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        }
        return total;
      }, 0);

      if (reportType === 'meeting') {
        const firstDate = formatDate(new Date(relevantWorkTimes[0].start));
        const lastDate = formatDate(new Date(relevantWorkTimes[relevantWorkTimes.length - 1].start));
        
        workTimeText += `## 作業時間\n`;
        workTimeText += `${firstDate}~${lastDate}の合計作業時間：${formatDuration(totalWeeklyMinutes)}\n`;
        workTimeText += `詳細\n`;

        const groupedByDay: { [key: string]: number } = {};
        relevantWorkTimes.forEach(wt => {
          if (wt.end) {
            const date = formatDate(new Date(wt.start));
            const start = new Date(wt.start);
            const end = new Date(wt.end);
            const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            if (!groupedByDay[date]) {
              groupedByDay[date] = 0;
            }
            groupedByDay[date] += duration;
          }
        });

        Object.keys(groupedByDay).sort().forEach(date => {
          const totalDailyMinutes = groupedByDay[date];
          workTimeText += `- ${date}: ${formatDuration(totalDailyMinutes)}\n`;
        });

      } else { // daily report
        let totalMinutes = 0;
        const workTimeList = relevantWorkTimes.map(wt => {
          if (wt.end) {
            const start = new Date(wt.start);
            const end = new Date(wt.end);
            const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            totalMinutes += duration;
            const startTime = start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            const endTime = end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            let text = `- ${startTime}〜${endTime}（${formatDuration(duration)}）`;
            if (wt.memo) {
              text += `\n  - メモ: ${wt.memo.replace(/\n/g, '\n    ')}`;
            }
            return text;
          }
          return null;
        }).filter(item => item !== null);

        if (workTimeList.length > 0) {
          workTimeText += '# 作業時間\n';
          workTimeText += `- 合計: ${formatDuration(totalMinutes)}\n`;
          workTimeText += workTimeList.join('\n');
        }
      }
    }

  let prompt;
  if (reportType === 'meeting') {
    const lastMeetingPrompt = lastMeetingContent 
      ? `
# 先週の議事録
---
${lastMeetingContent}
---

上記の「先週の議事録」の「次回までにやること」セクションの内容を抽出し、以下のテンプレートの「今回やること」セクションに転記してください。`
      : '';

    prompt = `以下のテンプレート、作業時間、コミット履歴を元に、MTG資料を完成させてください。
${lastMeetingPrompt}
「## やったこと」のセクションは、コミット履歴を参考にMarkdown形式で具体的に記述してください。
作業時間は指定されたものをそのまま記載してください。
その他のセクションはテンプレートの記述を維持してください。

${template.replace('## 作業時間', workTimeText)}

# コミット履歴
---
${commits}
---

# 生成されるMTG資料`;
  } else {
    prompt = `以下のテンプレート、作業時間、コミット履歴を元に、日報を完成させてください。
「# 作業内容」のセクションは、コミット履歴と作業時間中のメモを参考に、Markdown形式で具体的に記述してください。
その他のセクション（「# 作業予定」「# note」「# 次回やること」）は空欄のままで構いません。
作業時間は指定されたものをそのまま記載してください。

${template.replace('# 作業予定', `${workTimeText}\n\n# 作業予定`)}

# コミット履歴
---
${commits}
---

# 生成される日報`;
  }

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
}

export async function POST(request: Request) {
  const { commits, model, reportType, workTimes, targetDate, customVariables, lastMeetingContent } = await request.json();

  try {
    const report = await generateReportFromCommits(commits, model, reportType, workTimes, targetDate, customVariables, lastMeetingContent);
    return NextResponse.json({ report });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message.includes('is not found for API version')) {
      return NextResponse.json({ error: `選択されたモデル'${model}'が見つかりません。別のモデルを試してください。` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
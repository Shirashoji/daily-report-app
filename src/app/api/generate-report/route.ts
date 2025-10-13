import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateReportFromCommits(commits: string, modelName: string = 'gemini-1.5-flash', reportType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });

  // reportTypeに応じてテンプレートファイルを読み込む
  const templateFileName = reportType === 'meeting' ? 'meeting-template.md' : 'daily-template.md';
  const templatePath = path.join(process.cwd(), 'public', templateFileName);
  const template = fs.readFileSync(templatePath, 'utf-8');

  let prompt;
  if (reportType === 'meeting') {
    prompt = `以下のテンプレートとコミット履歴を元に、MTG資料を完成させてください。
「## やったこと」のセクションは、コミット履歴を参考にMarkdown形式で具体的に記述してください。
その他のセクションはテンプレートの記述を維持してください。

# テンプレート
---
${template}
---

# コミット履歴
---
${commits}
---

# 生成されるMTG資料`;
  } else {
    prompt = `以下のテンプレートとコミット履歴を元に、日報を完成させてください。
「# 作業内容」のセクションは、コミット履歴を参考にMarkdown形式で具体的に記述してください。
その他のセクション（「# 作業予定」「# note」「# 次回やること」）は空欄のままで構いません。

# テンプレート
---
${template}
---

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
  const { commits, model, reportType } = await request.json();

  try {
    const report = await generateReportFromCommits(commits, model, reportType);
    return NextResponse.json({ report });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateReportFromCommits(commits: string, modelName: string = 'gemini-2.5-flash'): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `以下のコミット履歴から、日報の「作業内容」をMarkdown形式で生成してください。

# コミット履歴
${commits}

# 作業内容
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
}

export async function POST(request: Request) {
  const { commits, model } = await request.json();

  try {
    const report = await generateReportFromCommits(commits, model);
    return NextResponse.json({ report });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}


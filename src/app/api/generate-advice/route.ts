import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateAdvice(
  template: string,
  pastReports: string[],
  commits: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: `models/${modelName}` });

  const prompt = `あなたは優秀なアシスタントです。
以下の情報をもとに、今日の日報を作成するためのアドバイスをしてください。

# 日報テンプレート
${template}

# 過去の日報
${pastReports.join('\n---\n')}

# 今日のコミット履歴
${commits}

# アドバイス
- 過去の日報の傾向から、どのような点に注力して書くと良いか
- 今日のコミット履歴から、特筆すべき点は何か
- 日報テンプレートの各項目に、どのような内容を記述すると良いか
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
}

export async function POST(request: Request) {
  const { template, pastReports, commits, model } = await request.json();

  try {
    const advice = await generateAdvice(template, pastReports, commits, model);
    return NextResponse.json({ advice });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message.includes('is not found for API version')) {
      return NextResponse.json({ error: `選択されたモデル'${model}'が見つかりません。別のモデルを試してください。` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 });
  }
}

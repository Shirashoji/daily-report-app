import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

// ../LLMGraphvis へのパス
const repoPath = path.resolve(process.cwd(), '..', '..', 'LLMGraphvis');

// 日本時間の指定された日付の範囲を取得する関数
const getJstDateRange = (dateString?: string | null) => {
  const jstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  
  // dateStringが指定されていればその日付を、なければJSTでの今日の日付を使用
  const targetDate = dateString ? new Date(dateString) : new Date();
  if (!dateString) {
    targetDate.setTime(targetDate.getTime() + jstOffset);
  }

  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth();
  const date = targetDate.getUTCDate();

  const startOfDayJst = new Date(Date.UTC(year, month, date, 0, 0, 0));
  const endOfDayJst = new Date(Date.UTC(year, month, date, 23, 59, 59));

  // ISO 8601形式に変換 (git logで使うため)
  const after = new Date(startOfDayJst.getTime() - jstOffset).toISOString();
  const before = new Date(endOfDayJst.getTime() - jstOffset).toISOString();

  return { after, before };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const { after, before } = getJstDateRange(date);

  console.log({ date, after, before }); // デバッグログ追加

  const command = `cd "${repoPath}" && git log --after="${after}" --before="${before}" --pretty=format:'%h - %an, %ar : %s'`;

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        resolve(NextResponse.json({ error: 'Failed to get commits', details: stderr }, { status: 500 }));
        return;
      }
      resolve(NextResponse.json({ commits: stdout }));
    });
  });
}

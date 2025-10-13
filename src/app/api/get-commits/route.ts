import { NextResponse } from 'next/server';
import { exec } from 'child_process';

// 日本時間の指定された日付の範囲を取得する関数
const getJstDateRange = (dateString?: string | null) => {
  const jstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  
  const targetDate = dateString ? new Date(dateString) : new Date();
  if (!dateString) {
    targetDate.setTime(targetDate.getTime() + jstOffset);
  }

  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth();
  const date = targetDate.getUTCDate();

  const startOfDayJst = new Date(Date.UTC(year, month, date, 0, 0, 0));
  const endOfDayJst = new Date(Date.UTC(year, month, date, 23, 59, 59));

  const after = new Date(startOfDayJst.getTime() - jstOffset).toISOString();
  const before = new Date(endOfDayJst.getTime() - jstOffset).toISOString();

  return { after, before };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const { after, before } = getJstDateRange(date);

  const repoPath = searchParams.get('path');
  if (!repoPath) {
    return NextResponse.json({ error: 'Local repository path is required' }, { status: 400 });
  }

  const command = `cd "${repoPath}" && git log --after="${after}" --before="${before}" --pretty=format:'%h - %an, %ar : %s'`;

  return new Promise<NextResponse>((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        resolve(NextResponse.json({ error: 'Failed to get commits from local git', details: stderr }, { status: 500 }));
        return;
      }
      resolve(NextResponse.json({ commits: stdout }));
    });
  });
}
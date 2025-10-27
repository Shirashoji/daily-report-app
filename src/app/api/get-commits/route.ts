import { NextResponse } from 'next/server';
import { exec } from 'child_process';

const getJstDateRange = (dateString?: string | null, reportType?: string | null) => {
  const jstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds

  let year, month, date; // month is 0-based

  if (dateString) {
    const parts = dateString.split('-').map(Number);
    year = parts[0];
    month = parts[1] - 1; // JS month is 0-based
    date = parts[2];
  } else {
    // Fallback to "today" in JST
    const todayJst = new Date(new Date().getTime() + jstOffset);
    year = todayJst.getUTCFullYear();
    month = todayJst.getUTCMonth();
    date = todayJst.getUTCDate();
  }

  const targetDate = new Date(Date.UTC(year, month, date));

  if (reportType === 'meeting') {
    // For meetings, get the whole week (Monday to Sunday) JST
    const dayOfWeek = targetDate.getUTCDay(); // Sunday = 0, Monday = 1, ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(targetDate);
    monday.setUTCDate(targetDate.getUTCDate() + diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const startOfDayJst = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 0, 0, 0));
    const endOfDayJst = new Date(Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 23, 59, 59));

    const after = new Date(startOfDayJst.getTime() - jstOffset).toISOString();
    const before = new Date(endOfDayJst.getTime() - jstOffset).toISOString();

    return { after, before };
  } else {
    // Daily report logic (JST day)
    const startOfDayJst = new Date(Date.UTC(year, month, date, 0, 0, 0));
    const endOfDayJst = new Date(Date.UTC(year, month, date, 23, 59, 59));

    const after = new Date(startOfDayJst.getTime() - jstOffset).toISOString();
    const before = new Date(endOfDayJst.getTime() - jstOffset).toISOString();

    return { after, before };
  }
};


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const reportType = searchParams.get('reportType');

  const { after, before } = getJstDateRange(date, reportType);

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
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { report } = await request.json();
  const teamName = process.env.ESA_TEAM_NAME;
  const apiKey = process.env.ESA_API_KEY;

  if (!teamName || !apiKey) {
    return NextResponse.json({ error: 'esa.io API credentials not configured' }, { status: 500 });
  }

  const url = `https://api.esa.io/v1/teams/${teamName}/posts`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  const body = {
    post: {
      name: `日報 ${new Date().toISOString().split('T')[0]}`,
      body_md: report,
      category: '日報',
      wip: false,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to post to esa.io:', errorData);
      return NextResponse.json({ error: 'Failed to post to esa.io', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to post to esa.io' }, { status: 500 });
  }
}

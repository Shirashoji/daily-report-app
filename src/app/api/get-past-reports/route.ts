import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');

  const teamName = process.env.ESA_TEAM_NAME;
  const apiKey = process.env.ESA_API_KEY;

  if (!teamName || !apiKey) {
    return NextResponse.json({ error: 'esa.io API credentials not configured' }, { status: 500 });
  }

  let query = 'category:日報';
  if (user) {
    query += ` user:${user}`;
  }

  const url = `https://api.esa.io/v1/teams/${teamName}/posts?q=${encodeURIComponent(query)}`;

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to fetch from esa.io:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from esa.io', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    const reports = data.posts.map((post: any) => ({ name: post.name, url: post.url, body_md: post.body_md }));
    return NextResponse.json({ reports });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch from esa.io' }, { status: 500 });
  }
}

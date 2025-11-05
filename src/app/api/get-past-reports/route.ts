import { NextResponse } from 'next/server';

interface EsaPost {
  name: string;
  url: string;
  body_md: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');

  if (!user) {
    return NextResponse.json({ error: 'User is required' }, { status: 400 });
  }

  const team = process.env.ESA_TEAM_NAME; // 環境変数から取得
  const apiKey = process.env.ESA_API_KEY; // 環境変数から取得

  if (!team || !apiKey) {
    return NextResponse.json({ error: 'Esa Team Name and API Key are not configured in environment variables' }, { status: 500 });
  }

  const query = `user:${user}`;
  const url = `https://api.esa.io/v1/teams/${team}/posts?q=${encodeURIComponent(query)}`;

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('Failed to fetch from esa.io:', errorData);
        return NextResponse.json({ error: 'Failed to fetch from esa.io', details: errorData }, { status: response.status });
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch from esa.io (non-JSON response):', errorText);
        return NextResponse.json({ error: 'Failed to fetch from esa.io', details: errorText }, { status: response.status });
      }
    }

    const data = await response.json();
    const reports = data.posts.map((post: EsaPost) => ({
      name: post.name,
      url: post.url,
      body_md: post.body_md
    }));
    return NextResponse.json({ reports });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch from esa.io', details: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { team, apiKey, date, keyword, user } = await request.json();

  if (!team || !apiKey) {
    return NextResponse.json({ error: 'Team and API Key are required' }, { status: 400 });
  }

  const queryParts: string[] = [];
  if (keyword) {
    queryParts.push(keyword);
  }
  if (date) {
    queryParts.push(`created:${date}`);
  }
  if (user) {
    queryParts.push(`user:${user}`);
  }

  const query = queryParts.join(' ');
  const url = `https://api.esa.io/v1/teams/${team}/posts?q=${encodeURIComponent(query)}`;

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('Failed to fetch from esa.io:', errorData);
        return NextResponse.json({ error: 'Failed to fetch from esa.io', details: errorData }, { status: response.status });
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch from esa.io (non-JSON response):', errorText);
        return NextResponse.json({ error: 'Failed to fetch from esa.io', details: errorText }, { status: response.status });
      }
    }

    const data = await response.json();
    const reports = data.posts.map((post: EsaPost) => ({ name: post.name, url: post.url, body_md: post.body_md }));
    return NextResponse.json({ reports });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch from esa.io', details: message }, { status: 500 });
  }
}
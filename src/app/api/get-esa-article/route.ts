
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { url, team, apiKey } = await request.json();

  if (!url || !team || !apiKey) {
    return NextResponse.json({ error: 'URL, team, and apiKey are required' }, { status: 400 });
  }

  const match = url.match(/posts\/(\d+)/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid esa.io URL' }, { status: 400 });
  }
  const articleNumber = match[1];

  try {
    const esaApiUrl = `https://api.esa.io/v1/teams/${team}/posts/${articleNumber}`;
    const response = await fetch(esaApiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: `Failed to fetch from esa.io: ${errorData.message}` }, { status: response.status });
    }

    const article = await response.json();
    return NextResponse.json({ body_md: article.body_md });

  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}

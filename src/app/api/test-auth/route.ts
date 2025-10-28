import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session) {
      console.log('Session found in test-auth API.', session.user?.name);
      return NextResponse.json({ message: 'Auth test successful!', user: session.user?.name });
    } else {
      console.log('No session found in test-auth API.');
      return NextResponse.json({ message: 'Auth test: No session.' }, { status: 401 });
    }
  } catch (error: unknown) {
    console.error(`Error in test-auth API: ${error}`);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Auth test failed', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Auth test failed', details: 'An unknown error occurred' }, { status: 500 });
  }
}

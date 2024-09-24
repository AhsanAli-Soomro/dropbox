import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { path } = await request.json();
    const accessToken = process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is missing" }, { status: 400 });
    }

    const DROPBOX_API_URL = 'https://api.dropboxapi.com/2/files/list_folder';
    
    const response = await fetch(DROPBOX_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path || '',
        recursive: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error_summary }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

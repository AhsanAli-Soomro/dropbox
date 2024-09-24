import { NextResponse } from 'next/server';

export async function GET(request) {
    const accessToken = process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path || !accessToken) {
        return NextResponse.json({ error: "Path or access token is missing." }, { status: 400 });
    }

    try {
        const response = await fetch("https://content.dropboxapi.com/2/files/download", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Dropbox-API-Arg": JSON.stringify({ path }),
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const data = await response.blob();
        return new NextResponse(data, { headers: { 'Content-Disposition': `attachment; filename="${path.split('/').pop()}"` } });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

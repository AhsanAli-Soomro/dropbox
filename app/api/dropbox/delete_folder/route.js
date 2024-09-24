import { NextResponse } from 'next/server';

export async function POST(request) {
    const accessToken = process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN;

    if (!accessToken) {
        return NextResponse.json({ error: "Dropbox access token is missing." }, { status: 400 });
    }

    try {
        const { path } = await request.json();

        const response = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ path }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error_summary || "Failed to delete item in Dropbox");
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

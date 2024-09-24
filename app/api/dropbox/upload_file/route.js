import { NextResponse } from 'next/server';

export async function POST(request) {
    const accessToken = process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN;

    if (!accessToken) {
        return NextResponse.json({ error: "Dropbox access token is missing." }, { status: 400 });
    }

    try {
        const fileContent = await request.arrayBuffer();  // Read file data as binary
        const dropboxApiArg = request.headers.get('Dropbox-API-Arg');  // Get Dropbox file metadata

        const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/octet-stream",  // Dropbox expects binary data
                "Dropbox-API-Arg": dropboxApiArg,  // Metadata for file upload
            },
            body: fileContent,  // Send the binary file content
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error_summary || "Failed to upload to Dropbox");
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

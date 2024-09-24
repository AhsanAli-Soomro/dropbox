import { NextResponse } from 'next/server';

const DROPBOX_API_URL = 'https://api.dropboxapi.com/2';

export async function POST(request, { params }) {
    const { action } = params;
    const { path, folderName } = await request.json();
    
    const accessToken = process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN;

    let url;
    let data;

    switch (action) {
        case 'list_folder':
            url = `${DROPBOX_API_URL}/files/list_folder`;
            data = { path, recursive: false };
            break;
        case 'create_folder':
            url = `${DROPBOX_API_URL}/files/create_folder_v2`;
            data = { path: `${path}/${folderName}`, autorename: false };
            break;
        case 'delete_folder':
            url = `${DROPBOX_API_URL}/files/delete_v2`;
            data = { path };
            break;
        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error("Dropbox API Error:", result);
            return NextResponse.json({ error: result.error_summary }, { status: response.status });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to connect to Dropbox API:', error);
        return NextResponse.json({ error: 'Failed to connect to Dropbox API' }, { status: 500 });
    }
}

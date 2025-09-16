import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const relPath = (params.path || []).join('/');
    // Prevent path traversal
    if (relPath.includes('..')) {
      return new Response('Not found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', 'logo', relPath);
    const data = await fs.readFile(filePath);
    const contentType = getContentType(filePath);

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache aggressively like Next static assets
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    return new Response('Not found', { status: 404 });
  }
}

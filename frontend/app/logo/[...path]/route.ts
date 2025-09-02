import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getContentType(ext: string) {
  switch (ext.toLowerCase()) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.webp': return 'image/webp';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const rel = params.path.join('/');
    const candidates = [
      path.join(process.cwd(), 'public', 'logo', rel),
      path.join(process.cwd(), 'frontend', 'public', 'logo', rel),
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) return new NextResponse('Not Found', { status: 404 });
    const data = await fs.promises.readFile(found);
    const ct = getContentType(path.extname(found));
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

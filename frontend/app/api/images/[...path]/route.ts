import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

function getContentType(ext: string): string {
  switch(ext.toLowerCase()) {
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
    
    // List of possible paths to check
    const candidates = [
      path.join(process.cwd(), 'public', 'images', rel),
      path.join(process.cwd(), 'frontend', 'public', 'images', rel),
      path.join(process.cwd(), '..', 'public', 'images', rel),
    ];
    
    // Find the first existing file
    const found = candidates.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });
    
    if (!found) {
      console.error(`Image not found. Tried paths:`, candidates);
      return new NextResponse('Not Found', { status: 404 });
    }
    
    const data = await fs.promises.readFile(found);
    const ct = getContentType(path.extname(found));
    
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Images route error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
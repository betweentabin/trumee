import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Rewrite asset paths to API routes before static layer handles them
  if (pathname.startsWith('/images/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }
  if (pathname.startsWith('/logo/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/images/:path*', '/logo/:path*'],
};


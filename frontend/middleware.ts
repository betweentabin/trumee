import { NextRequest, NextResponse } from 'next/server';

// By default, DO NOT rewrite image paths.
// Rewrites to API routes break on Vercel because Serverless functions
// cannot read from the `public/` directory via fs at runtime.
// If you still want to proxy images through API routes in local dev,
// set NEXT_PUBLIC_ENABLE_IMAGE_REWRITE="true".
export function middleware(req: NextRequest) {
  const enableRewrite = process.env.NEXT_PUBLIC_ENABLE_IMAGE_REWRITE === 'true';
  if (!enableRewrite) return NextResponse.next();

  const { pathname } = req.nextUrl;
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

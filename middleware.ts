import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// mactor.ca proxies /invoices/* here, forwarding the original host in
// x-forwarded-host. Anyone hitting this app's own domain directly (old
// bookmarks, the raw inspector.fixmyproperty.ca link) gets bounced to the
// new canonical mactor.ca URL instead of serving the page twice.
export function middleware(request: NextRequest) {
  const effectiveHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';

  if (effectiveHost === 'mactor.ca' || effectiveHost === 'www.mactor.ca') {
    return NextResponse.next();
  }

  const url = new URL(request.url);
  return NextResponse.redirect(`https://www.mactor.ca${url.pathname}${url.search}`, 308);
}

export const config = {
  matcher: '/invoices/:path*',
};

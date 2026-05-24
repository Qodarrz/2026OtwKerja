import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Get the session cookie
  const accessToken = request.cookies.get('access_token')?.value;

  // 2. Define protected and public routes
  const isPortalRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/submit');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 3. Logic for Protected Routes
  if (isPortalRoute && !accessToken) {
    const url = new URL('/login', request.url);
    // url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 4. Logic for Auth Routes (Redirect to dashboard if already logged in)
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/submit/:path*',
    '/login',
    '/register',
  ],
};

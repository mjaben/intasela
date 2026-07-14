import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export default async function proxy(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  
  // Allow access to login page without authentication
  if (currentPath === '/login') {
    return NextResponse.next();
  }

  // Define public paths that shouldn't be protected by admin auth (e.g. static files)
  const isPublicPath = currentPath.startsWith('/_next') || 
                       currentPath.startsWith('/api') || 
                       currentPath.includes('.');
  if (isPublicPath) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('admin_session')?.value;
  
  // If no session cookie exists, redirect to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the JWT is valid
    await decrypt(sessionCookie);
    return NextResponse.next();
  } catch (err) {
    // If verification fails (expired or invalid), redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

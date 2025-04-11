import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // Check if the request is for auth pages
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  
  // If no token and trying to access protected routes
  if (!token && !isAuthPage) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // If has token and trying to access auth pages (redirect to home)
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/account',
    '/tasks',
    '/objectives/:path*',
  ],
}; 
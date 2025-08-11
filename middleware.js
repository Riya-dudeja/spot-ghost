import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only apply to dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token');
    
    console.log('Middleware - Path:', request.nextUrl.pathname);
    console.log('Middleware - Token exists:', !!token);
    
    if (!token || !token.value) {
      console.log('Middleware - No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Simple token presence check instead of JWT verification
    // JWT verification will be done on the server-side API routes
    console.log('Middleware - Token found, allowing access');
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};

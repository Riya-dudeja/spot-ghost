import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only apply to dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Allow access to report page when coming from extension
    if (request.nextUrl.pathname === '/dashboard/report' && 
        request.nextUrl.searchParams.get('source') === 'extension') {
      console.log('Middleware - Allowing extension access to report page');
      return NextResponse.next();
    }
    
    const token = request.cookies.get('token');
    
    console.log('Middleware - Path:', request.nextUrl.pathname);
    console.log('Middleware - Token exists:', !!token);
    
    if (!token || !token.value) {
      console.log('Middleware - No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Basic token format validation (JWT has 3 parts separated by dots)
    const tokenParts = token.value.split('.');
    if (tokenParts.length !== 3) {
      console.log('Middleware - Invalid token format, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if token is not obviously expired (basic check)
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        console.log('Middleware - Token expired, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.log('Middleware - Token payload invalid, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('Middleware - Token valid, allowing access');
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};

import { NextResponse } from 'next/server';

export function proxy(request) {
  // Only apply to dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Allow access to report page when coming from extension
    if (request.nextUrl.pathname === '/dashboard/report' && 
        request.nextUrl.searchParams.get('source') === 'extension') {
      console.log('Proxy - Allowing extension access to report page');
      return NextResponse.next();
    }
    
    const token = request.cookies.get('token');
    
    console.log('Proxy - Path:', request.nextUrl.pathname);
    console.log('Proxy - Token exists:', !!token);
    
    if (!token || !token.value) {
      console.log('Proxy - No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Basic token format validation (JWT has 3 parts separated by dots)
    const tokenParts = token.value.split('.');
    if (tokenParts.length !== 3) {
      console.log('Proxy - Invalid token format, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if token is not obviously expired (basic check)
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        console.log('Proxy - Token expired, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.log('Proxy - Token payload invalid, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('Proxy - Token valid, allowing access');
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};

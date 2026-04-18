import { NextResponse } from 'next/server'

// Auth handled client-side by AuthContext — middleware passes all requests through
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|.*\\..*).*)'],
}

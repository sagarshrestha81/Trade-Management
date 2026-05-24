import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith("/auth/")) {
    if (token) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};

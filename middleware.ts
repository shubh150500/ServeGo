import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static assets, API routes, admin portal pages, and the pre-launch page itself
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pre-launch") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.png" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // Fetch website toggles from Firestore REST API (runs in <20ms, Edge compatible)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "services-z-f920f";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/system_config/toggles`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 15 }, // Cache configuration for 15 seconds to minimize Firestore read counts
    });

    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};

      // Parse status
      const websiteStatus = fields.websiteStatus?.stringValue || "LIVE";

      if (websiteStatus === "PRE_LAUNCH") {
        // Redirect to pre-launch page
        return NextResponse.redirect(new URL("/pre-launch", request.url));
      }
    }
  } catch (err) {
    console.error("Redirection middleware failed to retrieve toggles:", err);
  }

  return NextResponse.next();
}

// Config to run middleware on all routes
export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};

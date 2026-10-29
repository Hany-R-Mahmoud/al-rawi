import { NextResponse } from "next/server";

/**
 * Public, guest-first reader routes must NOT be guarded by an auth redirect.
 * This matcher keeps the historical OAuth completion page public. The app-hosted
 * callback now completes the cookie exchange before redirecting to this page.
 * Protected data API routes verify their session independently.
 */
export default function proxy() {
  // App-hosted OAuth has already set its cookie before reaching this public page.
  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/callback"],
};

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Handle auth codes on root URL - redirect to auth callback
  // This happens when Supabase redirects password reset links to the site root
  if (request.nextUrl.pathname === "/") {
    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");
    const errorCode = request.nextUrl.searchParams.get("error_code");
    const errorDescription = request.nextUrl.searchParams.get("error_description");

    // If there's a code parameter, redirect to auth callback with type=recovery
    if (code) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      url.searchParams.set("type", "recovery");
      // code is already in searchParams
      return NextResponse.redirect(url);
    }

    // If there's an auth error (like expired link), redirect to sign-in with error message
    if (error || errorCode) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      // Clear the hash and set a friendly error message
      url.hash = "";

      let friendlyError = "Authentication failed";
      if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
        friendlyError = "This link has expired. Please request a new password reset link.";
      } else if (errorDescription) {
        friendlyError = decodeURIComponent(errorDescription.replace(/\+/g, " "));
      }

      url.searchParams.delete("error");
      url.searchParams.delete("error_code");
      url.searchParams.delete("error_description");
      url.searchParams.set("error", friendlyError);

      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

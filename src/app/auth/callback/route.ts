import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user?.email) {
      // Check if user has multiple practices and hasn't selected one
      try {
        const user = await prisma.user.findUnique({
          where: { email: data.user.email },
          include: {
            UserPractices: true
          }
        });

        // User has multiple practices and hasn't selected one - redirect to selector
        if (user && user.UserPractices.length > 1 && !user.currentPracticeId) {
          return NextResponse.redirect(`${origin}/select-practice`);
        }
      } catch (err) {
        // If DB check fails, just continue to dashboard
        console.error("Failed to check user practices:", err);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate user`);
}

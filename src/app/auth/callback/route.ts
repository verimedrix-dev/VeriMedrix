import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Handle email confirmation via token_hash (newer Supabase flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
    });

    if (error) {
      console.error("Auth callback verifyOtp error:", error.message);
      return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(error.message)}`);
    }

    // For password recovery, redirect to reset-password page
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    // After verification, get the user
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.email) {
      // Check if user exists in our database
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserPractices: true }
        });

        if (dbUser && dbUser.UserPractices.length > 1 && !dbUser.currentPracticeId) {
          return NextResponse.redirect(`${origin}/select-practice`);
        }
      } catch (err) {
        console.error("Failed to check user practices:", err);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Handle code exchange (older flow / OAuth)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      // For new users (not in database yet), redirect to dashboard
      // The dashboard layout's ensureUserAndPractice() will create the user and redirect to onboarding
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

      // Redirect to dashboard - new users will be created and redirected to onboarding automatically
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Log the error for debugging
    if (error) {
      console.error("Auth callback exchangeCodeForSession error:", error.message);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate user`);
}

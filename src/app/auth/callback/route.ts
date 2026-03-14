import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncSystemCategories } from '@/lib/actions/categories';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await syncSystemCategories(data.user.id);
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Redirect to login with an error flag if something went wrong
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
}

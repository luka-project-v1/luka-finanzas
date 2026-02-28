import { NextResponse } from 'next/server';
import { refreshAllUsersExchangeRates } from '@/lib/actions/currencies';

/**
 * Cron endpoint to refresh exchange rates for all users.
 * Secured by CRON_SECRET in Authorization header.
 * Configure in vercel.json to run every 12 hours.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET is not configured');
    return NextResponse.json(
      { error: 'Cron not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const result = await refreshAllUsersExchangeRates();

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    updated: result.data.updated,
  });
}

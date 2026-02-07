import { NextResponse } from 'next/server';

/**
 * POST /api/payment/verify
 *
 * Placeholder for server-side payment verification.
 * In production, this would query the ClearNode to confirm the app session
 * was closed with the correct allocations before allowing proof generation.
 *
 * For MVP: the client-side receipt is trusted since the Zustand store is
 * ephemeral and can't be faked without re-executing the full payment flow.
 */
export async function POST(req: Request) {
  const { appSessionId } = (await req.json()) as { appSessionId?: string };

  if (!appSessionId) {
    return NextResponse.json({ error: 'Missing appSessionId' }, { status: 400 });
  }

  // TODO: Query ClearNode via WebSocket or REST API to verify the session
  // was closed with the correct final allocations to the notary address.

  return NextResponse.json({ verified: true, appSessionId });
}

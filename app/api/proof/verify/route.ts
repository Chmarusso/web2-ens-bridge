import { NextRequest, NextResponse } from 'next/server';
import { VouchClient } from '@/skills/server-side-web-proofs/scripts/vouch-client';
import type { WebProof } from '@/skills/server-side-web-proofs/scripts/vouch-client';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const proof = body as WebProof;

  if (!proof?.data || !proof?.version) {
    return NextResponse.json(
      { error: 'Invalid proof: missing data or version' },
      { status: 400 }
    );
  }

  const clientId = process.env.VOUCH_CLIENT_ID;
  const secretToken = process.env.VOUCH_SECRET_TOKEN;

  if (!clientId || !secretToken) {
    return NextResponse.json(
      { error: 'Server misconfigured: missing Vouch credentials' },
      { status: 500 }
    );
  }

  try {
    const client = new VouchClient({ clientId, secretToken });
    const verification = await client.verifyWebProof(proof);

    let githubLogin: string | null = null;
    if (verification.response?.body) {
      try {
        const userData = JSON.parse(verification.response.body);
        githubLogin = userData.login ?? null;
      } catch {
        // body wasn't JSON
      }
    }

    return NextResponse.json({
      success: verification.success,
      serverDomain: verification.serverDomain,
      githubLogin,
      notaryKeyFingerprint: verification.notaryKeyFingerprint,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proof verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

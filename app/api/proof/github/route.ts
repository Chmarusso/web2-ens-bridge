import { NextRequest, NextResponse } from 'next/server';
import {
  VouchClient,
  buildHeadersWithRedaction,
} from '@/skills/server-side-web-proofs/scripts/vouch-client';
import { PROVERS, YELLOW_CONFIG } from '@/app/lib/constants';
import { verifyYellowPayment } from '@/app/lib/verify-payment';
import type { Address } from 'viem';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { githubToken, proverId, appSessionId } = body as {
    githubToken?: string;
    proverId?: string;
    appSessionId?: string;
  };

  if (!githubToken) {
    return NextResponse.json({ error: 'Missing githubToken' }, { status: 400 });
  }

  if (!appSessionId) {
    return NextResponse.json({ error: 'Missing appSessionId — payment required' }, { status: 402 });
  }

  // Look up prover config
  const prover = proverId
    ? PROVERS.find((p) => p.id === proverId)
    : PROVERS[0];

  if (!prover) {
    return NextResponse.json({ error: `Unknown prover: ${proverId}` }, { status: 400 });
  }

  // Verify payment with ClearNode before generating proof
  const paymentResult = await verifyYellowPayment({
    appSessionId,
    expectedRecipient: prover.walletAddress as Address,
    expectedApplication: YELLOW_CONFIG.APP_NAME,
    wsUrl: prover.network.yellowWsUrl,
  });

  if (!paymentResult.verified) {
    console.error('[ProofAPI] Payment verification failed:', paymentResult.error);
    return NextResponse.json(
      { error: `Payment verification failed: ${paymentResult.error}` },
      { status: 402 },
    );
  }

  console.log('[ProofAPI] Payment verified, generating proof…');

  const clientId = process.env.VOUCH_CLIENT_ID;
  const secretToken = process.env.VOUCH_SECRET_TOKEN;

  if (!clientId || !secretToken) {
    return NextResponse.json(
      { error: 'Server misconfigured: missing Vouch credentials' },
      { status: 500 }
    );
  }

  try {
    const client = new VouchClient({
      clientId,
      secretToken,
      proveUrl: prover.proveUrl,
      verifyUrl: prover.verifyUrl,
    });

    const { headers, redaction } = buildHeadersWithRedaction({
      authToken: githubToken,
      additionalHeaders: { 'User-Agent': 'ens-verified-records' },
    });

    const proof = await client.generateWebProof({
      url: 'https://api.github.com/user',
      method: 'GET',
      headers,
      redaction,
    });

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

    return NextResponse.json({ proof, githubLogin, verification });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proof generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

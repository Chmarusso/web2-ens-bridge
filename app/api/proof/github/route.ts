import { NextRequest, NextResponse } from 'next/server';
import {
  VouchClient,
  buildHeadersWithRedaction,
} from '@/skills/server-side-web-proofs/scripts/vouch-client';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { githubToken } = body as { githubToken?: string };

  if (!githubToken) {
    return NextResponse.json({ error: 'Missing githubToken' }, { status: 400 });
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

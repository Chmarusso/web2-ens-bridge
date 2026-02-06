import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient } from 'thirdweb';
import { upload } from 'thirdweb/storage';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { proof } = body as { proof?: unknown };

  if (!proof) {
    return NextResponse.json({ error: 'Missing proof data' }, { status: 400 });
  }

  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Server misconfigured: missing THIRDWEB_SECRET_KEY' },
      { status: 500 }
    );
  }

  try {
    const client = createThirdwebClient({ secretKey });

    const uri = await upload({
      client,
      files: [proof as Record<string, unknown>],
      uploadWithoutDirectory: true,
    });

    // uri is like "ipfs://QmXyz..."
    const cid = typeof uri === 'string' ? uri.replace('ipfs://', '') : '';

    return NextResponse.json({ cid, uri });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'IPFS upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

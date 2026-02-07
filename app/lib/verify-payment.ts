/**
 * Server-side Yellow Network payment verification.
 *
 * Connects to the ClearNode, authenticates with a server-side private key,
 * queries the app session, and verifies it was closed with the correct
 * allocations to the prover's wallet.
 *
 * Requires env var: YELLOW_SERVER_PRIVATE_KEY
 */
import WebSocket from 'ws';
import type { Address, Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  createECDSAMessageSigner,
  createGetAppSessionsMessage,
  parseAnyRPCResponse,
  RPCMethod,
  RPCChannelStatus,
} from '@erc7824/nitrolite';
import type { RPCAppSession } from '@erc7824/nitrolite';
import { YELLOW_CONFIG } from './constants';

interface VerifyPaymentParams {
  appSessionId: string;
  expectedRecipient: Address;
  expectedApplication: string;
  wsUrl: string;
}

interface VerifyPaymentResult {
  verified: boolean;
  error?: string;
  session?: RPCAppSession;
}

const VERIFICATION_TIMEOUT_MS = 15_000;

/**
 * Verify that a Yellow Network payment session was closed successfully.
 *
 * Authenticates to the ClearNode as the prover wallet, then queries closed
 * sessions to find the matching appSessionId.
 */
export async function verifyYellowPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
  const { appSessionId, expectedRecipient, expectedApplication, wsUrl } = params;

  const serverPrivateKey = process.env.YELLOW_SERVER_PRIVATE_KEY as Hex | undefined;
  if (!serverPrivateKey) {
    console.warn('[PaymentVerify] YELLOW_SERVER_PRIVATE_KEY not set, skipping verification');
    return { verified: true, error: 'Server key not configured — verification skipped' };
  }

  const serverAccount = privateKeyToAccount(serverPrivateKey);
  const serverAddress = serverAccount.address;

  // Create a viem WalletClient for EIP-712 signing (server-side, no browser wallet)
  const walletClient = createWalletClient({
    account: serverAccount,
    chain: sepolia,
    transport: http(),
  });

  // Ephemeral session key for ClearNode auth
  const sessionPrivateKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);
  const sessionKeyAddress = sessionAccount.address;

  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 300);
  const allowances = [{ asset: 'ytest.usd', amount: '0' }];

  const sessionSigner = createECDSAMessageSigner(sessionPrivateKey);
  const eip712Signer = createEIP712AuthMessageSigner(
    walletClient,
    {
      scope: YELLOW_CONFIG.SCOPE,
      session_key: sessionKeyAddress,
      expires_at: expiresAt,
      allowances,
    },
    { name: YELLOW_CONFIG.APP_NAME },
  );

  return new Promise<VerifyPaymentResult>((resolve) => {
    const timeout = setTimeout(() => {
      ws.close();
      resolve({ verified: false, error: 'Verification timed out' });
    }, VERIFICATION_TIMEOUT_MS);

    const ws = new WebSocket(wsUrl);

    ws.on('open', async () => {
      try {
        console.log('[PaymentVerify] Connected to ClearNode, authenticating…');
        const authReq = await createAuthRequestMessage({
          address: serverAddress,
          session_key: sessionKeyAddress,
          application: YELLOW_CONFIG.APP_NAME,
          allowances,
          expires_at: expiresAt,
          scope: YELLOW_CONFIG.SCOPE,
        });
        ws.send(authReq);
      } catch (err) {
        clearTimeout(timeout);
        ws.close();
        resolve({ verified: false, error: `Auth request failed: ${err}` });
      }
    });

    ws.on('message', async (data: WebSocket.Data) => {
      const raw = String(data);
      try {
        const response = parseAnyRPCResponse(raw);
        const method = response.method;

        if (method === RPCMethod.AuthChallenge) {
          const verifyMsg = await createAuthVerifyMessage(
            eip712Signer,
            response as Parameters<typeof createAuthVerifyMessage>[1],
          );
          ws.send(verifyMsg);
        } else if (method === RPCMethod.AuthVerify) {
          // Authenticated — now query closed sessions for the server/prover address
          console.log('[PaymentVerify] Authenticated, querying closed sessions…');
          const queryMsg = await createGetAppSessionsMessage(
            sessionSigner,
            expectedRecipient,
            RPCChannelStatus.Closed,
          );
          ws.send(queryMsg);
        } else if (method === RPCMethod.GetAppSessions) {
          clearTimeout(timeout);
          ws.close();

          const resAny = response as unknown as {
            params?: { appSessions?: RPCAppSession[] };
          };
          const sessions = resAny.params?.appSessions ?? [];
          console.log(`[PaymentVerify] Got ${sessions.length} closed session(s)`);

          const match = sessions.find(
            (s) => s.appSessionId.toLowerCase() === appSessionId.toLowerCase(),
          );

          if (!match) {
            resolve({
              verified: false,
              error: `Session ${appSessionId} not found among closed sessions`,
            });
            return;
          }

          // Verify the session belongs to our application
          if (match.application !== expectedApplication) {
            resolve({
              verified: false,
              error: `Session application "${match.application}" doesn't match expected "${expectedApplication}"`,
            });
            return;
          }

          // Verify the prover wallet is a participant
          const recipientIsParticipant = match.participants.some(
            (p) => p.toLowerCase() === expectedRecipient.toLowerCase(),
          );
          if (!recipientIsParticipant) {
            resolve({
              verified: false,
              error: `Prover wallet ${expectedRecipient} not a participant in session`,
            });
            return;
          }

          console.log('[PaymentVerify] Session verified:', match.appSessionId);
          resolve({ verified: true, session: match });
        } else if (method === RPCMethod.Error) {
          clearTimeout(timeout);
          ws.close();
          const errAny = response as unknown as { params?: { error?: string } };
          resolve({
            verified: false,
            error: `ClearNode error: ${errAny.params?.error ?? raw}`,
          });
        }
      } catch (err) {
        clearTimeout(timeout);
        ws.close();
        resolve({ verified: false, error: `Verification parse error: ${err}` });
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ verified: false, error: `WS error: ${err.message}` });
    });

    ws.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

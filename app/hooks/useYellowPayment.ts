'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { Address, Hex } from 'viem';
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  createECDSAMessageSigner,
  createAppSessionMessage,
  createCloseAppSessionMessage,
  parseAnyRPCResponse,
  RPCMethod,
  RPCProtocolVersion,
} from '@erc7824/nitrolite';
import { YELLOW_CONFIG, PROVERS } from '@/app/lib/constants';
import { useVerificationStore } from '@/app/lib/store';
import type { PaymentStatus } from '@/app/lib/types';

/** Convert USDC display amount (e.g. "0.10") to micro-units string (e.g. "100000") */
function usdcToMicro(amount: string): string {
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const frac = (parts[1] || '').padEnd(6, '0').slice(0, 6);
  return String(Number(whole) * 1_000_000 + Number(frac));
}

export function useYellowPayment() {
  const { address: wagmiAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<PaymentStatus>('idle');
  const {
    walletAddress: storeAddress,
    selectedProverId,
    setPaymentStatus,
    setPaymentReceipt,
    setError,
    paymentStatus,
    paymentReceipt,
  } = useVerificationStore();

  // Prefer wagmi address (persists across reloads) over store address (lost on redirect)
  const walletAddress = wagmiAddress ?? storeAddress;

  // Resolve selected prover (fall back to first prover)
  const prover = PROVERS.find((p) => p.id === selectedProverId) ?? PROVERS[0];
  const feeMicro = usdcToMicro(prover.price);
  const notary = prover.walletAddress as Address;
  const wsUrl = prover.network.yellowWsUrl;
  const asset = prover.asset;
  const feeDisplay = `${prover.price} ${prover.asset.toUpperCase()}`;

  // Keep ref in sync with store
  useEffect(() => {
    statusRef.current = paymentStatus;
  }, [paymentStatus]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const startPayment = useCallback(async () => {
    if (!walletClient || !walletAddress) {
      setPaymentStatus('error');
      setError('Wallet not connected');
      return;
    }
    if (!notary) {
      setPaymentStatus('error');
      setError('Payment recipient not configured');
      return;
    }

    console.log('[Yellow] Starting payment with prover:', prover.id, {
      wsUrl,
      notary,
      asset,
      feeMicro,
      wallet: walletAddress,
    });

    setError(null);
    setPaymentStatus('connecting');

    // 1. Generate ephemeral session key
    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);
    const sessionKeyAddress = sessionAccount.address;

    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const allowances = [{ asset, amount: feeMicro }];

    // Create signers
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
    const sessionSigner = createECDSAMessageSigner(sessionPrivateKey);

    // 2. Open WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let appSessionId: Hex | null = null;

    ws.onopen = async () => {
      try {
        console.log('[Yellow] WS connected to', wsUrl);
        setPaymentStatus('authenticating');
        const authReq = await createAuthRequestMessage({
          address: walletAddress,
          session_key: sessionKeyAddress,
          application: YELLOW_CONFIG.APP_NAME,
          allowances,
          expires_at: expiresAt,
          scope: YELLOW_CONFIG.SCOPE,
        });
        console.log('[Yellow] Sending auth_request');
        ws.send(authReq);
      } catch (err) {
        console.error('[Yellow] Auth request failed:', err);
        setPaymentStatus('error');
        setError(`Auth request failed: ${err instanceof Error ? err.message : String(err)}`);
        ws.close();
      }
    };

    ws.onmessage = async (event) => {
      const raw = String(event.data);
      console.log('[Yellow] Raw WS message:', raw);

      try {
        const response = parseAnyRPCResponse(raw);
        const method = response.method;
        console.log('[Yellow] Parsed method:', method, 'response:', JSON.stringify(response, null, 2));

        if (method === RPCMethod.AuthChallenge) {
          console.log('[Yellow] Got auth_challenge, signing with EIP-712…');
          const verifyMsg = await createAuthVerifyMessage(
            eip712Signer,
            response as Parameters<typeof createAuthVerifyMessage>[1],
          );
          console.log('[Yellow] Sending auth_verify');
          ws.send(verifyMsg);
        } else if (method === RPCMethod.AuthVerify) {
          console.log('[Yellow] Auth verified, creating app session…');
          setPaymentStatus('creating-session');
          const createMsg = await createAppSessionMessage(sessionSigner, {
            definition: {
              application: YELLOW_CONFIG.APP_NAME,
              protocol: RPCProtocolVersion.NitroRPC_0_2,
              participants: [walletAddress as Hex, notary as Hex],
              weights: [100, 0],
              quorum: 100,
              challenge: 0,
              nonce: Date.now(),
            },
            allocations: [
              { participant: walletAddress, asset, amount: feeMicro },
              { participant: notary, asset, amount: '0' },
            ],
          });
          console.log('[Yellow] Sending create_app_session');
          ws.send(createMsg);
        } else if (method === RPCMethod.CreateAppSession) {
          setPaymentStatus('processing');
          const resAny = response as unknown as { params?: { appSessionId?: Hex } };
          appSessionId = resAny.params?.appSessionId ?? null;
          console.log('[Yellow] App session created, id:', appSessionId);

          if (!appSessionId) {
            console.error('[Yellow] No appSessionId in response:', JSON.stringify(response));
            setPaymentStatus('error');
            setError('No app session ID returned');
            ws.close();
            return;
          }

          setPaymentStatus('confirming');
          const closeMsg = await createCloseAppSessionMessage(sessionSigner, {
            app_session_id: appSessionId,
            allocations: [
              { participant: walletAddress, asset, amount: '0' },
              { participant: notary, asset, amount: feeMicro },
            ],
          });
          console.log('[Yellow] Sending close_app_session');
          ws.send(closeMsg);
        } else if (method === RPCMethod.CloseAppSession) {
          console.log('[Yellow] Session closed — payment complete');
          setPaymentReceipt({
            appSessionId: appSessionId ?? 'unknown',
            amount: prover.price,
            recipient: notary,
            timestamp: Date.now(),
            status: 'completed',
          });
          setPaymentStatus('completed');
          ws.close();
        } else if (method === RPCMethod.Error) {
          console.error('[Yellow] Server error response:', JSON.stringify(response, null, 2));
          const errAny = response as unknown as { params?: { message?: string; error?: string; reason?: string } };
          const msg = errAny.params?.message || errAny.params?.error || errAny.params?.reason || raw;
          setPaymentStatus('error');
          setError(`Payment failed: ${msg}`);
          ws.close();
        } else {
          console.warn('[Yellow] Unhandled method:', method, 'full response:', JSON.stringify(response));
        }
      } catch (err) {
        console.error('[Yellow] Parse/handler error:', err, 'raw:', raw);
        setPaymentStatus('error');
        setError(`Payment error: ${err instanceof Error ? err.message : String(err)}`);
        ws.close();
      }
    };

    ws.onerror = (evt) => {
      console.error('[Yellow] WS error:', evt);
      setPaymentStatus('error');
      setError('WebSocket connection failed');
    };

    ws.onclose = (evt) => {
      console.log('[Yellow] WS closed, code:', evt.code, 'reason:', evt.reason, 'status:', statusRef.current);
      wsRef.current = null;
      if (statusRef.current !== 'completed' && statusRef.current !== 'error') {
        setPaymentStatus('error');
        setError('Connection closed unexpectedly');
      }
    };
  }, [walletClient, walletAddress, notary, wsUrl, asset, feeMicro, prover.price, setPaymentStatus, setPaymentReceipt, setError]);

  return { startPayment, paymentStatus, paymentReceipt, feeDisplay };
}

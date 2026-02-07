/**
 * Yellow Network Payment Verification Script
 *
 * Checks whether payer 0x75C8aA4333e7939c9c6f1c93Bf0be597E11BddBa
 * actually transferred any money to 0x2C7E2e35c90DDaFD477273bacE2cf44542461E47
 * via Yellow Network state channels.
 *
 * Uses V2 (unsigned) ClearNode queries — no private key needed.
 *
 * Run: npx tsx scripts/verify-payment.ts
 */

import WebSocket from 'ws';
import {
  createGetLedgerTransactionsMessageV2,
  createGetLedgerEntriesMessageV2,
  createGetAppSessionsMessageV2,
  createGetChannelsMessageV2,
  parseAnyRPCResponse,
  RPCChannelStatus,
} from '@erc7824/nitrolite';
import type { Address } from 'viem';

// ── Addresses ──
const PAYER: Address = '0x75C8aA4333e7939c9c6f1c93Bf0be597E11BddBa';
const RECIPIENT: Address = '0x2C7E2e35c90DDaFD477273bacE2cf44542461E47';
const WS_URL = 'wss://clearnet-sandbox.yellow.com/ws';

const TIMEOUT_MS = 15_000;

// ── Helpers ──
function log(section: string, ...args: unknown[]) {
  console.log(`\n[${'='.repeat(60)}]`);
  console.log(`[${section}]`, ...args);
  console.log(`[${'='.repeat(60)}]`);
}

function logResult(label: string, data: unknown) {
  console.log(`  ${label}:`, JSON.stringify(data, null, 2));
}

function sendAndReceive(ws: WebSocket, message: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Response timed out')), TIMEOUT_MS);

    const handler = (data: WebSocket.Data) => {
      clearTimeout(timeout);
      ws.off('message', handler);
      try {
        const raw = String(data);
        const parsed = parseAnyRPCResponse(raw);
        resolve(parsed);
      } catch (err) {
        try {
          resolve(JSON.parse(String(data)));
        } catch {
          reject(err);
        }
      }
    };

    ws.on('message', handler);
    ws.send(message);
  });
}

function connectWS(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timed out'));
    }, TIMEOUT_MS);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/** Drain the initial auto-sent assets message the ClearNode pushes on connect */
function drainInitialMessage(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 3000);
    const handler = (data: WebSocket.Data) => {
      clearTimeout(timeout);
      ws.off('message', handler);
      console.log('  (drained initial ClearNode message)');
      resolve();
    };
    ws.on('message', handler);
  });
}

interface LedgerEntry {
  accountId: string; asset: string; credit: string; debit: string; participant: string; createdAt: string;
}
interface LedgerTx {
  id: number; txType: string; fromAccount: string; toAccount: string; asset: string; amount: string; createdAt: string;
  fromAccountTag?: string; toAccountTag?: string;
}
interface AppSession {
  appSessionId: string; application: string; status: string; participants: string[];
  protocol: string; challenge: number; weights: number[]; quorum: number; version: number; nonce: number;
  createdAt: string; updatedAt: string;
}

// ── Main verification ──
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║    Yellow Network Payment Verification Script               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Payer:     ${PAYER}`);
  console.log(`Recipient: ${RECIPIENT}`);
  console.log(`ClearNode: ${WS_URL}`);
  console.log();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Connect to ClearNode
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  log('STEP 1', 'Connecting to ClearNode...');
  let ws: WebSocket;
  try {
    ws = await connectWS(WS_URL);
    console.log('  Connected successfully.');
    await drainInitialMessage(ws);
  } catch (err) {
    console.error('  FAILED to connect:', err);
    process.exit(1);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Balances — Ledger entries for both addresses
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  log('STEP 2', 'Querying ledger balances...');

  let payerBalance = 0n;
  let recipientBalance = 0n;

  // Payer entries
  console.log(`\n  --- PAYER (${PAYER}) ---`);
  try {
    const msg = createGetLedgerEntriesMessageV2(PAYER);
    const resp = await sendAndReceive(ws, msg) as { params?: { ledgerEntries?: LedgerEntry[] } };
    const entries = resp.params?.ledgerEntries ?? [];
    let totalCredit = 0n;
    let totalDebit = 0n;
    for (const e of entries) {
      totalCredit += BigInt(e.credit || '0');
      totalDebit += BigInt(e.debit || '0');
      console.log(`    ${e.createdAt} | +${e.credit} / -${e.debit} | ${e.asset}`);
    }
    payerBalance = totalCredit - totalDebit;
    console.log(`    Entries: ${entries.length}`);
    console.log(`    Credits: ${totalCredit} | Debits: ${totalDebit}`);
    console.log(`    >> BALANCE: ${payerBalance} micro (${Number(payerBalance) / 1_000_000} ytest.usd)`);
  } catch (err) {
    console.error('    Error:', err);
  }

  // Recipient entries
  console.log(`\n  --- RECIPIENT (${RECIPIENT}) ---`);
  try {
    const msg = createGetLedgerEntriesMessageV2(RECIPIENT);
    const resp = await sendAndReceive(ws, msg) as { params?: { ledgerEntries?: LedgerEntry[] } };
    const entries = resp.params?.ledgerEntries ?? [];
    let totalCredit = 0n;
    let totalDebit = 0n;
    for (const e of entries) {
      totalCredit += BigInt(e.credit || '0');
      totalDebit += BigInt(e.debit || '0');
      console.log(`    ${e.createdAt} | +${e.credit} / -${e.debit} | ${e.asset}`);
    }
    recipientBalance = totalCredit - totalDebit;
    console.log(`    Entries: ${entries.length}`);
    console.log(`    Credits: ${totalCredit} | Debits: ${totalDebit}`);
    console.log(`    >> BALANCE: ${recipientBalance} micro (${Number(recipientBalance) / 1_000_000} ytest.usd)`);
  } catch (err) {
    console.error('    Error:', err);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Transaction history for both addresses
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  log('STEP 3', 'Querying transaction history...');

  let payerTxs: LedgerTx[] = [];
  let recipientTxs: LedgerTx[] = [];

  // Payer transactions
  console.log(`\n  --- PAYER transactions ---`);
  try {
    const msg = createGetLedgerTransactionsMessageV2(PAYER, { limit: 100 });
    const resp = await sendAndReceive(ws, msg) as { params?: { ledgerTransactions?: LedgerTx[] } };
    payerTxs = resp.params?.ledgerTransactions ?? [];

    let totalIn = 0n;
    let totalOut = 0n;
    for (const tx of payerTxs) {
      const amount = BigInt(tx.amount || '0');
      const isIn = tx.toAccount.toLowerCase() === PAYER.toLowerCase();
      const isOut = tx.fromAccount.toLowerCase() === PAYER.toLowerCase();
      if (isIn) totalIn += amount;
      if (isOut) totalOut += amount;
      const dir = isIn ? 'IN ' : isOut ? 'OUT' : '???';
      console.log(`    [${dir}] ${tx.txType.padEnd(16)} ${tx.amount.padStart(10)} ${tx.asset} | ${tx.createdAt}`);
    }
    console.log(`    Total IN: ${totalIn} (${Number(totalIn) / 1_000_000}) | OUT: ${totalOut} (${Number(totalOut) / 1_000_000}) | NET: ${totalIn - totalOut} (${Number(totalIn - totalOut) / 1_000_000})`);
  } catch (err) {
    console.error('    Error:', err);
  }

  // Recipient transactions
  console.log(`\n  --- RECIPIENT transactions ---`);
  try {
    const msg = createGetLedgerTransactionsMessageV2(RECIPIENT, { limit: 100 });
    const resp = await sendAndReceive(ws, msg) as { params?: { ledgerTransactions?: LedgerTx[] } };
    recipientTxs = resp.params?.ledgerTransactions ?? [];

    let totalIn = 0n;
    let totalOut = 0n;
    for (const tx of recipientTxs) {
      const amount = BigInt(tx.amount || '0');
      const isIn = tx.toAccount.toLowerCase() === RECIPIENT.toLowerCase();
      const isOut = tx.fromAccount.toLowerCase() === RECIPIENT.toLowerCase();
      if (isIn) totalIn += amount;
      if (isOut) totalOut += amount;
      const dir = isIn ? 'IN ' : isOut ? 'OUT' : '???';
      console.log(`    [${dir}] ${tx.txType.padEnd(16)} ${tx.amount.padStart(10)} ${tx.asset} | ${tx.createdAt}`);
    }
    console.log(`    Total IN: ${totalIn} (${Number(totalIn) / 1_000_000}) | OUT: ${totalOut} (${Number(totalOut) / 1_000_000}) | NET: ${totalIn - totalOut} (${Number(totalIn - totalOut) / 1_000_000})`);
  } catch (err) {
    console.error('    Error:', err);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Closed app sessions between payer and recipient
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  log('STEP 4', 'Querying closed app sessions...');

  let recipientSessions: AppSession[] = [];

  try {
    const msg = createGetAppSessionsMessageV2(RECIPIENT, RPCChannelStatus.Closed);
    const resp = await sendAndReceive(ws, msg) as { params?: { appSessions?: AppSession[] } };
    recipientSessions = resp.params?.appSessions ?? [];
    console.log(`  Recipient closed sessions: ${recipientSessions.length}`);

    const withPayer = recipientSessions.filter((s) =>
      s.participants.some((p) => p.toLowerCase() === PAYER.toLowerCase()),
    );
    console.log(`  Sessions involving BOTH addresses: ${withPayer.length}`);

    for (const s of withPayer) {
      console.log(`    ${s.appSessionId.slice(0, 18)}... | app: ${s.application} | ${s.createdAt}`);
    }
  } catch (err) {
    console.error('  Error:', err);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. State channels (on-chain backing)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  log('STEP 5', 'Querying state channels (on-chain deposits)...');

  let payerChannels = 0;
  let recipientChannels = 0;

  try {
    const msg = createGetChannelsMessageV2(PAYER);
    const resp = await sendAndReceive(ws, msg) as { params?: { channels?: unknown[] } };
    payerChannels = resp.params?.channels?.length ?? 0;
    console.log(`  Payer channels: ${payerChannels}`);
    if (resp.params?.channels?.length) logResult('Payer channels', resp.params.channels);
  } catch (err) {
    console.error('  Error:', err);
  }

  try {
    const msg = createGetChannelsMessageV2(RECIPIENT);
    const resp = await sendAndReceive(ws, msg) as { params?: { channels?: unknown[] } };
    recipientChannels = resp.params?.channels?.length ?? 0;
    console.log(`  Recipient channels: ${recipientChannels}`);
    if (resp.params?.channels?.length) logResult('Recipient channels', resp.params.channels);
  } catch (err) {
    console.error('  Error:', err);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  log('SUMMARY', 'Payment Verification Complete');

  const sessionsWithPayer = recipientSessions.filter((s) =>
    s.participants.some((p) => p.toLowerCase() === PAYER.toLowerCase()),
  ).length;

  console.log(`
  ┌─────────────────────────────────────────────────────────────┐
  │  PAYER    ${PAYER}                                          │
  │  Balance: ${String(Number(payerBalance) / 1_000_000).padEnd(12)} ytest.usd                          │
  │  Txns:    ${String(payerTxs.length).padEnd(12)} total                                │
  │  Channels:${String(payerChannels).padEnd(12)} (on-chain deposits)                  │
  ├─────────────────────────────────────────────────────────────┤
  │  RECIPIENT ${RECIPIENT}                                     │
  │  Balance: ${String(Number(recipientBalance) / 1_000_000).padEnd(12)} ytest.usd                          │
  │  Txns:    ${String(recipientTxs.length).padEnd(12)} total                                │
  │  Channels:${String(recipientChannels).padEnd(12)} (on-chain deposits)                  │
  ├─────────────────────────────────────────────────────────────┤
  │  PAYMENTS                                                   │
  │  Closed sessions between both: ${String(sessionsWithPayer).padEnd(5)}                          │
  │  Total transferred:            ${String(Number(recipientBalance) / 1_000_000).padEnd(10)} ytest.usd       │
  │  On-chain collateral:          ${payerChannels === 0 && recipientChannels === 0 ? 'NONE' : 'YES '}                          │
  └─────────────────────────────────────────────────────────────┘

  VERDICT:
  ${sessionsWithPayer > 0
    ? `✓ ${sessionsWithPayer} off-chain payment(s) found in ClearNode ledger.`
    : '✗ NO payments found between these addresses.'}
  ${payerChannels === 0 && recipientChannels === 0
    ? '✗ NO on-chain state channels — balances have no on-chain collateral.'
    : '✓ On-chain state channels exist.'}
  ${recipientBalance > 0n
    ? `✓ Recipient has ${Number(recipientBalance) / 1_000_000} ytest.usd credited.`
    : '✗ Recipient balance is 0.'}
  ${'⚠ Asset is ytest.usd (sandbox testnet) — NOT real USDC.'}
  `);

  ws.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

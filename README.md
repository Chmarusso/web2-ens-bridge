# ENS Verified Records

Prove your Web2 stuff with web proofs and attach it to your ENS. Privacy-preserving, fully verifiable, onchain.

![readme-gif-docs](https://github.com/user-attachments/assets/c1e57c24-3721-4369-bd5b-ff513ae0b521)

[Full video demo of this project][https://studio.youtube.com/video/SBywrztz-NY/edit](https://www.youtube.com/watch?v=SBywrztz-NY) 
Submitted to [ETHGlobal Hackmoney 2026](https://ethglobal.com/showcase/web2ens-g4kd0)
## Quick Start

```bash
pnpm install
cp .env.local.example .env.local  # fill in your keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

```env
# GitHub OAuth App
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# vlayer (powered by TLSNotary) — https://vlayer.xyz
VOUCH_CLIENT_ID=...
VOUCH_SECRET_TOKEN=...

# Thirdweb (IPFS storage)
THIRDWEB_SECRET_KEY=...

# Yellow Network (state channel payments)
NEXT_PUBLIC_YELLOW_WS_URL=wss://clearnet-sandbox.yellow.com/ws
NEXT_PUBLIC_NOTARY_ADDRESS=0x...
NEXT_PUBLIC_VERIFICATION_FEE_USDC=0.10
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/verify` | 8-step verification wizard |
| `/check` | Public proof checker (no wallet required) |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/github` | POST | Exchange GitHub OAuth code for access token |
| `/api/proof/github` | POST | Generate Web Proof of GitHub identity via vlayer |
| `/api/proof/verify` | POST | Verify a proof's cryptographic validity |
| `/api/ipfs/upload` | POST | Upload proof JSON to IPFS |
| `/api/payment/verify` | POST | Verify payment receipt (placeholder) |

## Verification Flow

1. **Connect Wallet** — User connects their Ethereum wallet
2. **Detect ENS** — Select network (Sepolia / Mainnet), detect primary ENS name
3. **Link GitHub** — User authenticates via GitHub OAuth (fresh token each time)
4. **Payment** — User pays a verification fee via Yellow Network state channels
5. **Generate Proof** — Server creates a Web Proof via vlayer (powered by TLSNotary)
6. **Upload to IPFS** — Proof JSON is stored on IPFS via thirdweb
7. **Update ENS** — Two `setText` transactions write to the ENS resolver
8. **Summary** — All results with links to Etherscan and IPFS

### Data Flow

```
┌─────────┐     OAuth      ┌──────────┐    GET /user     ┌──────────┐
│ Browser  │───────────────>│  GitHub   │<────────────────│  vlayer  │
│ (React)  │<───────────────│  OAuth    │────────────────>│  Prover  │
└────┬─────┘  access_token  └──────────┘  JSON response   └────┬─────┘
     │                                                          │
     │  POST /api/proof/github                                  │
     │  { githubToken }                                         │
     │─────────────────────>┌──────────┐  prove(url,headers)    │
     │                      │ Next.js  │───────────────────────>│
     │                      │  API     │<───────────────────────│
     │<─────────────────────│  Routes  │  { proof }             │
     │  { proof, login }    └────┬─────┘                        │
     │                           │                              │
     │  POST /api/ipfs/upload    │  upload via thirdweb         │
     │  { proof }                │                              │
     │──────────────────────────>│──────────>┌──────────┐       │
     │<──────────────────────────│<──────────│   IPFS   │       │
     │  { cid, uri }            │           └──────────┘       │
     │                           │                              │
     │  setText() x2             │                              │
     │  via wallet               │                              │
     │──────────────────────────────────────>┌──────────┐       │
     │                                       │   ENS    │       │
     │<──────────────────────────────────────│ Registry │       │
     │  tx confirmed                         └──────────┘       │
     │                                                          │
     v                                                          v

 ENS Text Records Written:
 ┌─────────────────────────────────────────────────────────┐
 │  com.github             =>  "octocat"                   │
 │  verified:github:proof  =>  "ipfs://Qm..."             │
 └─────────────────────────────────────────────────────────┘

 Anyone can verify:
 ┌──────────┐  getEnsText()  ┌─────┐  fetch proof  ┌──────┐  verify()  ┌────────┐
 │ Verifier │───────────────>│ ENS │──────────────>│ IPFS │──────────>│ vlayer │
 └──────────┘                └─────┘               └──────┘           └────────┘
```

## ENS Text Records

Following [ENSIP-5](https://docs.ens.domains/ensip/5) conventions:

| Key | Description |
|-----|-------------|
| `com.github` | GitHub username (standard reverse-domain key) |
| `verified:github:proof` | IPFS URI to the cryptographic proof |

## Yellow Network — How Payments Work

This project uses [Yellow Network](https://yellow.org) state channels for micropayments. Instead of paying gas for an on-chain token transfer every time you verify a credential, funds move instantly through off-chain state channels powered by the [Nitro protocol](https://docs.yellow.org/docs/learn).

### Architecture

```
┌──────────┐   EIP-712 auth   ┌────────────┐   on-chain custody   ┌──────────────────┐
│  Browser  │────────────────>│  ClearNode  │<────────────────────│  Custody Contract │
│  (wagmi)  │<────────────────│  (off-chain)│────────────────────>│  (Sepolia ERC-20) │
└──────────┘  state updates   └────────────┘   deposit / settle   └──────────────────┘
```

1. **Deposit** — User deposits USDC into Yellow's on-chain Custody Contract, which credits their off-chain "unified balance" on the ClearNode.
2. **Authenticate** — The browser wallet signs an EIP-712 typed message (gasless) to prove identity. An ephemeral session key is created for the payment session.
3. **Create App Session** — An off-chain session is opened between the user and the prover/notary, locking the verification fee from the user's balance.
4. **Close App Session** — The session is closed with final allocations that transfer the fee to the prover. Both parties sign the state update.
5. **Settlement** — Funds are instantly available in the prover's off-chain balance. Either party can force on-chain settlement at any time via the dispute mechanism.

### Key Properties

- **Instant** — Payments settle in < 1 second (no block confirmations needed)
- **Gasless** — Only EIP-712 signatures, no transaction gas for the payment itself
- **Secure** — Cryptographically enforced via Nitro protocol; funds are always recoverable on-chain
- **Micropayment-friendly** — Fixed cost per verification (0.10 USDC) without per-transaction gas overhead

### SDK

The project uses [`@erc7824/nitrolite`](https://www.npmjs.com/package/@erc7824/nitrolite) — Yellow Network's TypeScript SDK for state channel operations. Key functions used:

- `createAuthRequestMessage` / `createAuthVerifyMessage` — WebSocket authentication
- `createAppSessionMessage` / `createCloseAppSessionMessage` — Payment session lifecycle
- `createGetLedgerTransactionsMessageV2` / `createGetAppSessionsMessageV2` — Querying payment history (V2 variants require no authentication)
- `createEIP712AuthMessageSigner` / `createECDSAMessageSigner` — Wallet and session key signers

### Verification Script

A standalone script queries the ClearNode to verify payments between any two addresses i used for testing (my wallet and notary wallet that gets money for proving):

```bash
npx tsx scripts/verify-payment.ts
```

It checks ledger balances, transaction history, closed app sessions, and on-chain state channels — all without needing a private key (uses unsigned V2 queries).

## Security & Data Integrity

**How is the proof generated securely?**
The proof is created using [vlayer](https://vlayer.xyz), which is powered by [TLSNotary](https://tlsnotary.org). TLSNotary allows a Notary to attest that specific data was served over a TLS connection — without the Notary ever seeing the plaintext. The Notary runs inside a Trusted Execution Environment (TEE), meaning even its operator cannot read or tamper with your data. The Notary is economically incentivised to provide honest attestations, so the resulting proof is both cryptographically and economically secured.

**Why IPFS?**
[IPFS](https://ipfs.tech) (InterPlanetary File System) is a content-addressed, peer-to-peer storage network. Each file is identified by a unique hash (CID) derived from its contents — if a single byte changes, the CID changes. This makes proofs tamper-proof by design: the CID stored in your ENS record will only ever resolve to the exact proof that was originally uploaded. No server can silently alter it.

**Why ENS?**
[ENS](https://ens.domains) (Ethereum Name Service) provides human-readable names backed by Ethereum. By writing the proof's IPFS URI into an ENS text record, the credential becomes publicly discoverable, tied to your onchain identity, and verifiable by anyone — no proprietary API or centralised database required. ENS text records follow the open [ENSIP-5](https://docs.ens.domains/ensip/5) standard, so any app or contract can read them.

**Why Yellow Network?**
[Yellow Network](https://yellow.org) provides state channel infrastructure built on the [Nitro protocol](https://docs.yellow.org/docs/learn). There are several reasons it was chosen for this project:

- **Micropayments without gas overhead** — Each ENS verification costs 0.10 USDC. Paying this on-chain would cost more in gas than the fee itself. State channels let the user pay once to deposit into a channel, then make unlimited instant payments off-chain.
- **UX** — The payment happens in the background with a single wallet signature (EIP-712). No MetaMask popups, no waiting for block confirmations, no "approve + transfer" two-step flow.
- **Crypto-native payment rail** — The alternative would be Stripe or a credit card processor, which defeats the purpose of a decentralised identity tool. Yellow keeps the entire flow wallet-native.
- **Cryptographic accountability** — Every payment is a signed state update between the user and the prover. Either party can force on-chain settlement if there's a dispute. The ClearNode maintains a double-entry ledger that can be audited via public V2 queries.
- **Multi-chain unified balance** — Users can deposit USDC on any supported chain (Sepolia, Base, Polygon, Linea) and pay from a single unified off-chain balance. No bridging required.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **wagmi v2** + **viem** (Ethereum)
- **Zustand** (state management)
- **[vlayer](https://vlayer.xyz)** (Web Proofs, powered by [TLSNotary](https://tlsnotary.org))
- **thirdweb** (IPFS storage)
- **[Yellow Network](https://yellow.org)** (state channel payments via `@erc7824/nitrolite`)

## Testing with Testnet USDC

The payment step uses Yellow Network's sandbox environment by default.

1. **Get Sepolia ETH** — [sepoliafaucet.com](https://sepoliafaucet.com) or [Chainlink faucet](https://faucets.chain.link/sepolia)
2. **Get testnet USDC** — [Circle faucet](https://faucet.circle.com) (USDC on Sepolia)
3. **Set up Yellow channel** — [apps.yellow.com](https://apps.yellow.com) to deposit testnet USDC into a state channel
4. **Sandbox WebSocket** — `wss://clearnet-sandbox.yellow.com/ws` (default in `.env.example`)

## FAQ

**Why use Yellow Network instead of a direct on-chain payment?**
A single ENS verification costs 0.10 USDC. An on-chain ERC-20 transfer on Ethereum mainnet can cost $1–5 in gas — 10–50x the actual fee. Even on L2s, the gas cost can rival the payment amount. Yellow Network state channels let users deposit once and then make unlimited instant micropayments with zero gas per payment. The only on-chain transactions are the initial deposit and (optional) final withdrawal.

**Does the user need to set up a Yellow Network account first?**
Yes. Before paying, the user needs to deposit testnet USDC (or real USDC in production) into a Yellow Network state channel via [apps.yellow.com](https://apps.yellow.com). This is a one-time setup — once funded, the balance can be used across multiple verifications and applications.

**Is the payment real money?**
In the current deployment, payments use `ytest.usd` on Yellow's sandbox ClearNode (`clearnet-sandbox.yellow.com`). This is testnet play money with no real-world value. For production, the app would switch to the mainnet ClearNode (`clearnet.yellow.com`) and use real USDC.

**Can I verify that a payment actually happened?**
Yes. Run `npx tsx scripts/verify-payment.ts` to query the ClearNode's public ledger. The script checks ledger balances, transaction history, closed app sessions, and on-chain state channels for both the payer and recipient addresses. All queries use unsigned V2 endpoints — no private key needed.

**What happens if the ClearNode goes down?**
Yellow Network uses the Nitro protocol, which ensures funds are always recoverable on-chain. If the ClearNode becomes unresponsive, either party can submit the latest mutually-signed state to the on-chain Custody Contract and force settlement after a challenge period. Your funds are never stuck.

**Why not use Stripe or a traditional payment processor?**
This is a decentralised identity tool — the entire flow (wallet connection, ENS records, IPFS storage, cryptographic proofs) is designed to work without centralised intermediaries. Adding a credit card processor would introduce KYC requirements, geographic restrictions, and a centralised point of failure. Yellow Network keeps payments wallet-native and permissionless.

**Why not use a simple ETH transfer?**
ETH transfers work but have downsides for micropayments: they require gas, they're slower (block confirmation), and the fee is denominated in a volatile asset. USDC via state channels provides stable pricing, instant settlement, and zero gas per payment.

## How to Contribute?

PRs are welcome! I'm especially interested in integrations with other Web2 APIs that would be useful for the ENS community — think Twitter/X, LinkedIn, email, Discord, Telegram, domain ownership, or any other identity source that people would want to link to their ENS name.

If you have an idea for a new verification source, open a PR that adds:
1. An API route under `app/api/proof/` to generate the Web Proof
2. A step component (or adapter) in the verification wizard
3. The corresponding ENS text record keys

See [AGENTS.md](./AGENTS.md) for the architecture guide on adding new verification sources.

## Extending

To add new verification sources (Twitter, email, etc.), see [AGENTS.md](./AGENTS.md).

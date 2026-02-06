# ENS Verified Records

Prove your Web2 stuff with web proofs and attach it to your ENS. Privacy-preserving, fully verifiable, onchain.

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
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/verify` | 7-step verification wizard |
| `/check` | Public proof checker (no wallet required) |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/github` | POST | Exchange GitHub OAuth code for access token |
| `/api/proof/github` | POST | Generate Web Proof of GitHub identity via vlayer |
| `/api/proof/verify` | POST | Verify a proof's cryptographic validity |
| `/api/ipfs/upload` | POST | Upload proof JSON to IPFS |

## Verification Flow

1. **Connect Wallet** — User connects their Ethereum wallet
2. **Detect ENS** — Select network (Sepolia / Mainnet), detect primary ENS name
3. **Link GitHub** — User authenticates via GitHub OAuth (fresh token each time)
4. **Generate Proof** — Server creates a Web Proof via vlayer (powered by TLSNotary)
5. **Upload to IPFS** — Proof JSON is stored on IPFS via thirdweb
6. **Update ENS** — Two `setText` transactions write to the ENS resolver
7. **Summary** — All results with links to Etherscan and IPFS

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

## Security & Data Integrity

**How is the proof generated securely?**
The proof is created using [vlayer](https://vlayer.xyz), which is powered by [TLSNotary](https://tlsnotary.org). TLSNotary allows a Notary to attest that specific data was served over a TLS connection — without the Notary ever seeing the plaintext. The Notary runs inside a Trusted Execution Environment (TEE), meaning even its operator cannot read or tamper with your data. The Notary is economically incentivised to provide honest attestations, so the resulting proof is both cryptographically and economically secured.

**Why IPFS?**
[IPFS](https://ipfs.tech) (InterPlanetary File System) is a content-addressed, peer-to-peer storage network. Each file is identified by a unique hash (CID) derived from its contents — if a single byte changes, the CID changes. This makes proofs tamper-proof by design: the CID stored in your ENS record will only ever resolve to the exact proof that was originally uploaded. No server can silently alter it.

**Why ENS?**
[ENS](https://ens.domains) (Ethereum Name Service) provides human-readable names backed by Ethereum. By writing the proof's IPFS URI into an ENS text record, the credential becomes publicly discoverable, tied to your onchain identity, and verifiable by anyone — no proprietary API or centralised database required. ENS text records follow the open [ENSIP-5](https://docs.ens.domains/ensip/5) standard, so any app or contract can read them.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **wagmi v2** + **viem** (Ethereum)
- **Zustand** (state management)
- **[vlayer](https://vlayer.xyz)** (Web Proofs, powered by [TLSNotary](https://tlsnotary.org))
- **thirdweb** (IPFS storage)

## Extending

To add new verification sources (Twitter, email, etc.), see [AGENTS.md](./AGENTS.md).

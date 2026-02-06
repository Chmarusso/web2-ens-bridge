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

# Vouch / vlayer (zkTLS/web proof prover)
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
| `/api/proof/github` | POST | Generate zkTLS/web proof proof of GitHub identity |
| `/api/proof/verify` | POST | Verify a proof's cryptographic validity |
| `/api/ipfs/upload` | POST | Upload proof JSON to IPFS |

## Verification Flow

1. **Connect Wallet** — User connects their Ethereum wallet
2. **Detect ENS** — Select network (Sepolia / Mainnet), detect primary ENS name
3. **Link GitHub** — User authenticates via GitHub OAuth (fresh token each time)
4. **Generate Proof** — Server creates a ZK-TLS proof via Vouch/vlayer
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

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **wagmi v2** + **viem** (Ethereum)
- **Zustand** (state management)
- **Vouch / vlayer** (zkTLS/web proof proof generation)
- **thirdweb** (IPFS storage)

## Extending

To add new verification sources (Twitter, email, etc.), see [AGENTS.md](./AGENTS.md).

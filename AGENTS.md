# AGENTS.md — ENS Verified Records

## Project Overview

A Next.js 16 app that lets users prove their Web2 identities (starting with GitHub) using ZK-TLS (Vouch/vlayer), store proofs on IPFS (thirdweb), and write the results as ENS text records. A separate checker page lets anyone verify proofs.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  /verify     │────▶│ API Routes   │────▶│ Vouch (vlayer)│
│  (wizard)    │     │              │     │ ZK-TLS prover │
│              │     │ /api/proof/* │     └───────────────┘
│              │     │ /api/ipfs/*  │────▶┌───────────────┐
│              │     └──────────────┘     │ Thirdweb IPFS │
│              │                          └───────────────┘
│              │────▶ ENS Resolver (setText via wallet tx)
└─────────────┘

┌─────────────┐
│  /check      │────▶ Read ENS text records (public, no wallet)
│  (checker)   │────▶ Fetch proof from IPFS
│              │────▶ Verify via /api/proof/verify
└─────────────┘
```

## Directory Structure

```
app/
  api/
    auth/github/route.ts        — GitHub OAuth token exchange
    proof/github/route.ts       — Vouch proof generation
    proof/verify/route.ts       — Vouch proof verification
    ipfs/upload/route.ts        — Thirdweb IPFS upload
    payment/verify/route.ts     — Payment receipt verification (placeholder)
  components/
    ConnectButton.tsx            — Wallet connect/disconnect
    GitHubButton.tsx             — GitHub OAuth + onAuthenticated callback
    Header.tsx                   — Shared navigation header
    Providers.tsx                — Wagmi + React Query providers
  hooks/
    useEnsIdentity.ts            — ENS name + resolver detection
    useSetEnsText.ts             — ENS setText transaction wrapper
    useYellowPayment.ts          — Yellow Network state channel payment
  lib/
    types.ts                     — Shared TypeScript types
    constants.ts                 — ENS keys, ABI, step config
    store.ts                     — Zustand verification wizard store
  verify/
    page.tsx                     — Wizard container
    page.module.css
    components/
      StepIndicator.tsx          — Progress bar
      StepConnectWallet.tsx      — Step 1
      StepDetectEns.tsx          — Step 2
      StepConnectGitHub.tsx      — Step 3
      StepPayment.tsx            — Step 4 (Yellow Network payment)
      StepGenerateProof.tsx      — Step 5
      StepUploadIpfs.tsx         — Step 6
      StepUpdateEns.tsx          — Step 7
      StepSummary.tsx            — Step 8
  check/
    page.tsx                     — Proof checker
    page.module.css
  globals.css
  layout.tsx
  page.tsx                       — Landing page

skills/
  server-side-web-proofs/
    scripts/vouch-client.ts      — Vouch API client (used by API routes)
```

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | Client | GitHub OAuth app client ID |
| `GITHUB_CLIENT_ID` | Server | GitHub OAuth (token exchange) |
| `GITHUB_CLIENT_SECRET` | Server | GitHub OAuth secret |
| `VOUCH_CLIENT_ID` | Server | Vouch/vlayer web prover client ID |
| `VOUCH_SECRET_TOKEN` | Server | Vouch/vlayer secret token |
| `THIRDWEB_SECRET_KEY` | Server | Thirdweb IPFS upload |
| `NEXT_PUBLIC_YELLOW_WS_URL` | Client | Yellow Network ClearNode WebSocket |
| `NEXT_PUBLIC_NOTARY_ADDRESS` | Client | Wallet address receiving verification fees |
| `NEXT_PUBLIC_VERIFICATION_FEE_USDC` | Client | Fee amount in USDC (e.g. "0.10") |

## Code Conventions

- **CSS**: CSS Modules for page-specific styles, `globals.css` for shared design tokens
- **State**: Zustand for wizard state, wagmi hooks for blockchain state
- **Fonts**: Space Grotesk (display), IBM Plex Mono (mono)
- **Path alias**: `@/` maps to project root
- **Components**: `'use client'` directive on all interactive components
- **API routes**: Next.js Route Handlers in `app/api/`

## ENS Text Record Schema

| Key | Value | Example |
|-----|-------|---------|
| `com.github` | GitHub username | `octocat` |
| `verified:github:proof` | IPFS URI to proof JSON | `ipfs://QmXyz...` |

## Adding New Verification Sources

To add a new source (e.g., Twitter):

1. Add new ENS keys to `app/lib/constants.ts` (e.g., `com.twitter`, `verified:twitter:proof`)
2. Create API route `app/api/proof/twitter/route.ts` using VouchClient with the appropriate API URL
3. Add new step components or extend the existing wizard
4. Update the store types if needed
5. Update the `/check` page to read the new text record keys

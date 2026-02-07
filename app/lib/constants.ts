import type { ProverConfig, VerificationStep } from './types';
import proversJson from '@/app/config/provers.json';

/** Prover configurations loaded from JSON */
export const PROVERS: ProverConfig[] = proversJson;

/** ENS text record keys */
export const ENS_KEYS = {
  /** Standard ENS key for GitHub handle (ENSIP-5 reverse domain pattern) */
  GITHUB_HANDLE: 'com.github',
  /** Custom key for IPFS proof URI */
  GITHUB_PROOF: 'verified:github:proof',
} as const;

/** ENS Resolver setText ABI fragment */
export const SET_TEXT_ABI = [
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
  },
] as const;

/** Step definitions for the wizard */
export const STEPS: { key: VerificationStep; label: string }[] = [
  { key: 'connect-wallet', label: 'Connect Wallet' },
  { key: 'detect-ens', label: 'Detect ENS' },
  { key: 'connect-github', label: 'Link GitHub' },
  { key: 'payment', label: 'Payment' },
  { key: 'generate-proof', label: 'Generate Proof' },
  { key: 'upload-ipfs', label: 'Upload to IPFS' },
  { key: 'update-ens', label: 'Update ENS' },
  { key: 'summary', label: 'Summary' },
];

/** Yellow Network payment configuration (shared across all provers) */
export const YELLOW_CONFIG = {
  APP_NAME: 'ens-verified-records',
  SCOPE: 'console',
} as const;

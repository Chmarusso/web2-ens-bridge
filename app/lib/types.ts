import type { Address, Hash } from 'viem';

/** The 7 wizard steps (no payment step) */
export type VerificationStep =
  | 'connect-wallet'
  | 'detect-ens'
  | 'connect-github'
  | 'generate-proof'
  | 'upload-ipfs'
  | 'update-ens'
  | 'summary';

/** Full wizard state */
export interface VerificationState {
  step: VerificationStep;
  chainId: number;
  walletAddress: Address | null;
  ensName: string | null;
  ensResolver: Address | null;
  githubLogin: string | null;
  githubToken: string | null;
  proof: WebProofData | null;
  ipfsCid: string | null;
  ipfsUri: string | null;
  ensSetTextTxHashes: Hash[];
  error: string | null;
}

/** Proof data returned from the Vouch API */
export interface WebProofData {
  data: string;
  version: string;
  meta: {
    notaryUrl: string;
  };
}

/** Result from verifying a proof */
export interface ProofVerificationResult {
  success: boolean;
  serverDomain: string;
  githubLogin: string | null;
  notaryKeyFingerprint: string;
}

/** Result from uploading to IPFS */
export interface IpfsUploadResult {
  cid: string;
  uri: string;
}

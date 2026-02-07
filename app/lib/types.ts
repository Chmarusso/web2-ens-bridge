import type { Address, Hash } from 'viem';

/** The 8 wizard steps */
export type VerificationStep =
  | 'connect-wallet'
  | 'detect-ens'
  | 'connect-github'
  | 'payment'
  | 'generate-proof'
  | 'upload-ipfs'
  | 'update-ens'
  | 'summary';

/** Yellow Network payment status */
export type PaymentStatus =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'creating-session'
  | 'processing'
  | 'confirming'
  | 'completed'
  | 'error';

/** Receipt from a completed Yellow Network payment */
export interface PaymentReceipt {
  appSessionId: string;
  amount: string;
  recipient: string;
  timestamp: number;
  status: 'completed';
}

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
  paymentStatus: PaymentStatus;
  paymentReceipt: PaymentReceipt | null;
  selectedProverId: string | null;
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
  request?: {
    method: string;
    url?: string;
    version?: string;
    headers?: Array<[string, string]>;
    body?: string;
    parsingSuccess?: boolean;
  };
  response?: {
    status: number;
    version?: string;
    headers?: Array<[string, string]>;
    body?: string;
    parsingSuccess?: boolean;
  };
}

/** Result from uploading to IPFS */
export interface IpfsUploadResult {
  cid: string;
  uri: string;
}

/** Network configuration for a prover */
export interface ProverNetwork {
  chainId: number;
  name: string;
  yellowWsUrl: string;
}

/** Configuration for a single prover service */
export interface ProverConfig {
  id: string;
  name: string;
  proveUrl: string;
  verifyUrl: string;
  price: string;
  asset: string;
  walletAddress: string;
  network: ProverNetwork;
}

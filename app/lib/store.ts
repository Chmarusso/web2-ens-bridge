import { create } from 'zustand';
import type { Address, Hash } from 'viem';
import { sepolia } from 'wagmi/chains';
import type { PaymentReceipt, PaymentStatus, VerificationState, VerificationStep, WebProofData } from './types';

interface VerificationActions {
  setStep: (step: VerificationStep) => void;
  setChainId: (chainId: number) => void;
  setWallet: (address: Address) => void;
  setEns: (name: string, resolver: Address) => void;
  setGitHub: (login: string, token: string) => void;
  setProof: (proof: WebProofData) => void;
  setIpfs: (cid: string, uri: string) => void;
  addEnsSetTextTx: (hash: Hash) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setPaymentReceipt: (receipt: PaymentReceipt) => void;
  setSelectedProver: (proverId: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: VerificationState = {
  step: 'connect-wallet',
  chainId: sepolia.id,
  walletAddress: null,
  ensName: null,
  ensResolver: null,
  githubLogin: null,
  githubToken: null,
  proof: null,
  ipfsCid: null,
  ipfsUri: null,
  ensSetTextTxHashes: [],
  paymentStatus: 'idle',
  paymentReceipt: null,
  selectedProverId: null,
  error: null,
};

export const useVerificationStore = create<VerificationState & VerificationActions>(
  (set) => ({
    ...initialState,

    setStep: (step) => set({ step, error: null }),

    setChainId: (chainId) => set({ chainId }),

    setWallet: (address) => set({ walletAddress: address }),

    setEns: (name, resolver) => set({ ensName: name, ensResolver: resolver }),

    setGitHub: (login, token) => set({ githubLogin: login, githubToken: token }),

    setProof: (proof) => set({ proof }),

    setIpfs: (cid, uri) => set({ ipfsCid: cid, ipfsUri: uri }),

    addEnsSetTextTx: (hash) =>
      set((state) => ({
        ensSetTextTxHashes: [...state.ensSetTextTxHashes, hash],
      })),

    setPaymentStatus: (paymentStatus) => set({ paymentStatus }),

    setPaymentReceipt: (paymentReceipt) => set({ paymentReceipt }),

    setSelectedProver: (selectedProverId) => set({ selectedProverId }),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
  })
);

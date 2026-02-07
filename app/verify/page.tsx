'use client';

import { useEffect } from 'react';
import { useAccount, useEnsName, useEnsResolver } from 'wagmi';
import { normalize } from 'viem/ens';
import { useVerificationStore } from '@/app/lib/store';
import Header from '@/app/components/Header';
import StepIndicator from './components/StepIndicator';
import StepConnectWallet from './components/StepConnectWallet';
import StepDetectEns from './components/StepDetectEns';
import StepConnectGitHub from './components/StepConnectGitHub';
import StepPayment from './components/StepPayment';
import StepGenerateProof from './components/StepGenerateProof';
import StepUploadIpfs from './components/StepUploadIpfs';
import StepUpdateEns from './components/StepUpdateEns';
import StepSummary from './components/StepSummary';
import styles from './page.module.css';

const STEP_COMPONENTS = {
  'connect-wallet': StepConnectWallet,
  'detect-ens': StepDetectEns,
  'connect-github': StepConnectGitHub,
  'payment': StepPayment,
  'generate-proof': StepGenerateProof,
  'upload-ipfs': StepUploadIpfs,
  'update-ens': StepUpdateEns,
  'summary': StepSummary,
} as const;

export default function VerifyPage() {
  const step = useVerificationStore((s) => s.step);
  const setStep = useVerificationStore((s) => s.setStep);
  const setWallet = useVerificationStore((s) => s.setWallet);
  const setEns = useVerificationStore((s) => s.setEns);
  const storeAddress = useVerificationStore((s) => s.walletAddress);
  const chainId = useVerificationStore((s) => s.chainId);

  // wagmi persists wallet connection across reloads
  const { address: wagmiAddress } = useAccount();
  const { data: ensName } = useEnsName({ address: wagmiAddress, chainId });
  const { data: resolverAddress } = useEnsResolver({
    name: ensName ? normalize(ensName) : undefined,
    chainId,
  });

  // GitHub OAuth redirects back with ?code=… which reloads the page.
  // Jump to connect-github so GitHubButton can process the code.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      setStep('connect-github');
    }
  }, [setStep]);

  // Keep the Zustand store hydrated from wagmi (which persists wallet
  // connection across reloads). This runs unconditionally so that ENS
  // data is available in later steps even if the URL was already cleaned.
  useEffect(() => {
    if (wagmiAddress && !storeAddress) {
      setWallet(wagmiAddress);
    }
  }, [wagmiAddress, storeAddress, setWallet]);

  useEffect(() => {
    if (ensName && resolverAddress) {
      setEns(ensName, resolverAddress);
    }
  }, [ensName, resolverAddress, setEns]);

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <main className="page">
      <div className="container">
        <Header />
        <div className={styles.wizard}>
          <h1 className={styles.title}>Verify your data</h1>
          <p className={styles.subtitle}>
            Generate a web proof and attach it to your ENS text record.
          </p>
          <StepIndicator currentStep={step} />
          <StepComponent />
        </div>
      </div>
    </main>
  );
}

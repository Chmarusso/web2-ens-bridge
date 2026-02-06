'use client';

import { useVerificationStore } from '@/app/lib/store';
import Header from '@/app/components/Header';
import StepIndicator from './components/StepIndicator';
import StepConnectWallet from './components/StepConnectWallet';
import StepDetectEns from './components/StepDetectEns';
import StepConnectGitHub from './components/StepConnectGitHub';
import StepGenerateProof from './components/StepGenerateProof';
import StepUploadIpfs from './components/StepUploadIpfs';
import StepUpdateEns from './components/StepUpdateEns';
import StepSummary from './components/StepSummary';
import styles from './page.module.css';

const STEP_COMPONENTS = {
  'connect-wallet': StepConnectWallet,
  'detect-ens': StepDetectEns,
  'connect-github': StepConnectGitHub,
  'generate-proof': StepGenerateProof,
  'upload-ipfs': StepUploadIpfs,
  'update-ens': StepUpdateEns,
  'summary': StepSummary,
} as const;

export default function VerifyPage() {
  const step = useVerificationStore((s) => s.step);
  const StepComponent = STEP_COMPONENTS[step];

  return (
    <main className="page">
      <div className="container">
        <Header />
        <div className={styles.wizard}>
          <h1 className={styles.title}>Verify your identity</h1>
          <p className={styles.subtitle}>
            Generate a ZK-TLS proof and attach it to your ENS name.
          </p>
          <StepIndicator currentStep={step} />
          <StepComponent />
        </div>
      </div>
    </main>
  );
}

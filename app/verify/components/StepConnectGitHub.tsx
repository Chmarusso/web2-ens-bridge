'use client';

import GitHubButton from '@/app/components/GitHubButton';
import { useVerificationStore } from '@/app/lib/store';
import styles from '../page.module.css';

export default function StepConnectGitHub() {
  const { setGitHub, setStep, ensName } = useVerificationStore();

  const handleAuthenticated = (login: string, token: string) => {
    setGitHub(login, token);
    setStep('generate-proof');
  };

  return (
    <div className={styles.card}>
      <h2>Link your GitHub account</h2>
      <p>
        Authenticate with GitHub so we can generate a cryptographic proof of your identity
        for <strong>{ensName}</strong>.
      </p>
      <GitHubButton
        className={styles.actionBtn}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}

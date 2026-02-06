'use client';

import { useState } from 'react';
import { useVerificationStore } from '@/app/lib/store';
import styles from '../page.module.css';

export default function StepGenerateProof() {
  const { githubToken, githubLogin, setProof, setStep, setError, error } =
    useVerificationStore();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proof/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Proof generation failed');
        return;
      }
      setProof(data.proof);
      setStep('upload-ipfs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>Generate ZK-TLS proof</h2>
      <p>
        Create a cryptographic proof that <strong>{githubLogin}</strong> is your
        GitHub account. This takes 10-30 seconds.
      </p>
      {error && <div className={styles.errorBox}>{error}</div>}
      <button
        className={styles.actionBtn}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading && <span className={styles.loader} />}
        {loading ? 'Generating proof...' : 'Generate Proof'}
      </button>
    </div>
  );
}

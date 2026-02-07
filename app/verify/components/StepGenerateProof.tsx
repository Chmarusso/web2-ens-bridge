'use client';

import { useState, useEffect } from 'react';
import { useVerificationStore } from '@/app/lib/store';
import styles from '../page.module.css';

const FACTS = [
  'Notary running inside a TEE. This takes 10-30 seconds.',
  "Notary doesn't see the whole transcript.",
  'Notary attests that the data was served over a valid TLS connection.',
];

export default function StepGenerateProof() {
  const { githubToken, githubLogin, selectedProverId, paymentReceipt, setProof, setStep, setError, error } =
    useVerificationStore();
  const [loading, setLoading] = useState(false);
  const [factIndex, setFactIndex] = useState(0);

  // Rotate facts while loading
  useEffect(() => {
    if (!loading) return;
    setFactIndex(0);
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proof/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          proverId: selectedProverId,
          appSessionId: paymentReceipt?.appSessionId,
        }),
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
      <h2>Generate web proof / zkTLS</h2>
      <p>
        Create a cryptographic proof that <strong>{githubLogin}</strong> is your
        GitHub account.
      </p>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading && (
        <div className={styles.factCarousel}>
          <div className={styles.factItem} key={factIndex}>
            <span className={styles.factBulb}>&#x1F4A1;</span>
            <span>{FACTS[factIndex]}</span>
          </div>
        </div>
      )}

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

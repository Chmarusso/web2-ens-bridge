'use client';

import { useState } from 'react';
import { useVerificationStore } from '@/app/lib/store';
import styles from '../page.module.css';

export default function StepUploadIpfs() {
  const { proof, ipfsCid, ipfsUri, setIpfs, setStep, setError, error } = useVerificationStore();
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'IPFS upload failed');
        return;
      }
      setIpfs(data.cid, data.uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>Upload proof to IPFS</h2>
      <p>
        Store the proof on IPFS so anyone can fetch and verify it. The IPFS URI
        will be written to your ENS text record.
      </p>
      {error && <div className={styles.errorBox}>{error}</div>}
      {ipfsCid && (
        <div className={styles.info}>
          <a
            href={`https://ipfs.io/ipfs/${ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.mono} ${styles.link}`}
            style={{ wordBreak: 'break-all' }}
          >
            {ipfsUri}
          </a>
        </div>
      )}
      {!ipfsCid ? (
        <button
          className={styles.actionBtn}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading && <span className={styles.loader} />}
          {loading ? 'Uploading...' : 'Upload to IPFS'}
        </button>
      ) : (
        <button className={styles.actionBtn} onClick={() => setStep('update-ens')} style={{ marginTop: 8 }}>
          Continue
        </button>
      )}
    </div>
  );
}

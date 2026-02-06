'use client';

import Link from 'next/link';
import { useVerificationStore } from '@/app/lib/store';
import { ENS_KEYS } from '@/app/lib/constants';
import styles from '../page.module.css';

export default function StepSummary() {
  const {
    ensName,
    githubLogin,
    ipfsUri,
    ipfsCid,
    ensSetTextTxHashes,
  } = useVerificationStore();

  return (
    <div className={styles.card}>
      <h2>Verification complete</h2>
      <p>
        Your GitHub identity has been proven and recorded on your ENS name.
      </p>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <strong>ENS Name</strong>
          <span>{ensName}</span>
        </div>

        <div className={styles.summaryItem}>
          <strong>GitHub Handle ({ENS_KEYS.GITHUB_HANDLE})</strong>
          <span>{githubLogin}</span>
        </div>

        <div className={styles.summaryItem}>
          <strong>Proof URI ({ENS_KEYS.GITHUB_PROOF})</strong>
          <span className={styles.mono}>{ipfsUri}</span>
        </div>

        <div className={styles.summaryItem}>
          <strong>IPFS Gateway</strong>
          <a
            href={`https://ipfs.io/ipfs/${ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            View proof on IPFS
          </a>
        </div>

        {ensSetTextTxHashes.map((hash, i) => (
          <div key={hash} className={styles.summaryItem}>
            <strong>Transaction {i + 1}</strong>
            <a
              href={`https://etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.mono} ${styles.link}`}
            >
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </a>
          </div>
        ))}
      </div>

      <div className={styles.row} style={{ marginTop: 24 }}>
        <Link href={`/check?name=${ensName}`} className={styles.actionBtn}>
          Verify on /check
        </Link>
        <Link href="/" className={styles.secondaryBtn}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

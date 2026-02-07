'use client';

import Link from 'next/link';
import { mainnet } from 'wagmi/chains';
import { useVerificationStore } from '@/app/lib/store';
import { ENS_KEYS } from '@/app/lib/constants';
import styles from '../page.module.css';

export default function StepSummary() {
  const {
    chainId,
    ensName,
    githubLogin,
    ipfsUri,
    ipfsCid,
    ensSetTextTxHashes,
  } = useVerificationStore();

  const ipfsGatewayUrl = ipfsCid ? `https://ipfs.io/ipfs/${ipfsCid}` : '#';

  const etherscanBase = chainId === mainnet.id
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io';

  return (
    <div className={styles.card}>
      <div className={styles.successBadge}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="24" fill="#21C9A8" />
          <path d="M15 24.5L21 30.5L33 18.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 style={{ textAlign: 'center' }}>Verification complete</h2>
      <p style={{ textAlign: 'center' }}>
        Your GitHub identity has been proven and recorded on your ENS name.
      </p>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            <strong>ENS Name</strong>
            <a
              href={`https://app.ens.domains/${ensName}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {ensName}
            </a>
          </div>
          <div className={styles.summaryItem}>
            <strong>GitHub Handle</strong>
            <a
              href={`https://github.com/${githubLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {githubLogin}
            </a>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <strong>Proof URI ({ENS_KEYS.GITHUB_PROOF})</strong>
          <a
            href={ipfsGatewayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.mono} ${styles.link}`}
          >
            {ipfsUri}
          </a>
        </div>

        {ensSetTextTxHashes.length > 0 && (
          <div className={styles.summaryRow}>
            {ensSetTextTxHashes.map((hash, i) => (
              <div key={hash} className={styles.summaryItem}>
                <strong>TX {i + 1}: ENS Record Update</strong>
                <a
                  href={`${etherscanBase}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.mono} ${styles.link}`}
                >
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.row} style={{ marginTop: 24, justifyContent: 'center' }}>
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

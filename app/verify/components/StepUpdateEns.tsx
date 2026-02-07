'use client';

import { useState } from 'react';
import { mainnet } from 'wagmi/chains';
import { useVerificationStore } from '@/app/lib/store';
import { useSetEnsText } from '@/app/hooks/useSetEnsText';
import { ENS_KEYS } from '@/app/lib/constants';
import styles from '../page.module.css';

type TxState = 'idle' | 'handle-pending' | 'handle-done' | 'proof-pending' | 'done';

export default function StepUpdateEns() {
  const {
    chainId,
    ensName,
    ensResolver,
    githubLogin,
    ipfsUri,
    addEnsSetTextTx,
    setStep,
    setError,
    ensSetTextTxHashes,
    error,
  } = useVerificationStore();

  const etherscanBase = chainId === mainnet.id
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io';

  const { setText } = useSetEnsText();
  const [txState, setTxState] = useState<TxState>('idle');

  const handleUpdateEns = async () => {
    if (!ensResolver || !ensName || !githubLogin || !ipfsUri) {
      console.error('[UpdateENS] Missing required data:', { ensResolver, ensName, githubLogin, ipfsUri });
      setError('Missing required data — please go back and complete earlier steps.');
      return;
    }

    setError(null);
    try {
      // TX 1: Set com.github → handle
      setTxState('handle-pending');
      const hash1 = await setText(ensResolver, ensName, ENS_KEYS.GITHUB_HANDLE, githubLogin);
      addEnsSetTextTx(hash1);
      setTxState('handle-done');

      // TX 2: Set verified:github:proof → IPFS URI
      setTxState('proof-pending');
      const hash2 = await setText(ensResolver, ensName, ENS_KEYS.GITHUB_PROOF, ipfsUri);
      addEnsSetTextTx(hash2);
      setTxState('done');

      setStep('summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      // Keep current txState so user can see what succeeded
    }
  };

  return (
    <div className={styles.card}>
      <h2>Update ENS records</h2>
      <p>
        Write two text records to your ENS name. You will be prompted to confirm
        each transaction in your wallet.
      </p>

      {error && <div className={styles.errorBox}>{error}</div>}

      {ensSetTextTxHashes.length > 0 && (
        <ul className={styles.txList}>
          {ensSetTextTxHashes.map((hash, i) => (
            <li key={hash}>
              <strong>
                {i === 0 ? `${ENS_KEYS.GITHUB_HANDLE}` : `${ENS_KEYS.GITHUB_PROOF}`}
              </strong>
              <a
                href={`${etherscanBase}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.mono} ${styles.link}`}
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </a>
            </li>
          ))}
        </ul>
      )}

      {txState !== 'done' && (
        <div className={styles.row} style={{ marginTop: 16 }}>
          <button
            className={styles.actionBtn}
            onClick={handleUpdateEns}
            disabled={txState !== 'idle' && txState !== 'handle-done'}
          >
            {(txState === 'handle-pending' || txState === 'proof-pending') && (
              <span className={styles.loader} />
            )}
            {txState === 'idle' && 'Write ENS Records'}
            {txState === 'handle-pending' && 'Confirm in wallet...'}
            {txState === 'handle-done' && 'Continue to second record'}
            {txState === 'proof-pending' && 'Confirm in wallet...'}
          </button>
        </div>
      )}
    </div>
  );
}

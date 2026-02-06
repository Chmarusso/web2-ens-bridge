'use client';

import { mainnet, sepolia } from 'wagmi/chains';
import { useEnsIdentity } from '@/app/hooks/useEnsIdentity';
import { useVerificationStore } from '@/app/lib/store';
import styles from '../page.module.css';

const NETWORKS = [
  { id: sepolia.id, label: 'Sepolia' },
  { id: mainnet.id, label: 'Mainnet' },
] as const;

export default function StepDetectEns() {
  const { chainId, walletAddress, setChainId, setEns, setStep } = useVerificationStore();
  const { ensName, resolverAddress, isLoading, hasEns } = useEnsIdentity(chainId);

  const handleContinue = () => {
    if (ensName && resolverAddress) {
      setEns(ensName, resolverAddress);
      setStep('connect-github');
    }
  };

  return (
    <div className={styles.card}>
      <h2>Detect ENS name</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {NETWORKS.map((n) => (
          <button
            key={n.id}
            className={styles.actionBtn}
            onClick={() => setChainId(n.id)}
            style={{
              opacity: chainId === n.id ? 1 : 0.45,
              padding: '8px 16px',
              fontSize: '0.85rem',
            }}
          >
            {n.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.info}>
          <span className={styles.loaderDark} />
          Looking up ENS for <span className={styles.mono}>{walletAddress}</span>
        </div>
      )}

      {!isLoading && hasEns && (
        <>
          <div className={styles.info}>
            Found <strong>{ensName}</strong> on {NETWORKS.find((n) => n.id === chainId)?.label}
          </div>
          <button className={styles.actionBtn} onClick={handleContinue} style={{ marginTop: 12 }}>
            Continue
          </button>
        </>
      )}

      {!isLoading && !hasEns && (
        <div className={styles.errorBox}>
          No ENS name found on {NETWORKS.find((n) => n.id === chainId)?.label}. Set a primary ENS
          name at{' '}
          <a
            href="https://app.ens.domains"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            app.ens.domains
          </a>{' '}
          or try switching network above.
        </div>
      )}
    </div>
  );
}

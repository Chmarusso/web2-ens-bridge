'use client';

import { useAccount, useDisconnect } from 'wagmi';
import ConnectButton from '@/app/components/ConnectButton';
import { useVerificationStore } from '@/app/lib/store';
import styles from '../page.module.css';

export default function StepConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { setWallet, setStep } = useVerificationStore();

  const handleContinue = () => {
    if (address) {
      setWallet(address);
      setStep('detect-ens');
    }
  };

  return (
    <div className={styles.card}>
      <h2>Connect your wallet</h2>
      <p>Connect the wallet that manages your ENS name.</p>
      {!isConnected && <ConnectButton className={styles.actionBtn} />}
      {isConnected && address && (
        <>
          <div className={styles.info} style={{ justifyContent: 'space-between' }}>
            <span>
              Connected <strong className={styles.mono}>{address.slice(0, 6)}...{address.slice(-4)}</strong>
              {chain && <> on <strong>{chain.name}</strong></>}
            </span>
            <button
              onClick={() => disconnect()}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '2px 6px',
                borderRadius: '6px',
                opacity: 0.6,
              }}
              title="Disconnect wallet"
            >
              &#x23FB;
            </button>
          </div>
          <button className={styles.actionBtn} onClick={handleContinue} style={{ marginTop: 12 }}>
            Continue
          </button>
        </>
      )}
    </div>
  );
}

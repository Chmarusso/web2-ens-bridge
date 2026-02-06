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
      <ConnectButton className={styles.actionBtn} />
      {isConnected && chain && (
        <div className={styles.info} style={{ marginTop: 12 }}>
          Network: <strong>{chain.name}</strong> (id {chain.id})
        </div>
      )}
      {isConnected && address && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className={styles.actionBtn} onClick={handleContinue}>
            Continue
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => disconnect()}
            style={{ opacity: 0.6 }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

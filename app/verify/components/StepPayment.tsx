'use client';

import { useVerificationStore } from '@/app/lib/store';
import { useYellowPayment } from '@/app/hooks/useYellowPayment';
import { PROVERS } from '@/app/lib/constants';
import styles from '../page.module.css';

const STATUS_MESSAGES: Record<string, string> = {
  connecting: 'Connecting to Yellow Network…',
  authenticating: 'Waiting for wallet signature…',
  'creating-session': 'Creating payment session…',
  processing: 'Processing payment…',
  confirming: 'Confirming payment…',
};

export default function StepPayment() {
  const { ensName, githubLogin, selectedProverId, setSelectedProver, setStep, error } =
    useVerificationStore();
  const { startPayment, paymentStatus, paymentReceipt, feeDisplay } = useYellowPayment();

  const activeProver = PROVERS.find((p) => p.id === selectedProverId) ?? PROVERS[0];

  const isProcessing =
    paymentStatus === 'connecting' ||
    paymentStatus === 'authenticating' ||
    paymentStatus === 'creating-session' ||
    paymentStatus === 'processing' ||
    paymentStatus === 'confirming';

  const isCompleted = paymentStatus === 'completed';

  return (
    <div className={styles.card}>
      <h2>Verification fee</h2>
      <p>
        Select a prover and pay a small fee to generate your proof.
        Payment is processed instantly via{' '}
        <a
          href="https://yellow.org"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Yellow Network
        </a>{' '}
        state channels.
      </p>

      {/* Prover selector */}
      {PROVERS.length > 1 && (
        <div className={styles.proverGrid}>
          {PROVERS.map((prover) => (
            <button
              key={prover.id}
              className={`${styles.proverCard} ${activeProver.id === prover.id ? styles.proverCardSelected : ''}`}
              onClick={() => setSelectedProver(prover.id)}
              disabled={isProcessing || isCompleted}
              type="button"
            >
              <span className={styles.proverName}>{prover.name}</span>
              <span className={styles.proverDetail}>
                {prover.network.name}
              </span>
              <span className={styles.proverPrice}>
                {prover.price} {prover.asset.toUpperCase()}
              </span>
              <span className={`${styles.proverDetail} ${styles.mono}`}>
                {prover.walletAddress.slice(0, 6)}…{prover.walletAddress.slice(-4)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Single prover display */}
      {PROVERS.length === 1 && (
        <div className={styles.info}>
          <strong>{activeProver.name}</strong>&nbsp;on {activeProver.network.name} — {feeDisplay}
        </div>
      )}

      <div className={styles.info}>
        Verifying <strong>&nbsp;{githubLogin}&nbsp;</strong> for <strong>&nbsp;{ensName}</strong>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {isProcessing && (
        <div className={styles.info}>
          <span className={styles.loaderDark} />
          {STATUS_MESSAGES[paymentStatus] ?? 'Processing…'}
        </div>
      )}

      {isCompleted && paymentReceipt && (
        <div className={styles.success}>
          ✓ Payment confirmed
        </div>
      )}

      {isCompleted && paymentReceipt && (
        <div className={styles.info}>
          <span className={styles.mono}>
            Session: {paymentReceipt.appSessionId.slice(0, 10)}…
            {paymentReceipt.appSessionId.slice(-8)}
          </span>
        </div>
      )}

      {!isCompleted ? (
        <button
          className={styles.actionBtn}
          onClick={startPayment}
          disabled={isProcessing}
        >
          {isProcessing && <span className={styles.loader} />}
          {isProcessing ? 'Processing…' : `Pay ${feeDisplay}`}
        </button>
      ) : (
        <button
          className={styles.actionBtn}
          onClick={() => setStep('generate-proof')}
        >
          Continue
        </button>
      )}
    </div>
  );
}

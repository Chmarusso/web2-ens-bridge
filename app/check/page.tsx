'use client';

import { Suspense, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { normalize } from 'viem/ens';
import Header from '@/app/components/Header';
import { ENS_KEYS } from '@/app/lib/constants';
import type { ProofVerificationResult } from '@/app/lib/types';
import styles from './page.module.css';

type StepStatus = 'pending' | 'active' | 'done' | 'error';

interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  detailLink?: string;
}

const CHAINS = [
  { id: mainnet.id, label: 'Ethereum Mainnet', chain: mainnet },
  { id: sepolia.id, label: 'Sepolia', chain: sepolia },
];

/* ── proof preview modal ─────────────────────────── */

function ProofModal({
  proof,
  verification,
  onClose,
}: {
  proof: Record<string, unknown>;
  verification: ProofVerificationResult | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Try to pretty-print JSON response body
  let responseBodyFormatted: string | undefined;
  if (verification?.response?.body) {
    try {
      responseBodyFormatted = JSON.stringify(JSON.parse(verification.response.body), null, 2);
    } catch {
      responseBodyFormatted = verification.response.body;
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Web Proof / zkTLS</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {verification ? (
            <>
              {/* TLS verification summary */}
              <div className={styles.proofSection}>
                <h4 className={styles.proofSectionTitle}>TLS Verification</h4>
                <div className={styles.proofField}>
                  <span className={styles.proofFieldLabel}>Status</span>
                  <span className={verification.success ? styles.proofFieldValueOk : styles.proofFieldValueErr}>
                    {verification.success ? 'Valid' : 'Failed'}
                  </span>
                </div>
                <div className={styles.proofField}>
                  <span className={styles.proofFieldLabel}>Server Domain</span>
                  <span className={styles.proofFieldValue}>{verification.serverDomain}</span>
                </div>
                <div className={styles.proofField}>
                  <span className={styles.proofFieldLabel}>Notary Fingerprint</span>
                  <span className={styles.proofFieldValue}>{verification.notaryKeyFingerprint}</span>
                </div>
              </div>

              {/* Request */}
              {verification.request && (
                <div className={styles.proofSection}>
                  <h4 className={styles.proofSectionTitle}>Verified Request</h4>
                  <div className={styles.proofField}>
                    <span className={styles.proofFieldLabel}>Method</span>
                    <span className={styles.proofFieldValue}>{verification.request.method}</span>
                  </div>
                  {verification.request.url && (
                    <div className={styles.proofField}>
                      <span className={styles.proofFieldLabel}>URL</span>
                      <span className={styles.proofFieldValue}>{verification.request.url}</span>
                    </div>
                  )}
                  {verification.request.headers && verification.request.headers.length > 0 && (
                    <div className={styles.proofField}>
                      <span className={styles.proofFieldLabel}>Headers</span>
                      <pre className={styles.proofPre}>
                        {verification.request.headers.map(([k, v]) => `${k}: ${v}`).join('\n')}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Response */}
              {verification.response && (
                <div className={styles.proofSection}>
                  <h4 className={styles.proofSectionTitle}>Verified Response</h4>
                  <div className={styles.proofField}>
                    <span className={styles.proofFieldLabel}>Status</span>
                    <span className={styles.proofFieldValue}>{verification.response.status}</span>
                  </div>
                  {verification.response.headers && verification.response.headers.length > 0 && (
                    <details className={styles.proofDetails}>
                      <summary className={styles.proofFieldLabel}>Headers ({verification.response.headers.length})</summary>
                      <pre className={styles.proofPre}>
                        {verification.response.headers.map(([k, v]) => `${k}: ${v}`).join('\n')}
                      </pre>
                    </details>
                  )}
                  {responseBodyFormatted && (
                    <div className={styles.proofField}>
                      <span className={styles.proofFieldLabel}>Body</span>
                      <pre className={styles.proofPre}>{responseBodyFormatted}</pre>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Fallback: show raw proof JSON */
            <pre className={styles.proofPre}>{JSON.stringify(proof, null, 2)}</pre>
          )}

          {/* Raw proof data (collapsed) */}
          <details className={styles.proofDetails}>
            <summary className={styles.proofFieldLabel}>Raw Proof ({(proof.data as string)?.length ? `${((proof.data as string).length / 2 / 1024).toFixed(1)} KB hex` : 'n/a'})</summary>
            <pre className={styles.proofPre}>{JSON.stringify(proof, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}

/* ── tiny step icons ─────────────────────────────── */

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'active') return <span className={styles.stepSpinner} />;

  if (status === 'done') {
    return (
      <svg className={styles.stepCheck} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
        <path
          d="M7 12.5l3 3 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === 'error') {
    return (
      <svg className={styles.stepError} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
        <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return <span className={styles.stepDot} />;
}

/* ── main content ────────────────────────────────── */

function CheckContent() {
  const searchParams = useSearchParams();
  const [ensInput, setEnsInput] = useState(searchParams.get('name') ?? '');
  const [selectedChainId, setSelectedChainId] = useState<number>(mainnet.id);

  const client = useMemo(() => {
    const chain = CHAINS.find((c) => c.id === selectedChainId)?.chain ?? mainnet;
    return createPublicClient({ chain, transport: http() });
  }, [selectedChainId]);

  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<ProofVerificationResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [proofData, setProofData] = useState<Record<string, unknown> | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const updateStep = useCallback((id: string, update: Partial<PipelineStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)));
  }, []);

  /* ── pipeline ──────────────────────────────────── */

  const runPipeline = useCallback(async () => {
    if (!ensInput.trim()) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setRunning(true);
    setResult(null);
    setShowSuccess(false);
    setProofData(null);

    setSteps([
      { id: 'ens', label: 'Resolving ENS records', status: 'pending' },
      { id: 'ipfs', label: 'Fetching proof from IPFS', status: 'pending' },
      { id: 'verify', label: 'Verifying web proof (zkTLS)', status: 'pending' },
      { id: 'match', label: 'Matching records', status: 'pending' },
    ]);

    await new Promise((r) => setTimeout(r, 120)); // let steps render

    try {
      let name: string;
      try {
        name = normalize(ensInput.trim());
      } catch {
        updateStep('ens', { status: 'error', detail: 'Invalid ENS name' });
        setRunning(false);
        return;
      }

      /* step 1 — resolve ENS */
      updateStep('ens', { status: 'active' });

      const [handle, proofUri] = await Promise.all([
        client.getEnsText({ name, key: ENS_KEYS.GITHUB_HANDLE }),
        client.getEnsText({ name, key: ENS_KEYS.GITHUB_PROOF }),
      ]);

      if (abort.signal.aborted) return;

      if (!handle && !proofUri) {
        updateStep('ens', { status: 'error', detail: 'No verified records found for this name' });
        setRunning(false);
        return;
      }

      const proofShort = proofUri ? `${proofUri.slice(0, 28)}…` : '';
      const proofCid = proofUri ? proofUri.replace('ipfs://', '') : '';
      updateStep('ens', {
        status: 'done',
        detail: [handle ? `com.github → ${handle}` : null, proofUri ? `proof → ${proofShort}` : null]
          .filter(Boolean)
          .join('  ·  '),
        detailLink: proofCid ? `https://ipfs.io/ipfs/${proofCid}` : undefined,
      });

      if (!proofUri) {
        updateStep('ipfs', { status: 'error', detail: 'No proof URI in ENS records' });
        setRunning(false);
        return;
      }

      /* step 2 — fetch IPFS */
      await new Promise((r) => setTimeout(r, 400));
      updateStep('ipfs', { status: 'active' });

      const cid = proofUri.replace('ipfs://', '');
      const gatewayRes = await fetch(`https://ipfs.io/ipfs/${cid}`, { signal: abort.signal });
      if (!gatewayRes.ok) {
        updateStep('ipfs', { status: 'error', detail: 'Failed to fetch from IPFS gateway' });
        setRunning(false);
        return;
      }
      const proof = await gatewayRes.json();
      setProofData(proof);

      if (abort.signal.aborted) return;
      const sizeKb = (JSON.stringify(proof).length / 1024).toFixed(1);
      updateStep('ipfs', { status: 'done', detail: `Proof downloaded · ${sizeKb} KB` });

      /* step 3 — verify proof */
      await new Promise((r) => setTimeout(r, 400));
      updateStep('verify', { status: 'active' });

      const verifyRes = await fetch('/api/proof/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof),
        signal: abort.signal,
      });
      const data: ProofVerificationResult & { error?: string } = await verifyRes.json();

      if (abort.signal.aborted) return;

      if (!verifyRes.ok || !data.success) {
        updateStep('verify', { status: 'error', detail: data.error || 'Proof verification failed' });
        setRunning(false);
        return;
      }

      updateStep('verify', {
        status: 'done',
        detail: `Domain: ${data.serverDomain}  ·  Login: ${data.githubLogin}`,
      });

      /* step 4 — match */
      await new Promise((r) => setTimeout(r, 400));
      updateStep('match', { status: 'active' });
      await new Promise((r) => setTimeout(r, 500));

      const matches = !!(handle && data.githubLogin && data.githubLogin === handle);
      updateStep('match', {
        status: matches ? 'done' : 'error',
        detail: matches
          ? `${data.githubLogin} matches ENS record`
          : `Mismatch: proof says "${data.githubLogin}", ENS says "${handle || '(not set)'}"`,
      });

      setResult(data);

      if (matches) {
        await new Promise((r) => setTimeout(r, 500));
        setShowSuccess(true);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setSteps((prev) =>
        prev.map((s) =>
          s.status === 'active' ? { ...s, status: 'error' as const, detail: (err as Error).message } : s,
        ),
      );
    } finally {
      if (!abort.signal.aborted) setRunning(false);
    }
  }, [client, ensInput, updateStep]);

  /* ── render ────────────────────────────────────── */

  return (
    <div className={styles.checker}>
      <h1 className={styles.title}>Verify ENS Records</h1>
      <p className={styles.subtitle}>
        Verify identity records attached to any ENS name using web proofs (zkTLS).
      </p>

      {/* ── form ──────────────────────────────────── */}
      <div className={styles.card}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runPipeline();
          }}
          className={styles.form}
        >
          <div className={styles.formFields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="ens-input">
                ENS Name
              </label>
              <input
                id="ens-input"
                className={styles.input}
                type="text"
                placeholder="vitalik.eth"
                value={ensInput}
                onChange={(e) => setEnsInput(e.target.value)}
                disabled={running}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="network-select">
                  Network
                </label>
                <select
                  id="network-select"
                  className={styles.select}
                  value={selectedChainId}
                  onChange={(e) => setSelectedChainId(Number(e.target.value))}
                  disabled={running}
                >
                  {CHAINS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="type-select">
                  Verification
                </label>
                <select id="type-select" className={styles.select} defaultValue="github" disabled>
                  <option value="github">GitHub</option>
                </select>
              </div>
            </div>
          </div>

          <button className={styles.verifyBtn} type="submit" disabled={!ensInput.trim() || running}>
            {running ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </div>

      {/* ── pipeline ──────────────────────────────── */}
      {steps.length > 0 && (
        <div className={styles.pipeline}>
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`${styles.pipelineStep} ${styles[`step_${step.status}`]}`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className={styles.stepIndicator}>
                <StepIcon status={step.status} />
                {i < steps.length - 1 && <div className={styles.stepLine} />}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{step.label}</span>
                {step.detail && (
                  step.detailLink ? (
                    <a className={styles.stepDetail} href={step.detailLink} target="_blank" rel="noopener noreferrer">
                      {step.detail}
                    </a>
                  ) : (
                    <span className={styles.stepDetail}>{step.detail}</span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── view proof button ────────────────────── */}
      {proofData && !running && (
        <button
          className={styles.viewProofBtn}
          onClick={() => setShowProofModal(true)}
        >
          View Web Proof
        </button>
      )}

      {/* ── proof modal ───────────────────────────── */}
      {showProofModal && proofData && (
        <ProofModal proof={proofData} verification={result} onClose={() => setShowProofModal(false)} />
      )}

      {/* ── success badge ─────────────────────────── */}
      {showSuccess && result && (
        <div className={styles.successBadge}>
          <svg className={styles.bigCheck} viewBox="0 0 52 52">
            <circle className={styles.bigCheckCircle} cx="26" cy="26" r="24" fill="none" />
            <path className={styles.bigCheckTick} fill="none" d="M14 27l7.8 7.8L38 18" />
          </svg>
          <div className={styles.successText}>
            <strong>Verified</strong>
            <span>
              {result.githubLogin} on GitHub
            </span>
            <span className={styles.mono}>{ensInput}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── page shell ──────────────────────────────────── */

export default function CheckPage() {
  return (
    <main className="page">
      <div className="container">
        <Header />
        <Suspense fallback={<div style={{ padding: '40px 0' }}>Loading…</div>}>
          <CheckContent />
        </Suspense>
      </div>
    </main>
  );
}

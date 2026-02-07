import Link from 'next/link';
import Header from './components/Header';
import s from './page.module.css';

export default function Home() {
  return (
    <main className="page">
      <div className="container">
        <Header />

        {/* ── Hero ── */}
        <section className={s.hero}>
          <h1 className={s.heroTitle}>
            Bridge verified data to ENS.
          </h1>
          <p className={s.heroDesc}>
            Prove your GitHub, Twitter, or any Web data — then attach a
            verifiable, privacy-preserving proof to your ENS text record.
          </p>
          <div className={s.ctaRow}>
            <Link className="cta-primary" href="/verify">
              Get Verified
            </Link>
            <Link className="cta-secondary" href="/check">
              Verify ENS Records
            </Link>
          </div>
        </section>

        {/* ── Video placeholder ── */}
        {/* <section className={s.video}>
          <div className={s.videoCard}>
            <div className={s.playIcon} aria-hidden="true" />
            <span className={s.videoLabel}>Explainer coming soon</span>
          </div>
        </section> */}

        {/* ── How it works diagram ── */}
        <section className={s.diagram} id="how">
          <h2 className={s.diagramTitle}>How proving works</h2>
          <div className={s.flow}>
            <div className={`${s.node} ${s.nodeWeb2}`}>
              <div className={s.nodeCircle}>Server</div>
              <span className={s.nodeLabel}>Web data / JSON</span>
            </div>
            <div className={s.connector} aria-hidden="true" />
            <div className={`${s.node} ${s.nodeZk}`}>
              <div className={s.nodeCircle}>vlayer</div>
              <span className={s.nodeLabel}>Web Proof / zkTLS</span>
            </div>
            <div className={s.connector} aria-hidden="true" />
            <div className={`${s.node} ${s.nodeIpfs}`}>
              <div className={s.nodeCircle}>IPFS</div>
              <span className={s.nodeLabel}>Proof storage</span>
            </div>
            <div className={s.connector} aria-hidden="true" />
            <div className={`${s.node} ${s.nodeEns}`}>
              <div className={s.nodeCircle}>ENS</div>
              <span className={s.nodeLabel}>Text record</span>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={s.faq}>
          <h2 className={s.faqTitle}>FAQ</h2>
          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>What is zkTLS / web proof?</summary>
              <div className={s.faqAnswer}>
                zkTLS (Zero-Knowledge Transport Layer Security) lets you prove
                that specific data was served over a TLS connection — without
                revealing the full response. It turns any HTTPS API into a
                verifiable data source. 
              </div>
            </details>
            <details className={s.faqItem}>
              <summary>Do I need an ENS name?</summary>
              <div className={s.faqAnswer}>
                Yes. You need an ENS name that you control (as owner or
                manager). Your verified credential will be stored as a text
                record on that name.
              </div>
            </details>
            <details className={s.faqItem}>
              <summary>Is my data exposed?</summary>
              <div className={s.faqAnswer}>
                No. You can reduct any sensitive data from the proof (for example GitHub token). Notary cannot see the plaintext.
              </div>
            </details>
            <details className={s.faqItem}>
              <summary>Which platforms are supported?</summary>
              <div className={s.faqAnswer}>
                Currently GitHub is supported, with Twitter and other
                platforms planned. The architecture is extensible to any
                service accessible over HTTPS.
              </div>
            </details>
            <details className={s.faqItem}>
              <summary>How is my data kept secure?</summary>
              <div className={s.faqAnswer}>
                The proof is generated using <a href="https://tlsnotary.org">TLSNotary</a> — a protocol that lets
                a Notary attest to the authenticity of data served over a TLS
                connection without seeing the plaintext. The Notary runs
                inside a Trusted Execution Environment (TEE), which means
                even the operator cannot read or tamper with your data. The
                Notary is economically incentivised to provide honest
                attestations, so the resulting proof is both cryptographically
                and economically secured.
              </div>
            </details>
            <details className={s.faqItem}>
              <summary>Why is the proof stored on IPFS?</summary>
              <div className={s.faqAnswer}>
                <a href="https://docs.ipfs.tech">IPFS</a> (InterPlanetary File System) is a content-addressed
                storage network. Every file gets a unique hash (CID) derived
                from its contents — if a single byte changes, the CID
                changes. This makes proofs tamper-proof by design: the CID in
                your ENS record will only ever resolve to the exact proof
                that was originally uploaded.
              </div>
            </details>
            <details className={s.faqItem}>
              <summary>Why ENS?</summary>
              <div className={s.faqAnswer}>
                <a href="https://docs.ens.domains">ENS</a> (Ethereum Name Service) provides human-readable names
                backed by Ethereum. By writing the proof&apos;s IPFS URI into an
                ENS text record, your credential becomes publicly
                discoverable, tied to your onchain identity, and verifiable
                by anyone — no proprietary API or centralised database
                required.
              </div>
            </details>
            <details className={s.faqItem}>
              <summary>What does it cost?</summary>
              <div className={s.faqAnswer}>
                You need to pay USDC or other tokens for the verification fee to the Notary (to cover TEE infrastructure costs). 
                There are also gas fees to set a text record on your ENS name.
              </div>
            </details>
          </div>
        </section>

        {/* ── GitHub ── */}
        <section className={s.github}>
          <a
            href="https://github.com/Chmarusso/web2-ens-bridge"
            target="_blank"
            rel="noopener noreferrer"
            className={s.githubCard}
          >
            <div className={s.ghIcon} aria-hidden="true" />
            <div className={s.ghText}>
              <span className={s.ghName}>Chmarusso/web2-ens-bridge</span>
              <span className={s.ghDesc}>
                Open-source — star, fork, or contribute.
              </span>
            </div>
          </a>
        </section>

        {/* ── Author ── */}
        <section className={s.author}>
          <a href="https://github.com/Chmarusso" target="_blank" rel="noopener noreferrer">
            <div className={s.authorAvatar} aria-hidden="true" />
          </a>
          <p className={s.authorName}>Chmarusso</p>
          <p className={s.authorBio}>
            Passionate about cryptography, smooth UX in Web3, and open source privacy-driven projects.
          </p>
        </section>

        {/* ── Footer ── */}
        <footer className={s.footerBar}>
          Built with ❤️ for <a href="https://ethglobal.com" target="_blank" rel="noopener noreferrer">ETHGlobal</a> hackathon.
          <br />Powered by ENS + IPFS + TLSNotary + vlayer and Yellow Network.
        </footer>
      </div>
    </main>
  );
}

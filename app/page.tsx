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
          <span className={s.tagline}>Web2 ENS Bridge</span>
          <h1 className={s.heroTitle}>
            Bridge your Web2 identity to ENS.
          </h1>
          <p className={s.heroDesc}>
            Prove your GitHub, Twitter, or any Web2 account — then attach a
            verifiable, privacy-preserving credential to your ENS name.
          </p>
          <div className={s.ctaRow}>
            <Link className="cta-primary" href="/verify">
              Get Verified
            </Link>
            <Link className="cta-secondary" href="/check">
              Check a Name
            </Link>
          </div>
        </section>

        {/* ── Video placeholder ── */}
        <section className={s.video}>
          <div className={s.videoCard}>
            <div className={s.playIcon} aria-hidden="true" />
            <span className={s.videoLabel}>Explainer coming soon</span>
          </div>
        </section>

        {/* ── How it works diagram ── */}
        <section className={s.diagram} id="how">
          <h2 className={s.diagramTitle}>How it works</h2>
          <div className={s.flow}>
            <div className={`${s.node} ${s.nodeWeb2}`}>
              <div className={s.nodeCircle}>W2</div>
              <span className={s.nodeLabel}>Web2 Account</span>
            </div>
            <div className={s.connector} aria-hidden="true" />
            <div className={`${s.node} ${s.nodeZk}`}>
              <div className={s.nodeCircle}>ZK</div>
              <span className={s.nodeLabel}>ZK-TLS Proof</span>
            </div>
            <div className={s.connector} aria-hidden="true" />
            <div className={`${s.node} ${s.nodeEns}`}>
              <div className={s.nodeCircle}>ENS</div>
              <span className={s.nodeLabel}>ENS Record</span>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={s.faq}>
          <h2 className={s.faqTitle}>FAQ</h2>
          <div className={s.faqList}>
            <details className={s.faqItem}>
              <summary>What is ZK-TLS?</summary>
              <div className={s.faqAnswer}>
                ZK-TLS (Zero-Knowledge Transport Layer Security) lets you prove
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
              <summary>Is my Web2 data exposed?</summary>
              <div className={s.faqAnswer}>
                No. The ZK proof attests that your account meets certain
                criteria without leaking the underlying data. Only the claim
                — not the raw credentials — goes onchain.
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
              <summary>What does it cost?</summary>
              <div className={s.faqAnswer}>
                The only cost is the gas fee to set a text record on your ENS
                name. Proof generation and verification are free.
              </div>
            </details>
          </div>
        </section>

        {/* ── GitHub ── */}
        <section className={s.github}>
          <a
            href="https://github.com/artur/ens-verified-records"
            target="_blank"
            rel="noopener noreferrer"
            className={s.githubCard}
          >
            <div className={s.ghIcon} aria-hidden="true" />
            <div className={s.ghText}>
              <span className={s.ghName}>artur/ens-verified-records</span>
              <span className={s.ghDesc}>
                Open-source — star, fork, or contribute.
              </span>
            </div>
          </a>
        </section>

        {/* ── Author ── */}
        <section className={s.author}>
          <div className={s.authorAvatar} aria-hidden="true" />
          <p className={s.authorName}>Your Name</p>
          <p className={s.authorBio}>
            Builder, Ethereum enthusiast, and ENS advocate. Exploring the
            intersection of verifiable identity and decentralised naming.
          </p>
        </section>

        {/* ── Footer ── */}
        <footer className={s.footerBar}>
          Built with ENS + ZK-TLS. Open source and onchain.
        </footer>
      </div>
    </main>
  );
}

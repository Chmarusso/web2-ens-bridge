'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span>Web2ENS Bridge</span>
      </Link>
      <nav className="nav">
        <Link href="/verify">Verify</Link>
        <Link href="/check">Check</Link>
        <Link href="/#how">How it works</Link>
      </nav>
    </header>
  );
}

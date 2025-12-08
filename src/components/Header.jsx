'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header
      style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        borderBottom: '1px solid #eee',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        zIndex: 50,
      }}
    >
      <Link href="/" style={{ fontWeight: 600 }}>
        Mapping Endangered Plants
      </Link>

      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/environment">Map</Link>
        <Link href="/data-sources">Data Sources</Link>
      </nav>
    </header>
  );
}


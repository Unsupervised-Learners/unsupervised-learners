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
      {/* LEFT SIDE LOGO/TITLE */}
      <Link
        href="/"
        style={{
          fontWeight: 700,
          fontSize: '1.2rem',
          textDecoration: 'none',
          color: "#5B7A45",
        }}
      >
        Mapping Endangered Plants
      </Link>

      {/* NAV LINKS */}
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        {[
          { name: 'HOME', href: '/' },
          { name: 'ABOUT', href: '/about' },
          { name: 'MAP', href: '/environment' },
          { name: 'DATA SOURCES', href: '/data-sources' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textDecoration: 'none',
              fontWeight: 700,
              color: "#5B7A45",
              letterSpacing: '0.5px',
            }}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}

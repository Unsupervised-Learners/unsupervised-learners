'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      style={{
        height: '80px',
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
      {/* LEFT LOGO */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={150}
          height={80}
          style={{ width: 'auto', height: '70px' }}
          priority
        />
      </Link>

      {/* NAV */}
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
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}

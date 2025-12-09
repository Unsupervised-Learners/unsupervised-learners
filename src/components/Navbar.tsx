'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent } from 'react';

export default function NavBar() {
  const router = useRouter();

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    router.push(value);
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 24px',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: '#ffffff',
      }}
    >
      <Link
        href="/"
        style={{
          fontWeight: 600,
          fontSize: '1.1rem',
          color: '#4b0082',
          textDecoration: 'none',
        }}
      >
        Mapping Endangered Plants
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#333' }}>
          Home
        </Link>
        {/* scrolls to About section on the home page */}
        <a href="#about" style={{ textDecoration: 'none', color: '#333' }}>
          About
        </a>

        <select defaultValue="" onChange={handleSelectChange}>
          <option value="">Navigate to…</option>
          <option value="/environment">Interactive map</option>
          <option value="/data-sources">Data sources</option>
        </select>
      </nav>
    </header>
  );
}

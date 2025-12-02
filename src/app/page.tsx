'use client';

import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import dynamic from 'next/dynamic';

const Environment_Human = dynamic(() => import('../components/Environment_Human'), {
  ssr: false,
});

export default function HomePage() {

  return (
    <main>
      <Environment_Human />
    </main>
  );
}

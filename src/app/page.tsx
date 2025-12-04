'use client';

import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AboutPage from '@/components/AboutPage';


const Environment_Human = dynamic(() => import('../components/Environment_Human'), {
  ssr: false,
});

const Header_style = dynamic(() => import('../components/Header'), {
  ssr: false,
});

const Footer_style = dynamic(() => import('../components/Footer'), {
  ssr: false,
});

const AboutPage_style = dynamic(() => import('../components/AboutPage'), {
  ssr: false,
});

export default function HomePage() {

  return (
    <main>
      <Header />
      <AboutPage />
      <Environment_Human />
      <Footer />

    </main>
  );
}

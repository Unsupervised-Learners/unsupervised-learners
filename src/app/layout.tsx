// app/layout.tsx
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header />
        {/* MAIN should expand to push footer down */}
        <main style={{ flex: 1, paddingTop: '64px' }}>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}



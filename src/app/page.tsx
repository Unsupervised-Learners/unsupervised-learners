import dynamic from 'next/dynamic';

// Load Environment_Human only on the client
const Environment_Human = dynamic(
  () => import('../components/Environment_Human'),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main>
      <Environment_Human />
    </main>
  );
}


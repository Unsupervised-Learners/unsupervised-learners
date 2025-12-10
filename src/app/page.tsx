export default function HomePage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        backgroundImage: "url('/images/background4.webp')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        paddingTop: "64px",  // header height
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
        ALOHA MAI KĀKOU!
      </h1>

      <h2 style={{ fontSize: "2rem", marginBottom: "1rem", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
        E komo mai
      </h2>

      <p style={{ fontSize: "1.25rem", maxWidth: "600px", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
        Welcome to Nānā i ka ʻāina!
      </p>

      <a
        href="/environment"
        style={{
          marginTop: "2rem",
          padding: "12px 28px",
          background: "rgba(0,0,0,0.5)",
          color: "white",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "1.1rem",
          backdropFilter: "blur(4px)",
        }}
      >
        Enter Site
      </a>
    </div>
  );
}


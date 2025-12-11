export default function AboutPage() {
  return (
    <div
      style={{
        padding: "80px 24px",
        maxWidth: "900px",
        margin: "0 auto",
        lineHeight: 1.7,
      }}
    >
      {/* ---- ABOUT THIS PROJECT ---- */}
      <h1 style={{ textAlign: "center", marginBottom: "24px", fontSize: "2.5rem", color: "#5B7A45" }}>
        ABOUT US
      </h1>

      <p style={{ fontSize: "1.15rem", marginBottom: "48px" }}>
        Our team set out to visualize environmental and human interaction data layered
        on top of one another to help users draw conclusions, recognize patterns, and
        become more familiar with the information being presented. We hope to pique
        users’ interest in ecological data by allowing them to see how different
        variables relate to one another and identify which areas might signal potential
        issues or prompt further investigation. The visualization is designed to be
        exploratory, encouraging users to dive into the data and form their own
        interpretations. It is especially suited for an educational audience, such as
        students or researchers, who want to understand how human activity and
        environmental factors interact. We aim to help users recognize overlaps between
        human-influenced areas and critical environmental regions, highlighting places
        where human activity may threaten Hawaiʻi’s endangered species and ecosystems.
        Users engage with the system by toggling different data layers, selecting those
        that interest them, and observing the spatial patterns that emerge across these
        interconnected datasets.
      </p>

      {/* --- HAWAIIAN PHRASE SECTION --- */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "8px", color: "#5B7A45" }}>NĀNĀ I KA ʻĀINA</h2>
        <p style={{ fontSize: "1.1rem", fontStyle: "italic" }}>
          “Observe the land”
        </p>
        <p style={{ marginTop: "12px", fontSize: "1rem" }}>
          Our project reflects this mindset through visual exploration and our yellow
          hibiscus logo honors Hawaiʻi’s state flower.
        </p>
      </div>

      {/* ---- MEET THE TEAM ---- */}
      <h2
        style={{
          textAlign: "center",
          marginTop: "60px",
          marginBottom: "40px",
          fontSize: "2.5rem",
          color: "#5B7A45"
        }}
      >
        Meet the Team
      </h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "60px",
          flexWrap: "nowrap", // keeps all 3 on one line
          marginBottom: "80px",
        }}
      >
        {/* ---- SHAELYN ---- */}
        <div style={{ width: "260px", textAlign: "center" }}>
          <img
            src="/images/shaelyn_headshot.png"
            alt="Shaelyn Loo"
            style={{
              width: "170px",
              height: "170px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <h3 style={{ marginTop: "16px" }}>Shaelyn Loo</h3>
          <ul style={{ textAlign: "left", marginTop: "10px" }}>
            <li>Undergraduate</li>
            <li>Computer Science: Data Science</li>
          </ul>
        </div>

        {/* ---- NATALIE ---- */}
        <div style={{ width: "260px", textAlign: "center" }}>
          <img
            src="/images/nat_headshot.jpg"
            alt="Natalie Ching"
            style={{
              width: "170px",
              height: "170px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <h3 style={{ marginTop: "16px" }}>Natalie Ching</h3>
          <ul style={{ textAlign: "left", marginTop: "10px" }}>
            <li>Undergraduate</li>
            <li>Computer Science: Data Science</li>
          </ul>
        </div>

        {/* ---- MYRA ---- */}
        <div style={{ width: "260px", textAlign: "center" }}>
          <img
            src="/images/myra_headshot.jpg"
            alt="Myra Ortigosa"
            style={{
              width: "170px",
              height: "170px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <h3 style={{ marginTop: "16px" }}>Myra Ortigosa</h3>
          <ul style={{ textAlign: "left", marginTop: "10px" }}>
            <li>Undergraduate</li>
            <li>Computer Science: Data Science</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

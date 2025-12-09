export default function AboutPage() {
  return (
    <div style={{ padding: "100px 24px 40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>About This Project</h1>
      <p style={{ marginTop: "16px", fontSize: "1.1rem", lineHeight: 1.6 }}>
        This project visualizes endangered and threatened plant species alongside roads,
        urban areas, and other human-built features across the Hawaiian Islands.
        The goal is to help identify areas of potential conservation concern where human
        activity overlaps with sensitive habitats.
      </p>

      <p style={{ marginTop: "16px", fontSize: "1.1rem", lineHeight: 1.6 }}>
        Use the interactive tools to navigate the islands, toggle environmental layers,
        and explore how land use patterns relate to ecological risk.
      </p>
    </div>
  );
}

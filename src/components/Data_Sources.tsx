// components/Data_Sources.tsx

type Dataset = {
  name: string;
  url: string;
  description: string;
};

const datasets: Dataset[] = [
  {
    name: "State Parks",
    url: "https://opendata.hawaii.gov/dataset/state-parks",
    description:
      "This dataset maps the boundaries of over 50 Hawaiʻi State Parks across five islands, created by georeferencing official Executive Order metes-and-bounds maps. It provides general-reference spatial data for understanding park locations, acreage, and management areas within the Hawaiʻi State Park System.",
  },
  {
    name: "Hotels and Visitor Accommodations",
    url: "https://opendata.hawaii.gov/dataset/hotels1",
    description:
      "This dataset provides the geolocated inventory of visitor accommodations across Hawaiʻi, including hotels, B&Bs, hostels, timeshares, and vacation rentals. It can be used to analyze the distribution, type, and density of tourism-related lodging statewide.",
  },
  {
    name: "2020 Urban Areas",
    url: "https://opendata.hawaii.gov/dataset/2020-urban-areas",
    description:
      "This dataset delineates the 2020 Census Urban Areas in Hawaiʻi, defined as regions with at least 5,000 people or 2,000 housing units. It is useful for analyzing population density, urbanization patterns, and planning needs across the state.",
  },
  {
    name: "Roads – Honolulu County",
    url: "https://opendata.hawaii.gov/dataset/roads-honolulu-county",
    description:
      "This dataset contains the 2024 street centerline information for the island of Oʻahu, sourced from the Honolulu Land Information System. It can be used for mapping, transportation analysis, routing, and general spatial planning across Oʻahu’s road network.",
  },
  {
    name: "Critical Habitat Areas",
    url: "https://opendata.hawaii.gov/dataset/areas-of-critical-habitat-consolidated",
    description:
      "This dataset provides a consolidated, statewide map of designated Critical Habitat areas in Hawaiʻi, combining multiple species-specific layers into a single unified layer. It is used to determine whether a location falls within protected habitat zones, supporting conservation planning, environmental review, and land-use decision-making.",
  },
  {
    name: "Threatened & Endangered Plants",
    url: "https://opendata.hawaii.gov/dataset/threatened-endangered-plants",
    description:
      "This dataset maps zones of threatened and endangered plant concentrations across each Hawaiian island, based on DOFAW’s digitized species distribution maps. It can be used to identify areas with varying levels of T&E plant presence to support conservation planning and environmental assessment.",
  },
  {
    name: "Land Use / Land Cover (LULC)",
    url: "https://opendata.hawaii.gov/dataset/land-use-land-cover-lulc",
    description:
      "This dataset provides historical 1976 land use and land cover classifications for the main Hawaiian Islands, derived primarily from manual interpretation of 1970s–1980s aerial photography. It can be used to analyze past landscape conditions, evaluate long-term environmental change, and support historical land-use research.",
  },
];

export default function Data_Sources() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "100px 16px 80px",
      }}
    >
      <div style={{ maxWidth: "900px", width: "100%" }}>
        <h1
          style={{
            textAlign: "center",
            fontSize: "3rem",
            marginBottom: "8px",
            color: "#5B7A45",
          }}
        >
          Data Sources
        </h1>

        <p
          style={{
            marginTop: "8px",
            marginBottom: "32px",
            fontSize: "1.05rem",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          
        </p>

        <div style={{ display: "grid", gap: "24px" }}>
          {datasets.map((ds) => (
            <section
              key={ds.name}
              style={{
                padding: "20px 24px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.96)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.4rem",
                  marginBottom: "8px",
                }}
              >
                {ds.name}
              </h2>

              <a
                href={ds.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginBottom: "8px",
                  color: "#2563eb",
                  textDecoration: "underline",
                  wordBreak: "break-all",
                }}
              >
                {ds.url}
              </a>

              <p style={{ margin: 0, fontSize: "0.98rem", lineHeight: 1.7 }}>
                {ds.description}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}


"use client";

import React, { useEffect, useRef } from "react";
import Plotly, { Data, Layout } from "plotly.js-dist-min";
// import plantsData from "@/datasets/Threatened-Endangered_Plants.geojson";
// import chData from "@/datasets/Areas_of_Critical_Habitat_(Consolidated).geojson";

type DensityKey = "O" | "L" | "M" | "H" | "VH" | "OLO";

const densityColor: Record<DensityKey, string> = {
  O: "#f2f0f7",
  L: "#cbc9e2",
  M: "#9e9ac8",
  H: "#756bb1",
  VH: "#54278f",
  OLO: "#bdbdbd",
};

const densityMeaning: Record<DensityKey, string> = {
  O: "Occasional",
  L: "Low",
  M: "Medium",
  H: "High",
  VH: "Very High",
  OLO: "Old Low Occurrence",
};

export default function CombinedMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;

    // --------------------------
    // PROCESS PLANTS GEOJSON
    // --------------------------
    const plantsGeo = plantsData as any;

    plantsGeo.features.forEach((f: any) => {
      const d: DensityKey = (f.properties.density ?? "O") as DensityKey;

      f.properties.fillColor = densityColor[d] ?? "#cccccc";
      f.properties.hoverText =
        `Density: ${d}\n${densityMeaning[d] ?? ""}\n` +
        `Area: ${f.properties.st_areashape?.toLocaleString()}\n` +
        `Perimeter: ${f.properties.st_perimetershape?.toLocaleString()}`;
    });

    // --------------------------
    // PROCESS CRITICAL HABITAT
    // --------------------------
    const chGeo = chData as any;

    chGeo.features.forEach((f: any) => {
      f.properties.hoverText = `Habitat ID: ${f.properties.Id ?? "N/A"}`;
    });

    // --------------------------
    // BUILD LAYERS
    // --------------------------
    const plantsFillLayer = {
      sourcetype: "geojson" as const,
      source: {
        type: "FeatureCollection",
        features: plantsGeo.features,
      },
      type: "fill" as const,
      color: plantsGeo.features[0]?.properties?.fillColor ?? "#cccccc",
      opacity: 0.55,
      below: "water",
    };

    const plantsOutlineLayer = {
      sourcetype: "geojson" as const,
      source: {
        type: "FeatureCollection",
        features: plantsGeo.features,
      },
      type: "line" as const,
      color: "#222",
      line: { width: 1 },
    };

    const chFillLayer = {
      sourcetype: "geojson" as const,
      source: chGeo,
      type: "fill" as const,
      color: "rgba(255, 0, 0, 0.3)",
      opacity: 0.3,
      below: "water",
    };

    const chOutlineLayer = {
      sourcetype: "geojson" as const,
      source: chGeo,
      type: "line" as const,
      color: "red",
      line: { width: 2 },
    };

    const allLayers = [
      plantsFillLayer,
      plantsOutlineLayer,
      chFillLayer,
      chOutlineLayer,
    ];

    // --------------------------
    // CREATE SCATTER TRACE FOR PLANTS
    // --------------------------
    const plantsScatter: Data = {
      type: "scattermapbox",
      mode: "markers",
      lat: plantsGeo.features.map((f: any) => f.properties.centroid_lat),
      lon: plantsGeo.features.map((f: any) => f.properties.centroid_lon),
      marker: {
        size: 6,
        color: "purple",
      },
      text: plantsGeo.features.map((f: any) => f.properties.hoverText),
      hovertemplate: "%{text}<extra></extra>",
    };

    // --------------------------
    // CREATE SCATTER FOR CRITICAL HABITAT
    // --------------------------
    const chScatter: Data = {
      type: "scattermapbox",
      mode: "markers",
      lat: chGeo.features.map((f: any) => f.properties.centroid_lat ?? 0),
      lon: chGeo.features.map((f: any) => f.properties.centroid_lon ?? 0),
      marker: {
        size: 6,
        color: "red",
      },
      text: chGeo.features.map((f: any) => f.properties.hoverText),
      hovertemplate: "%{text}<extra></extra>",
    };

    // --------------------------
    // LAYOUT
    // --------------------------
    const layout: Partial<Layout> = {
      autosize: true,
      mapbox: {
        style: "carto-positron",
        center: { lat: 20.6, lon: -157.5 },
        zoom: 7.3,
        layers: allLayers,
      },
      hovermode: "closest",
      margin: { t: 0, b: 0, l: 0, r: 0 },
    };

    // --------------------------
    // PLOT (non-null assertion fixes TS)
    // --------------------------
    Plotly.newPlot(
      divRef.current!, // <-- FIXES YOUR ERROR
      [chScatter, plantsScatter],
      layout,
      { displayModeBar: true }
    );

    return () => {
      if (divRef.current) {
        Plotly.purge(divRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={divRef}
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        border: "1px solid #ccc",
      }}
    />
  );
}

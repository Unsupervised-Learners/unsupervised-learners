'use client';

import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

// ---------- Types ----------
type Coordinate = [number, number];

type Polygon = { type: 'Polygon'; coordinates: Coordinate[][] };
type MultiPolygon = { type: 'MultiPolygon'; coordinates: Coordinate[][][] };

type LineString = { type: 'LineString'; coordinates: Coordinate[] };
type MultiLineString = { type: 'MultiLineString'; coordinates: Coordinate[][] };

type UrbanProps = {
  NAME?: string;
  UA_NAME?: string;
  name20?: string;      
  namesad20?: string;   
  [k: string]: unknown;
};

type RoadProps = { [k: string]: unknown };

type Feature<G, P> = {
  type: 'Feature';
  geometry: G;
  properties: P;
};

type FeatureCollection<F> = {
  type: 'FeatureCollection';
  features: F[];
};

type UrbanFeature = Feature<Polygon | MultiPolygon, UrbanProps>;
type RoadFeature = Feature<LineString | MultiLineString, RoadProps>;

// ---------- Component ----------
export default function UrbanRoadMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let cancelled = false;

    async function render() {
      try {
        // 1) Load urban + roads from /public/datasets
        const [urbanResp, roadsResp] = await Promise.all([
          fetch('/datasets/2020_Urban_Areas.geojson'),
          fetch('/datasets/roads_simplified.json'),
        ]);

        if (!urbanResp.ok || !roadsResp.ok) {
          divRef.current!.innerHTML =
            '<div style="padding:1rem">Failed to load GeoJSON files.</div>';
          return;
        }

        const urban = (await urbanResp.json()) as FeatureCollection<UrbanFeature>;
        const roads = (await roadsResp.json()) as FeatureCollection<RoadFeature>;
        if (cancelled) return;

        // 2) Compute overall center from urban polygons
        const allCoords: Coordinate[] = urban.features.flatMap(f =>
          f.geometry.type === 'Polygon'
            ? f.geometry.coordinates.flat()
            : f.geometry.coordinates.flat(2)
        );

        const centerLat =
          allCoords.reduce((s, c) => s + c[1], 0) / (allCoords.length || 1);
        const centerLon =
          allCoords.reduce((s, c) => s + c[0], 0) / (allCoords.length || 1);

        // 3) Centroids + hover text for urban areas
        const centroidLat: number[] = [];
        const centroidLon: number[] = [];
        const hoverText: string[] = [];

        urban.features.forEach(f => {
          const ring =
            f.geometry.type === 'Polygon'
              ? f.geometry.coordinates[0]
              : f.geometry.coordinates[0][0];

          const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
          const lon = ring.reduce((s, c) => s + c[0], 0) / ring.length;

          centroidLat.push(lat);
          centroidLon.push(lon);

          const name =
            f.properties.name20 ||
            f.properties.namesad20 ||
            f.properties.NAME ||
            f.properties.UA_NAME ||
            'Urban Area';

          hoverText.push(`Urban Area: ${name}`);
        });

        // 4) Mapbox layers: urban fill + roads line
        const urbanFillLayers = urban.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          type: 'fill' as const,
          color: 'rgba(0, 0, 255, 0.35)', // semi-transparent blue
          below: 'water',
        }));

        const roadsLayer = {
          sourcetype: 'geojson' as const,
          source: roads,
          type: 'line' as const,
          color: '#000000',
          line: { width: 1 },
        };

        // Invisible scatter just for hover
        const hoverLayer = {
          type: 'scattermapbox' as const,
          lat: centroidLat,
          lon: centroidLon,
          mode: 'markers',
          marker: { size: 5, color: 'rgba(0,0,0,0)' },
          text: hoverText,
          hovertemplate: '%{text}<extra></extra>',
        };

        const layout: Partial<Plotly.Layout> = {
          autosize: true,
          mapbox: {
            style: 'open-street-map',
            center: { lat: centerLat, lon: centerLon },
            zoom: 10,
            layers: [...urbanFillLayers, roadsLayer], // conceptually your single “urban + roads” layer
          },
          hovermode: 'closest',
          margin: { t: 0, r: 0, b: 0, l: 0 },
        };

        if (divRef.current) {
          try {
            (Plotly as any).purge(divRef.current);
          } catch {}
          Plotly.newPlot(divRef.current, [hoverLayer] as any, layout, {
            displayModeBar: true,
            responsive: true,
          });
        }
      } catch (err) {
        console.error(err);
        if (divRef.current)
          divRef.current.innerHTML = `<div style="padding:1rem">Error: ${String(
            err
          )}</div>`;
      }
    }

    render();

    return () => {
      cancelled = true;
      if (divRef.current && (Plotly as any).purge) {
        (Plotly as any).purge(divRef.current);
      }
    };
  }, []);

  return <div ref={divRef} style={{ width: '100vw', height: '100vh' }} />;
}


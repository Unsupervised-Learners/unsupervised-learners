'use client';

import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

type Coordinate = [number, number];
type GeoJSONPolygon = { type: 'Polygon'; coordinates: Coordinate[][] };
type GeoJSONMultiPolygon = { type: 'MultiPolygon'; coordinates: Coordinate[][][] };

type HabitatProperties = {
  island?: string;
  critical_h?: string;
  acres?: number;
  st_areashape?: number;
  st_perimetershape?: number;
  [k: string]: unknown;
};

type HabitatFeature = { type: 'Feature'; properties: HabitatProperties; geometry: GeoJSONPolygon | GeoJSONMultiPolygon };
type FeatureCollection<T> = { type: 'FeatureCollection'; features: T[] };

export default function HabitatMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let cancelled = false;

    async function render() {
      try {
        const resp = await fetch('/datasets/Areas_of_Critical_Habitat_(Consolidated).geojson');
        if (!resp.ok) {
          divRef.current!.innerHTML = '<div style="padding:1rem">Failed to load GeoJSON.</div>';
          return;
        }

        const geojson = (await resp.json()) as FeatureCollection<HabitatFeature>;
        if (cancelled) return;

        // --- Island colors ---
        const islandColors: Record<string, string> = {
          Hawaii: '#1f78b4',
          Oahu: '#33a02c',
          Maui: '#e31a1c',
          Kauai: '#ff7f00',
          Molokai: '#6a3d9a',
          Lanai: '#b15928'
        };
        const defaultColor = '#a6cee3';

        // --- Add fill color & hover text ---
        geojson.features.forEach(f => {
          const isl = f.properties.island ?? '';
          f.properties.fillColor = islandColors[isl] ?? defaultColor;
          f.properties.hoverText =
            `Island: ${isl}\n` +
            `Critical Habitat: ${f.properties.critical_h ?? 'N/A'}\n` +
            `Acres: ${f.properties.acres?.toLocaleString() ?? 'N/A'}\n` +
            `Area: ${f.properties.st_areashape?.toLocaleString() ?? 'N/A'}\n` +
            `Perimeter: ${f.properties.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        // --- Compute map center ---
        const allCoords = geojson.features.flatMap(f =>
          f.geometry.type === 'Polygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates.flat(2)
        );
        const centerLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
        const centerLon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;

        // --- Fill layers ---
        const fillLayers = geojson.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          type: 'fill' as const,
          color: f.properties.fillColor as string,
          opacity: 0.55,
          below: 'water'
        }));

        // --- Outline layer ---
        const outlineLayer = {
          sourcetype: 'geojson' as const,
          source: geojson,
          type: 'line' as const,
          color: 'black',
          line: { width: 1 },
        };

        // --- Scatter layer for hover ---
        const scatterPoints = {
          type: 'scattermapbox' as const,
          lat: geojson.features.map(f => {
            const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
            return coords.reduce((s, c) => s + c[1], 0) / coords.length;
          }),
          lon: geojson.features.map(f => {
            const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
            return coords.reduce((s, c) => s + c[0], 0) / coords.length;
          }),
          mode: 'markers' as const,
          marker: { size: 1, color: 'rgba(0,0,0,0)' },
          text: geojson.features.map(f => f.properties.hoverText),
          hovertemplate: '%{text}<extra></extra>'
        };

        const layout: Partial<Plotly.Layout> = {
          autosize: true,
          mapbox: {
            style: 'open-street-map',
            center: { lat: centerLat, lon: centerLon },
            zoom: 7.1,
            layers: [...fillLayers, outlineLayer],
          },
          hovermode: 'closest',
          margin: { t: 0, l: 0, r: 0, b: 0 },
        };

        if (divRef.current) {
          try { (Plotly as any).purge(divRef.current); } catch {}
          Plotly.newPlot(divRef.current, [scatterPoints] as any, layout, { displayModeBar: true });
        }
      } catch (err) {
        if (divRef.current) divRef.current.innerHTML = `<div style="padding:1rem">Error loading map: ${err}</div>`;
      }
    }

    render();

    return () => {
      cancelled = true;
      if (divRef.current && (Plotly as any).purge) (Plotly as any).purge(divRef.current);
    };
  }, []);

  return <div ref={divRef} style={{ width: '100vw', height: '100vh' }} />;
}

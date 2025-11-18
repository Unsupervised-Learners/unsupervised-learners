'use client';

import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

type Coordinate = [number, number];
type GeoJSONPolygon = { type: 'Polygon'; coordinates: Coordinate[][] };
type GeoJSONMultiPolygon = { type: 'MultiPolygon'; coordinates: Coordinate[][][] };

type PlantsProperties = {
  density?: 'O' | 'L' | 'M' | 'H' | 'VH' | 'OLO';
  st_areashape?: number;
  st_perimetershape?: number;
  [k: string]: unknown;
};

type PlantsFeature = { type: 'Feature'; properties: PlantsProperties; geometry: GeoJSONPolygon | GeoJSONMultiPolygon };
type FeatureCollection<T> = { type: 'FeatureCollection'; features: T[] };

export default function PlotlyMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let cancelled = false;

    async function render() {
      try {
        const resp = await fetch('/datasets/Threatened-Endangered_Plants.geojson');
        if (!resp.ok) {
          divRef.current!.innerHTML = '<div style="padding:1rem">Failed to load GeoJSON.</div>';
          return;
        }

        const geojson = (await resp.json()) as FeatureCollection<PlantsFeature>;
        if (cancelled) return;

        // --- Density meaning & colors ---
        const densityMeaning: Record<string, string> = {
          O: 'Little or no T&E species.',
          L: 'Low concentration of T&E species.',
          M: 'Medium concentration of T&E species.',
          H: 'High concentration of T&E species.',
          VH: 'Very high concentration of T&E species.',
          OLO: 'OL in cane fields, L in gullies and coastal areas.',
        };

        const densityColor: Record<string, string> = {
          O: '#d9d9d9',
          L: '#a6cee3',
          M: '#1f78b4',
          H: '#b2df8a',
          VH: '#33a02c',
          OLO: '#fb9a99',
        };

        // --- Add fill color & hover text ---
        geojson.features.forEach(f => {
          const d = f.properties.density ?? 'O';
          f.properties.fillColor = densityColor[d] ?? '#cccccc';
          f.properties.hoverText = `Density: ${d}\n${densityMeaning[d] ?? ''}\nArea: ${f.properties.st_areashape?.toLocaleString()}\nPerimeter: ${f.properties.st_perimetershape?.toLocaleString()}`;
        });

        // --- Map center ---
        const allCoords = geojson.features.flatMap(f =>
          f.geometry.type === 'Polygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates.flat(2)
        );
        const centerLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
        const centerLon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;

        // --- Fill layers ---
        const fillLayers = geojson.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          below: 'water',
          type: 'fill' as const,
          color: f.properties.fillColor as string,
          opacity: 0.65,
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
          mode: 'markers',
          marker: { size: 1, color: 'rgba(0,0,0,0)' },
          text: geojson.features.map(f => f.properties.hoverText),
          hovertemplate: '%{text}<extra></extra>',
        };

        const layout: Partial<Plotly.Layout> = {
          autosize: true,
          mapbox: {
            style: 'open-street-map',
            center: { lat: centerLat, lon: centerLon },
            zoom: 7.5,
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

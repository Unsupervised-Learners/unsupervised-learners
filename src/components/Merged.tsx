'use client';

import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

// --- GeoJSON types ---
type Coordinate = [number, number];
type GeoJSONPolygon = { type: 'Polygon'; coordinates: Coordinate[][] };
type GeoJSONMultiPolygon = { type: 'MultiPolygon'; coordinates: Coordinate[][][] };

// --- Generic Feature & FeatureCollection types ---
type FeatureProperties = { [k: string]: any };
type Feature<T extends FeatureProperties> = {
  type: 'Feature';
  properties: T;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
};
type FeatureCollection<T extends FeatureProperties> = { type: 'FeatureCollection'; features: Feature<T>[] };

// --- Component ---
export default function CombinedMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let cancelled = false;

    async function render() {
      try {
        // --- Fetch both GeoJSON datasets ---
        const [plantsResp, habitatResp] = await Promise.all([
          fetch('/datasets/Threatened-Endangered_Plants.geojson'),
          fetch('/datasets/Areas_of_Critical_Habitat_(Consolidated).geojson'),
        ]);

        if (!plantsResp.ok || !habitatResp.ok) {
          divRef.current!.innerHTML = '<div style="padding:1rem">Failed to load GeoJSON.</div>';
          return;
        }

        const plantsGeojson = (await plantsResp.json()) as FeatureCollection<FeatureProperties>;
        const habitatGeojson = (await habitatResp.json()) as FeatureCollection<FeatureProperties>;
        if (cancelled) return;

        // --- Define color mappings ---
        const plantColors: Record<string, string> = { O: '#d9d9d9', L: '#a6cee3', M: '#1f78b4', H: '#b2df8a', VH: '#33a02c', OLO: '#fb9a99' };
        const habitatColors: Record<string, string> = { Hawaii: '#1f78b4', Oahu: '#33a02c', Maui: '#e31a1c', Kauai: '#ff7f00', Molokai: '#6a3d9a', Lanai: '#b15928' };

        // --- Add fillColor & hoverText ---
        plantsGeojson.features.forEach(f => {
          const props = f.properties as FeatureProperties & { fillColor?: string; hoverText?: string };
          const density = props.density ?? 'O';
          props.fillColor = plantColors[density] ?? '#cccccc';
          props.hoverText = `Density: ${density}\nArea: ${props.st_areashape?.toLocaleString() ?? 'N/A'}\nPerimeter: ${props.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        habitatGeojson.features.forEach(f => {
          const props = f.properties as FeatureProperties & { fillColor?: string; hoverText?: string };
          const isl = props.island ?? '';
          props.fillColor = habitatColors[isl] ?? '#a6cee3';
          props.hoverText = `Island: ${isl}\nCritical Habitat: ${props.critical_h}\nAcres: ${props.acres?.toLocaleString() ?? 'N/A'}\nArea: ${props.st_areashape?.toLocaleString() ?? 'N/A'}\nPerimeter: ${props.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        // --- Combine all features to compute map center ---
        const allCoords = [...plantsGeojson.features, ...habitatGeojson.features].flatMap(f =>
          f.geometry.type === 'Polygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates.flat(2)
        );
        const centerLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
        const centerLon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;

        // --- Fill layers ---
        const fillLayers = [
          ...plantsGeojson.features.map(f => ({
            sourcetype: 'geojson' as const,
            source: { type: 'FeatureCollection', features: [f] },
            type: 'fill' as const,
            color: f.properties.fillColor as string,
            opacity: 0.55,
            below: 'water',
          })),
          ...habitatGeojson.features.map(f => ({
            sourcetype: 'geojson' as const,
            source: { type: 'FeatureCollection', features: [f] },
            type: 'fill' as const,
            color: f.properties.fillColor as string,
            opacity: 0.55,
            below: 'water',
          })),
        ];

        // --- Outline layer (combined) ---
        const outlineLayer = {
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [...plantsGeojson.features, ...habitatGeojson.features] },
          type: 'line' as const,
          color: 'black',
          line: { width: 1 },
        };

        // --- Scatter layer for hover ---
        const scatterPoints = {
          type: 'scattermapbox' as const,
          lat: [...plantsGeojson.features, ...habitatGeojson.features].map(f => {
            const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
            return coords.reduce((s, c) => s + c[1], 0) / coords.length;
          }),
          lon: [...plantsGeojson.features, ...habitatGeojson.features].map(f => {
            const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
            return coords.reduce((s, c) => s + c[0], 0) / coords.length;
          }),
          mode: 'markers' as const,
          marker: { size: 1, color: 'rgba(0,0,0,0)' },
          text: [...plantsGeojson.features, ...habitatGeojson.features].map(f => f.properties.hoverText),
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

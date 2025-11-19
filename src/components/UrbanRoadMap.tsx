'use client';

import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

// ---------- Types ----------
type Coordinate = [number, number];

type Polygon = { type: 'Polygon'; coordinates: Coordinate[][] };
type MultiPolygon = { type: 'MultiPolygon'; coordinates: Coordinate[][][] };

type LineString = { type: 'LineString'; coordinates: Coordinate[] };
type MultiLineString = { type: 'MultiLineString'; coordinates: Coordinate[][] };

type Point = { type: 'Point'; coordinates: Coordinate };

// Includes lowercase
type UrbanProps = {
  UACE20?: string;
  GEOID20?: string;
  geoid20?: string;      
  NAME20?: string;
  name20?: string;       
  NAMELSAD20?: string;
  namelsad20?: string;   
  ALAND20?: number;
  AREALANDSQMI?: number;
  AWATER20?: number;
  AREAWATERSQMI?: number;
  POP?: number;
  pop?: number;          
  HOUSING?: number;
  POPDEN?: number;
  popden?: number;       
  INTPTLAT20?: string;
  INTPTLONG20?: string;
  Shape_Length?: number;
  Shape_Area?: number;
  [k: string]: unknown;
};

type RoadProps = { [k: string]: unknown };

type HotelProps = {
  name?: string;
  NAME?: string;
  hotel_name?: string;
  [k: string]: unknown;
};

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
type HotelFeature = Feature<Point, HotelProps>;

// ---------- Component ----------
export default function UrbanRoadMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let cancelled = false;

    async function render() {
      try {
        // 1) Load urban + roads + hotels from /public/datasets
        const [urbanResp, roadsResp, hotelsResp] = await Promise.all([
          fetch('/datasets/2020_Urban_Areas.geojson'),
          fetch('/datasets/roads_simplified.json'),
          fetch('/datasets/Hotels.geojson'),
        ]);

        if (!urbanResp.ok || !roadsResp.ok || !hotelsResp.ok) {
          divRef.current!.innerHTML =
            '<div style="padding:1rem">Failed to load one or more GeoJSON files.</div>';
          return;
        }

        const urban = (await urbanResp.json()) as FeatureCollection<UrbanFeature>;
        const roads = (await roadsResp.json()) as FeatureCollection<RoadFeature>;
        const hotels = (await hotelsResp.json()) as FeatureCollection<HotelFeature>;
        if (cancelled) return;

        console.log('Urban polygons:', urban.features.length);
        console.log('Road segments:', roads.features.length);
        console.log('Hotels:', hotels.features.length);

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

        // Palette for urban areas
        const palette = [
          'rgba(31,119,180,0.45)',
          'rgba(255,127,14,0.45)',
          'rgba(44,160,44,0.45)',
          'rgba(214,39,40,0.45)',
          'rgba(148,103,189,0.45)',
          'rgba(140,86,75,0.45)',
          'rgba(227,119,194,0.45)',
          'rgba(127,127,127,0.45)',
          'rgba(188,189,34,0.45)',
          'rgba(23,190,207,0.45)',
        ];

        const geoidToColor: Record<string, string> = {};
        let paletteIndex = 0;

        for (const f of urban.features) {
          // NEW: support GEOID20 or geoid20
          const id = f.properties.GEOID20 ?? f.properties.geoid20 ?? `id-${paletteIndex}`;
          if (!geoidToColor[id]) {
            geoidToColor[id] = palette[paletteIndex % palette.length];
            paletteIndex += 1;
          }
        }

        // 3) Centroids + hover text for urban areas
        const centroidLat: number[] = [];
        const centroidLon: number[] = [];
        const urbanHoverText: string[] = [];

        urban.features.forEach(f => {
          const ring =
            f.geometry.type === 'Polygon'
              ? f.geometry.coordinates[0]
              : f.geometry.coordinates[0][0];

          const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
          const lon = ring.reduce((s, c) => s + c[0], 0) / ring.length;

          centroidLat.push(lat);
          centroidLon.push(lon);

          // NEW: support NAMELSAD20 / namelsad20 / NAME20 / name20
          const name =
            f.properties.NAMELSAD20 ||
            f.properties.namelsad20 ||
            f.properties.NAME20 ||
            f.properties.name20 ||
            'Urban Area';

          const geoid =
            f.properties.GEOID20 ??
            f.properties.geoid20 ??
            'N/A';

          const pop = f.properties.POP ?? f.properties.pop ?? null;
          const density = f.properties.POPDEN ?? f.properties.popden ?? null;

          urbanHoverText.push(
            `Urban Area: ${name}` +
            `<br>GEOID20: ${geoid}` +
            (pop != null ? `<br>Population: ${pop.toLocaleString()}` : '') +
            (density != null ? `<br>Density: ${density} people/sq mi` : '')
          );
        });

        // 4) Hotel coordinates + hover text
        const hotelLat: number[] = [];
        const hotelLon: number[] = [];
        const hotelHoverText: string[] = [];

        hotels.features.forEach(f => {
          const [lon, lat] = f.geometry.coordinates;
          hotelLat.push(lat);
          hotelLon.push(lon);

          const name =
            f.properties.hotel_name ||
            f.properties.name ||
            f.properties.NAME ||
            'Hotel';

          hotelHoverText.push(`Hotel: ${name}`);
        });

        // 5) Mapbox layers: urban fill + roads line
        const urbanFillLayers = urban.features.map(f => {
          const id =
            f.properties.GEOID20 ??
            f.properties.geoid20 ??
            'unknown';
          const color = geoidToColor[id] ?? 'rgba(200,200,200,0.45)';

          return {
            sourcetype: 'geojson' as const,
            source: { type: 'FeatureCollection', features: [f] },
            type: 'fill' as const,
            color,
            below: 'water',
          };
        });

        const roadsLayer = {
          sourcetype: 'geojson' as const,
          source: roads,
          type: 'line' as const,
          color: '#000000',
          line: { width: 1 },
        };

        // 6) Invisible scatter for urban hover
        const urbanHoverLayer = {
          type: 'scattermapbox' as const,
          lat: centroidLat,
          lon: centroidLon,
          mode: 'markers',
          // NEW: bigger invisible markers so hover works more reliably
          marker: { size: 18, color: 'rgba(0,0,0,0)' },
          text: urbanHoverText,
          hovertemplate: '%{text}<extra></extra>',
          name: 'Urban Areas',
        };

        // 7) Visible scatter for hotels
        const hotelsLayer = {
          type: 'scattermapbox' as const,
          lat: hotelLat,
          lon: hotelLon,
          mode: 'markers',
          marker: {
            size: 8,
            color: 'red',
            symbol: 'circle',
          },
          text: hotelHoverText,
          name: 'Hotels',
          hovertemplate: '%{text}<extra></extra>',
        };

        const layout: Partial<Plotly.Layout> = {
          autosize: true,
          mapbox: {
            style: 'open-street-map',
            center: { lat: centerLat, lon: centerLon },
            zoom: 10,
            layers: [...urbanFillLayers, roadsLayer], // base polygons + roads
          },
          hovermode: 'closest',
          margin: { t: 0, r: 0, b: 0, l: 0 },
          showlegend: true,
        };

        if (divRef.current) {
          try {
            (Plotly as any).purge(divRef.current);
          } catch {}
          Plotly.newPlot(
            divRef.current,
            [urbanHoverLayer, hotelsLayer] as any,
            layout,
            { displayModeBar: true, responsive: true, scrollZoom: true }
          );
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

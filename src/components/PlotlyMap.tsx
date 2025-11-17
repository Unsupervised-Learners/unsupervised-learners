'use client';

import { useEffect, useRef } from 'react';

interface Props {
  showPlants: boolean;
  showCriticalHabitat: boolean;
}

/* -----------------------------------------------------------
   GeoJSON TYPES
------------------------------------------------------------ */

type Coordinate = [number, number];

type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: Coordinate[][];
};

type GeoJSONMultiPolygon = {
  type: 'MultiPolygon';
  coordinates: Coordinate[][][];
};

type PlantsFeature = {
  type: 'Feature';
  properties: {
    density: 'O' | 'L' | 'M' | 'H' | 'VH' | 'OLO';
    st_areashape: number;
  };
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
};

type HabitatFeature = {
  type: 'Feature';
  properties: {
    island: string;
    acres: number;
  };
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
};

interface GeoJSONFeatureCollection<T> {
  type: 'FeatureCollection';
  features: T[];
}

/* -----------------------------------------------------------
   COMPONENT
------------------------------------------------------------ */

export default function PlotlyMap({ showPlants, showCriticalHabitat }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { Plotly } = (window as unknown as { Plotly?: any });
    if (!Plotly) return;

    async function loadMap() {
      if (!divRef.current) return;

      /* ---------------------------
         LOAD DATASETS
      ---------------------------- */
      const plants: GeoJSONFeatureCollection<PlantsFeature> = await fetch(
        '/datasets/Threatened-Endangered_Plants.geojson',
      ).then((res) => res.json());

      const habitat: GeoJSONFeatureCollection<HabitatFeature> = await fetch(
        '/datasets/Areas_of_Critical_Habitat_(Consolidated).geojson',
      ).then((res) => res.json());

      const traces: any[] = [];

      /* ---------------------------
         1. PLANTS LAYER
      ---------------------------- */
      if (showPlants) {
        const colorMap: Record<string, string> = {
          O: '#d9d9d9',
          L: '#a6cee3',
          M: '#1f78b4',
          H: '#b2df8a',
          VH: '#33a02c',
          OLO: '#fb9a99',
        };

        plants.features.forEach((f) => {
          const { density } = f.properties;
          const baseColor = colorMap[density] ?? '#cccccc';
          const fillColor = `${baseColor}99`;

          const polygons = f.geometry.type === 'Polygon'
            ? [f.geometry.coordinates]
            : f.geometry.coordinates;

          polygons.forEach((poly) => {
            poly.forEach((ring) => {
              const lon = ring.map((c) => c[0]);
              const lat = ring.map((c) => c[1]);

              traces.push({
                type: 'scattermapbox',
                mode: 'lines',
                fill: 'toself',
                lon,
                lat,
                fillcolor: fillColor,
                line: { color: 'black', width: 1 },
                hovertemplate: `Density: ${density}<br>Area: ${f.properties.st_areashape}<extra></extra>`,
              });
            });
          });
        });
      }

      /* ---------------------------
         2. CRITICAL HABITAT LAYER
      ---------------------------- */
      if (showCriticalHabitat) {
        const islandColors: Record<string, string> = {
          Hawaii: '#1f78b4',
          Oahu: '#33a02c',
          Maui: '#e31a1c',
          Kauai: '#ff7f00',
          Molokai: '#6a3d9a',
          Lanai: '#b15928',
        };

        habitat.features.forEach((f) => {
          const { island } = f.properties;
          const baseColor = islandColors[island] ?? '#a6cee3';
          const fillColor = `${baseColor}99`;

          const polygons = f.geometry.type === 'Polygon'
            ? [f.geometry.coordinates]
            : f.geometry.coordinates;

          polygons.forEach((poly) => {
            poly.forEach((ring) => {
              const lon = ring.map((c) => c[0]);
              const lat = ring.map((c) => c[1]);

              traces.push({
                type: 'scattermapbox',
                mode: 'lines',
                fill: 'toself',
                lon,
                lat,
                fillcolor: fillColor,
                line: { color: 'black', width: 1 },
                hovertemplate: `Island: ${island}<br>Acres: ${f.properties.acres}<extra></extra>`,
              });
            });
          });
        });
      }

      /* ---------------------------
         3. COMPUTE MAP CENTER
      ---------------------------- */

      // eslint-disable-next-line max-len
      const collectCoords = (geo: GeoJSONFeatureCollection<any>): Coordinate[] => geo.features.flatMap((f) => (f.geometry.type === 'Polygon'
        ? f.geometry.coordinates.flat()
        : f.geometry.coordinates.flat(2)));

      const allCoords: Coordinate[] = [
        ...collectCoords(plants),
        ...collectCoords(habitat),
      ];

      const centerLon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
      const centerLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;

      /* ---------------------------
         4. PLOT LAYOUT
      ---------------------------- */

      const layout = {
        mapbox: {
          style: 'carto-positron',
          center: { lat: centerLat, lon: centerLon },
          zoom: 6.5,
        },
        hovermode: 'closest',
        margin: { r: 0, t: 0, b: 0, l: 0 },
        height: 700,
      };

      Plotly.newPlot(divRef.current, traces, layout);
    }

    loadMap();
  }, [showPlants, showCriticalHabitat]);

  return <div ref={divRef} style={{ width: '100%', height: '700px' }} />;
}

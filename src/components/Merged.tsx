'use client';

import React, { useEffect, useRef, useState } from 'react';
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

export default function CombinedMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  const [showPlants, setShowPlants] = useState(false);
  const [showHabitat, setShowHabitat] = useState(false);
  const [showEnvironmentalData, setShowEnvironmentalData] = useState(false);

  const [plantsGeojson, setPlantsGeojson] = useState<FeatureCollection<FeatureProperties> | null>(null);
  const [habitatGeojson, setHabitatGeojson] = useState<FeatureCollection<FeatureProperties> | null>(null);

  // --- Fetch GeoJSON datasets ---
  useEffect(() => {
    async function fetchData() {
      try {
        const [plantsResp, habitatResp] = await Promise.all([
          fetch('/datasets/Threatened-Endangered_Plants.geojson'),
          fetch('/datasets/Areas_of_Critical_Habitat_(Consolidated).geojson'),
        ]);

        if (!plantsResp.ok || !habitatResp.ok) return;

        const plants = (await plantsResp.json()) as FeatureCollection<FeatureProperties>;
        const habitat = (await habitatResp.json()) as FeatureCollection<FeatureProperties>;

        const plantColors: Record<string, string> = { O: '#d9d9d9', L: '#a6cee3', M: '#1f78b4', H: '#b2df8a', VH: '#33a02c', OLO: '#fb9a99' };
        plants.features.forEach(f => {
          const props = f.properties as FeatureProperties & { fillColor?: string; hoverText?: string };
          const density = props.density ?? 'O';
          props.fillColor = plantColors[density] ?? '#cccccc';
          props.hoverText = `Density: ${density}\nArea: ${props.st_areashape?.toLocaleString() ?? 'N/A'}\nPerimeter: ${props.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        const habitatColors: Record<string, string> = { Hawaii: '#1f78b4', Oahu: '#33a02c', Maui: '#e31a1c', Kauai: '#ff7f00', Molokai: '#6a3d9a', Lanai: '#b15928' };
        habitat.features.forEach(f => {
          const props = f.properties as FeatureProperties & { fillColor?: string; hoverText?: string };
          const isl = props.island ?? '';
          props.fillColor = habitatColors[isl] ?? '#a6cee3';
          props.hoverText = `Island: ${isl}\nCritical Habitat: ${props.critical_h}\nAcres: ${props.acres?.toLocaleString() ?? 'N/A'}\nArea: ${props.st_areashape?.toLocaleString() ?? 'N/A'}\nPerimeter: ${props.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        setPlantsGeojson(plants);
        setHabitatGeojson(habitat);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  // --- Render Plotly whenever layer visibility or data changes ---
  useEffect(() => {
    if (!divRef.current) return;

    const layers: any[] = [];

    const allFeatures: Feature<FeatureProperties>[] = [
      ...(showPlants && plantsGeojson ? plantsGeojson.features : []),
      ...(showHabitat && habitatGeojson ? habitatGeojson.features : []),
    ];

    if (allFeatures.length > 0) {
      const fillLayers = allFeatures.map(f => ({
        sourcetype: 'geojson' as const,
        source: { type: 'FeatureCollection', features: [f] },
        type: 'fill' as const,
        color: f.properties.fillColor as string,
        opacity: 0.55,
        below: 'water',
      }));

      const outlineLayer = {
        sourcetype: 'geojson' as const,
        source: { type: 'FeatureCollection', features: allFeatures },
        type: 'line' as const,
        color: 'black',
        line: { width: 1 },
      };

      layers.push(...fillLayers, outlineLayer);
    }

    // --- Compute center, default to Hawaii if no features ---
    let centerLat = 20.7;
    let centerLon = -156.0;

    if (allFeatures.length > 0) {
      const allCoords = allFeatures.flatMap(f => f.geometry.type === 'Polygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates.flat(2));
      centerLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
      centerLon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
    }

    const scatterPoints = {
      type: 'scattermapbox' as const,
      lat: allFeatures.map(f => {
        const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
        return coords.reduce((s, c) => s + c[1], 0) / coords.length;
      }),
      lon: allFeatures.map(f => {
        const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
        return coords.reduce((s, c) => s + c[0], 0) / coords.length;
      }),
      mode: 'markers' as const,
      marker: { size: 1, color: 'rgba(0,0,0,0)' },
      text: allFeatures.map(f => f.properties.hoverText),
      hovertemplate: '%{text}<extra></extra>',
    };

    const layout: Partial<Plotly.Layout> = {
      autosize: true,
      mapbox: {
        style: 'open-street-map',
        center: { lat: centerLat, lon: centerLon },
        zoom: 7.5,
        layers,
      },
      hovermode: 'closest',
      margin: { t: 0, l: 0, r: 0, b: 0 },
    };

    try { (Plotly as any).purge(divRef.current); } catch {}
    Plotly.newPlot(divRef.current, [scatterPoints] as any, layout, { displayModeBar: true });

  }, [showPlants, showHabitat, plantsGeojson, habitatGeojson]);

  return (
    <>
      {/* --- Collapsible Toggle Bar --- */}
      <div style={{
        position: 'fixed',
        top: 100,
        right: 20,
        background: 'white',
        padding: '1rem',
        borderRadius: 8,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
      }}>
        <div style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowEnvironmentalData(!showEnvironmentalData)}>
          Environmental Data {showEnvironmentalData ? '▼' : '▶'}
        </div>
        {showEnvironmentalData && (
          <div style={{ marginTop: 8, paddingLeft: 12 }}>
            <div>
              <label>
                <input type="checkbox" checked={showPlants} onChange={e => setShowPlants(e.target.checked)} /> Plant Layer
              </label>
            </div>
            <div>
              <label>
                <input type="checkbox" checked={showHabitat} onChange={e => setShowHabitat(e.target.checked)} /> Habitat Layer
              </label>
            </div>
          </div>
        )}
      </div>

      {/* --- Map --- */}
      <div ref={divRef} style={{ width: '100vw', height: '100vh' }} />
    </>
  );
}

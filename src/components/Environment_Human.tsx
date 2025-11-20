'use client';

import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

// ---------- Types ----------
type Coordinate = [number, number];

type Polygon = { type: 'Polygon'; coordinates: Coordinate[][] };
type MultiPolygon = { type: 'MultiPolygon'; coordinates: Coordinate[][][] };

type LineString = { type: 'LineString'; coordinates: Coordinate[] };
type MultiLineString = { type: 'MultiLineString'; coordinates: Coordinate[][] };

type Point = { type: 'Point'; coordinates: Coordinate };

type GenericProps = { [k: string]: any };

type Feature<G, P> = {
  type: 'Feature';
  geometry: G;
  properties: P;
};

type FeatureCollection<F> = {
  type: 'FeatureCollection';
  features: F[];
};

type PlantFeature = Feature<Polygon | MultiPolygon, GenericProps>;
type HabitatFeature = Feature<Polygon | MultiPolygon, GenericProps>;
type UrbanFeature = Feature<Polygon | MultiPolygon, GenericProps>;
type RoadFeature = Feature<LineString | MultiLineString, GenericProps>;
type HotelFeature = Feature<Point, GenericProps>;

// ---------- Component ----------
export default function CombinedEverythingMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  // Layer visibility: all OFF by default
  const [showPlants, setShowPlants] = useState(false);
  const [showHabitat, setShowHabitat] = useState(false);
  const [showUrban, setShowUrban] = useState(false);
  const [showRoads, setShowRoads] = useState(false);
  const [showHotels, setShowHotels] = useState(false);

  // Collapsible groups
  const [showEnvironmentalGroup, setShowEnvironmentalGroup] = useState(false);
  const [showHumanGroup, setShowHumanGroup] = useState(false);

  // Data states
  const [plantsGeojson, setPlantsGeojson] = useState<FeatureCollection<PlantFeature> | null>(null);
  const [habitatGeojson, setHabitatGeojson] = useState<FeatureCollection<HabitatFeature> | null>(null);
  const [urbanGeojson, setUrbanGeojson] = useState<FeatureCollection<UrbanFeature> | null>(null);
  const [roadsGeojson, setRoadsGeojson] = useState<FeatureCollection<RoadFeature> | null>(null);
  const [hotelsGeojson, setHotelsGeojson] = useState<FeatureCollection<HotelFeature> | null>(null);

  // Ensure we don't attempt to update after unmount
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [
          plantsResp,
          habitatResp,
          urbanResp,
          roadsResp,
          hotelsResp,
        ] = await Promise.all([
          fetch('/datasets/Threatened-Endangered_Plants.geojson'),
          fetch('/datasets/Areas_of_Critical_Habitat_(Consolidated).geojson'),
          fetch('/datasets/2020_Urban_Areas.geojson'),
          fetch('/datasets/roads_simplified.json'), // you requested this one
          fetch('/datasets/Hotels.geojson'),
        ]);

        if (cancelled) return;

        if (!plantsResp.ok || !habitatResp.ok || !urbanResp.ok || !roadsResp.ok || !hotelsResp.ok) {
          console.error('One or more dataset fetches failed');
          return;
        }

        const [plants, habitat, urban, roads, hotels] = await Promise.all([
          plantsResp.json(),
          habitatResp.json(),
          urbanResp.json(),
          roadsResp.json(),
          hotelsResp.json(),
        ]);

        if (cancelled) return;

        // Attach visualization extras: fillColor + hoverText where needed

        // Plants
        const plantColors: Record<string, string> = {
          O: '#d9d9d9',
          L: '#a6cee3',
          M: '#1f78b4',
          H: '#b2df8a',
          VH: '#33a02c',
          OLO: '#fb9a99',
        };
        (plants as FeatureCollection<PlantFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          const density = p.density ?? 'O';
          p.fillColor = plantColors[density] ?? '#cccccc';
          p.hoverText = `Density: ${density}\nArea: ${p.st_areashape?.toLocaleString() ?? 'N/A'}\nPerimeter: ${p.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        // Habitat
        const habitatColors: Record<string, string> = {
          Hawaii: '#1f78b4',
          Oahu: '#33a02c',
          Maui: '#e31a1c',
          Kauai: '#ff7f00',
          Molokai: '#6a3d9a',
          Lanai: '#b15928',
        };
        (habitat as FeatureCollection<HabitatFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          const isl = p.island ?? '';
          p.fillColor = habitatColors[isl] ?? '#a6cee3';
          p.hoverText = `Island: ${isl}\nCritical Habitat: ${p.critical_h ?? 'N/A'}\nAcres: ${p.acres?.toLocaleString() ?? 'N/A'}\nArea: ${p.st_areashape?.toLocaleString() ?? 'N/A'}\nPerimeter: ${p.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        // Urban: palette by GEOID
        const urbanPalette = [
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
        (urban as FeatureCollection<UrbanFeature>).features.forEach(f => {
          const id = f.properties.GEOID20 ?? f.properties.geoid20 ?? `gid-${paletteIndex}`;
          if (!geoidToColor[id]) {
            geoidToColor[id] = urbanPalette[paletteIndex % urbanPalette.length];
            paletteIndex += 1;
          }
        });

        // Add hover text + fillColor for urban
        (urban as FeatureCollection<UrbanFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { hoverText?: string; fillColor?: string };
          const name = p.NAMELSAD20 ?? p.namelsad20 ?? p.NAME20 ?? p.name20 ?? 'Urban Area';
          const geoid = p.GEOID20 ?? p.geoid20 ?? 'N/A';
          const pop = p.POP ?? p.pop;
          const dens = p.POPDEN ?? p.popden;
          p.hoverText =
            `Urban Area: ${name}` +
            `<br>GEOID20: ${geoid}` +
            (pop != null ? `<br>Population: ${Number(pop).toLocaleString()}` : '') +
            (dens != null ? `<br>Density: ${dens} people/sq mi` : '');
          const id = p.GEOID20 ?? p.geoid20 ?? `gid-${paletteIndex}`;
          p.fillColor = geoidToColor[id] ?? urbanPalette[0];
        });

        // Hotels: add hover text
        (hotels as FeatureCollection<HotelFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { hoverText?: string };
          const name = p.hotel_name ?? p.name ?? p.NAME ?? 'Hotel';
          p.hoverText = `Hotel: ${name}`;
        });

        // Save states
        setPlantsGeojson(plants as FeatureCollection<PlantFeature>);
        setHabitatGeojson(habitat as FeatureCollection<HabitatFeature>);
        setUrbanGeojson(urban as FeatureCollection<UrbanFeature>);
        setRoadsGeojson(roads as FeatureCollection<RoadFeature>);
        setHotelsGeojson(hotels as FeatureCollection<HotelFeature>);
      } catch (err) {
        console.error('Error fetching datasets', err);
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  // Render/update Plotly when toggles or data change
  useEffect(() => {
    if (!divRef.current) return;

    // Build combined features depending on toggles (used for center & combined outline)
    const selectedFeatures: (PlantFeature | HabitatFeature | UrbanFeature | RoadFeature | HotelFeature)[] = [];

    if (showPlants && plantsGeojson) selectedFeatures.push(...plantsGeojson.features);
    if (showHabitat && habitatGeojson) selectedFeatures.push(...habitatGeojson.features);
    if (showUrban && urbanGeojson) selectedFeatures.push(...urbanGeojson.features);
    if (showRoads && roadsGeojson) selectedFeatures.push(...roadsGeojson.features as any);
    // hotels are point features - include them for centering if toggled
    if (showHotels && hotelsGeojson) selectedFeatures.push(...hotelsGeojson.features as any);

    // Compute map center: default to Hawaii if nothing selected
    let centerLat = 20.7;
    let centerLon = -156.0;

    // Gather coordinates for centering
    const allCoords: Coordinate[] = selectedFeatures.flatMap(f => {
      const g = (f as any).geometry;
      if (!g) return [];
      if (g.type === 'Polygon') return (g.coordinates as Coordinate[][]).flat();
      if (g.type === 'MultiPolygon') return (g.coordinates as Coordinate[][][]).flat(2);
      if (g.type === 'LineString') return (g.coordinates as Coordinate[]).slice();
      if (g.type === 'MultiLineString') return (g.coordinates as Coordinate[][]).flat();
      if (g.type === 'Point') return [(g.coordinates as Coordinate)];
      return [];
    });

    if (allCoords.length > 0) {
      centerLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
      centerLon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
    }

    // Build Mapbox layers array
    const mapboxLayers: any[] = [];

    // Plant fills
    if (showPlants && plantsGeojson) {
      mapboxLayers.push(
        ...plantsGeojson.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          type: 'fill' as const,
          color: (f.properties as any).fillColor as string,
          opacity: 0.55,
          below: 'water',
        }))
      );
    }

    // Habitat fills
    if (showHabitat && habitatGeojson) {
      mapboxLayers.push(
        ...habitatGeojson.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          type: 'fill' as const,
          color: (f.properties as any).fillColor as string,
          opacity: 0.55,
          below: 'water',
        }))
      );
    }

    // Urban fills
    if (showUrban && urbanGeojson) {
      mapboxLayers.push(
        ...urbanGeojson.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          type: 'fill' as const,
          color: (f.properties as any).fillColor as string,
          opacity: 0.45,
          below: 'water',
        }))
      );
    }

    // Roads layer (from roads_simplified.json)
    if (showRoads && roadsGeojson) {
      mapboxLayers.push({
        sourcetype: 'geojson' as const,
        source: roadsGeojson,
        type: 'line' as const,
        color: '#000000',
        line: { width: 1 },
      });
    }

    // Outline for selected polygonal datasets (plants/habitat/urban)
    const combinedOutlineFeatures: any[] = [];
    if (showPlants && plantsGeojson) combinedOutlineFeatures.push(...plantsGeojson.features);
    if (showHabitat && habitatGeojson) combinedOutlineFeatures.push(...habitatGeojson.features);
    if (showUrban && urbanGeojson) combinedOutlineFeatures.push(...urbanGeojson.features);

    if (combinedOutlineFeatures.length > 0) {
      mapboxLayers.push({
        sourcetype: 'geojson' as const,
        source: { type: 'FeatureCollection', features: combinedOutlineFeatures },
        type: 'line' as const,
        color: 'black',
        line: { width: 1 },
      });
    }

    // Build Plotly traces array (scatter traces for hovers & hotels)
    const traces: any[] = [];

    // Invisible dummy trace to force Mapbox redraw in some Plotly builds (keeps base map visible)
    // We'll always include a tiny no-op trace (empty) so Plotly.react updates mapbox layers reliably.
    const dummyTrace = { type: 'scattermapbox' as const, lat: [], lon: [], mode: 'markers', marker: { size: 1, color: 'rgba(0,0,0,0)' } };
    traces.push(dummyTrace);

    // Urban hover scatter (invisible markers, allow hover on urban)
    if (showUrban && urbanGeojson) {
      const centroidLat: number[] = [];
      const centroidLon: number[] = [];
      const urbanHoverText: string[] = [];

      urbanGeojson.features.forEach((f) => {
        const ring = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
        const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
        const lon = ring.reduce((s, c) => s + c[0], 0) / ring.length;
        centroidLat.push(lat);
        centroidLon.push(lon);
        urbanHoverText.push((f.properties as any).hoverText);
      });

      traces.push({
        type: 'scattermapbox' as const,
        lat: centroidLat,
        lon: centroidLon,
        mode: 'markers',
        marker: { size: 18, color: 'rgba(0,0,0,0)' },
        text: urbanHoverText,
        hovertemplate: '%{text}<extra></extra>',
        name: 'Urban Areas',
      });
    }

    // Hotels
    if (showHotels && hotelsGeojson) {
      const hotelLat: number[] = [];
      const hotelLon: number[] = [];
      const hotelHoverText: string[] = [];

      hotelsGeojson.features.forEach(f => {
        const [lon, lat] = f.geometry.coordinates;
        hotelLat.push(lat);
        hotelLon.push(lon);
        hotelHoverText.push((f.properties as any).hoverText);
      });

      traces.push({
        type: 'scattermapbox' as const,
        lat: hotelLat,
        lon: hotelLon,
        mode: 'markers',
        marker: { size: 8, color: 'red', symbol: 'circle' },
        text: hotelHoverText,
        hovertemplate: '%{text}<extra></extra>',
        name: 'Hotels',
      });
    }

    // Plants / Habitat do not need separate scatter traces for hover because we use mapbox layers +
    // an invisible scatter for centroid hover if you prefer. We'll stick to hover via a small invisible scatter
    // derived from centroids when those layers are active:
    if ((showPlants && plantsGeojson) || (showHabitat && habitatGeojson)) {
      const centLat: number[] = [];
      const centLon: number[] = [];
      const centText: string[] = [];

      if (showPlants && plantsGeojson) {
        plantsGeojson.features.forEach(f => {
          const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
          centLat.push(coords.reduce((s, c) => s + c[1], 0) / coords.length);
          centLon.push(coords.reduce((s, c) => s + c[0], 0) / coords.length);
          centText.push((f.properties as any).hoverText);
        });
      }

      if (showHabitat && habitatGeojson) {
        habitatGeojson.features.forEach(f => {
          const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
          centLat.push(coords.reduce((s, c) => s + c[1], 0) / coords.length);
          centLon.push(coords.reduce((s, c) => s + c[0], 0) / coords.length);
          centText.push((f.properties as any).hoverText);
        });
      }

      traces.push({
        type: 'scattermapbox' as const,
        lat: centLat,
        lon: centLon,
        mode: 'markers',
        marker: { size: 1, color: 'rgba(0,0,0,0)' },
        text: centText,
        hovertemplate: '%{text}<extra></extra>',
      });
    }

    // Layout: ensure mapbox.layers is explicitly set to the computed layers (possibly empty)
    const layout: Partial<Plotly.Layout> = {
      autosize: true,
      mapbox: {
        style: 'open-street-map',
        center: { lat: centerLat, lon: centerLon },
        zoom: 8.5,
        layers: mapboxLayers,
      },
      hovermode: 'closest',
      margin: { t: 0, l: 0, r: 0, b: 0 },
      showlegend: true,
    };

    // Use Plotly.react to update traces + layout cleanly (avoids leftover layers)
    try {
      if ((Plotly as any).react) {
        (Plotly as any).react(divRef.current, traces, layout, { displayModeBar: true, responsive: true });
      } else {
        // Fallback to newPlot if react is unavailable
        try { (Plotly as any).purge(divRef.current); } catch {}
        Plotly.newPlot(divRef.current, traces, layout, { displayModeBar: true, responsive: true });
      }
    } catch (err) {
      console.error('Plotly render error', err);
    }

  }, [
    showPlants,
    showHabitat,
    showUrban,
    showRoads,
    showHotels,
    plantsGeojson,
    habitatGeojson,
    urbanGeojson,
    roadsGeojson,
    hotelsGeojson,
  ]);

  // ---------- UI + Map ----------
  return (
    <>
      {/* Controls */}
      <div
        style={{
          position: 'fixed',
          top: 100,
          right: 20,
          width: 220,
          background: 'rgba(255,255,255,0.95)',
          padding: '0.75rem',
          borderRadius: 8,
          zIndex: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          fontSize: 14,
        }}
      >
        {/* Environmental Data */}
        <div style={{ marginBottom: 8 }}>
          <div
            onClick={() => setShowEnvironmentalGroup(!showEnvironmentalGroup)}
            style={{ cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Environmental Data</span>
            <span>{showEnvironmentalGroup ? '▾' : '▸'}</span>
          </div>

          {showEnvironmentalGroup && (
            <div style={{ marginTop: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={showPlants} onChange={e => setShowPlants(e.target.checked)} />
                <span>Plant Layer</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showHabitat} onChange={e => setShowHabitat(e.target.checked)} />
                <span>Habitat Layer</span>
              </label>
            </div>
          )}
        </div>

        {/* Human Interaction */}
        <div>
          <div
            onClick={() => setShowHumanGroup(!showHumanGroup)}
            style={{ cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Human Interaction</span>
            <span>{showHumanGroup ? '▾' : '▸'}</span>
          </div>

          {showHumanGroup && (
            <div style={{ marginTop: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={showUrban} onChange={e => setShowUrban(e.target.checked)} />
                <span>Urban Areas</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showRoads} onChange={e => setShowRoads(e.target.checked)} />
                <span>Roads</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showHotels} onChange={e => setShowHotels(e.target.checked)} />
                <span>Hotels</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Map container (full viewport) */}
      <div
        ref={divRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          zIndex: 0,
        }}
      />
    </>
  );
}

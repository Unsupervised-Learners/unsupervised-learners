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
type LULCFeature = Feature<Polygon | MultiPolygon, GenericProps>;
type StateParksFeature = Feature<Polygon | MultiPolygon, GenericProps>;

// ---------- Component ----------
export default function CombinedEverythingMap() {
  const divRef = useRef<HTMLDivElement | null>(null);

  // Layer visibility: all OFF by default
  const [showPlants, setShowPlants] = useState(false);
  const [showHabitat, setShowHabitat] = useState(false);
  const [showUrban, setShowUrban] = useState(false);
  const [showRoads, setShowRoads] = useState(false);
  const [showHotels, setShowHotels] = useState(false);
  const [showLULC, setShowLULC] = useState(false);
  const [showStateParks, setShowStateParks] = useState(false);

  // Collapsible groups
  const [showEnvironmentalGroup, setShowEnvironmentalGroup] = useState(false);
  const [showHumanGroup, setShowHumanGroup] = useState(false);

  // Data states
  const [plantsGeojson, setPlantsGeojson] = useState<FeatureCollection<PlantFeature> | null>(null);
  const [habitatGeojson, setHabitatGeojson] = useState<FeatureCollection<HabitatFeature> | null>(null);
  const [urbanGeojson, setUrbanGeojson] = useState<FeatureCollection<UrbanFeature> | null>(null);
  const [roadsGeojson, setRoadsGeojson] = useState<FeatureCollection<RoadFeature> | null>(null);
  const [hotelsGeojson, setHotelsGeojson] = useState<FeatureCollection<HotelFeature> | null>(null);
  const [LULCGeojson, setLULCGeojson] = useState<FeatureCollection<LULCFeature> | null>(null);
  const[stateParksGeojson, setStateParksGeojson] = useState<FeatureCollection<StateParksFeature> | null>(null);

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
          LULCResp,
          stateParksResp,
        ] = await Promise.all([
          fetch('/datasets/Threatened-Endangered_Plants.geojson'),
          fetch('/datasets/Areas_of_Critical_Habitat_(Consolidated).geojson'),
          fetch('/datasets/2020_Urban_Areas.geojson'),
          fetch('/datasets/roads_simplified.json'), // you requested this one
          fetch('/datasets/Hotels.geojson'),
          fetch('/datasets/Land_Use_Land_Cover_(LULC).geojson'),
          fetch('/datasets/State_Parks.geojson')
        ]);

        if (cancelled) return;

        if (!plantsResp.ok || !habitatResp.ok || !urbanResp.ok || !roadsResp.ok || !hotelsResp.ok || !LULCResp.ok || !stateParksResp.ok) {
          console.error('One or more dataset fetches failed');
          return;
        }

        const [plants, habitat, urban, roads, hotels, LULC, stateParks] = await Promise.all([
          plantsResp.json(),
          habitatResp.json(),
          urbanResp.json(),
          roadsResp.json(),
          hotelsResp.json(),
          LULCResp.json(),
          stateParksResp.json(),
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

        // LULC: add labels and colors
        const lulcLabels: Record<string, string> = {
          '11': 'Residential',
          '12': 'Commercial and Services',
          '13': 'Industrial',
          '14': 'Transportation, Communications and Utilities',
          '15': 'Industrial and Commercial Complexes',
          '16': 'Mixed Urban or Built-up Land',
          '17': 'Other Urban or Built-up Land',
          '21': 'Cropland and Pasture',
          '22': 'Orchards, Groves, Vineyards, Nurseries',
          '23': 'Confined Feeding Operations',
          '24': 'Other Agricultural Land',
          '31': 'Herbaceous Rangeland',
          '32': 'Shrub and Brush Rangeland',
          '33': 'Mixed Rangeland',
          '41': 'Deciduous Forest Land',
          '42': 'Evergreen Forest Land',
          '43': 'Mixed Forest Land',
          '51': 'Streams and Canals',
          '52': 'Lakes',
          '53': 'Reservoirs',
          '54': 'Bays and Estuaries',
          '61': 'Forested Wetland',
          '62': 'Nonforested Wetland',
          '71': 'Dry Salt Flats',
          '72': 'Beaches',
          '73': 'Sandy Areas Other than Beaches',
          '74': 'Bare Exposed Rock',
          '75': 'Strip Mines, Quarries, and Gravel Pits',
          '76': 'Transitional Areas',
          '77': 'Mixed Barren Land',
          '81': 'Shrub and Brush Tundra',
          '82': 'Herbaceous Tundra',
          '83': 'Bare Ground',
          '84': 'Wet Tundra',
          '85': 'Mixed Tundra',
          '91': 'Perennial Snowfields or Ice',
          '92': 'Glaciers'
        };

        const lulcColors: Record<string, string> = {
          // Urban or Built-up land (reds/pinks/purples)
          '11': '#e31a1c',
          '12': '#fb9a99',
          '13': '#984ea3',
          '14': '#a6cee3',
          '15': '#b15928',
          '16': '#cab2d6',
          '17': '#ffff99',
          
          // Agricultural Land (oranges/yellows/greens)
          '21': '#fdbf6f',
          '22': '#ff7f00',
          '23': '#b2df8a',
          '24': '#33a02c',
          
          // Rangeland (light yellows/beiges)
          '31': '#ffffb3',
          '32': '#bebada',
          '33': '#fccde5',
          
          // Forest Land (dark greens)
          '41': '#238b45',
          '42': '#006d2c',
          '43': '#74c476',
          
          // Water (blues)
          '51': '#08519c',
          '52': '#3182bd',
          '53': '#6baed6',
          '54': '#9ecae1',
          
          // Wetland (teals)
          '61': '#2ca25f',
          '62': '#99d8c9',
          
          // Barren Land (grays/browns)
          '71': '#f0f0f0',
          '72': '#fdd0a2',
          '73': '#bdbdbd',
          '74': '#969696',
          '75': '#737373',
          '76': '#525252',
          '77': '#252525',
          
          // Tundra (purples)
          '81': '#efedf5',
          '82': '#dadaeb',
          '83': '#bcbddc',
          '84': '#9e9ac8',
          '85': '#807dba',
          
          // Perennial Snow (whites)
          '91': '#ffffff',
          '92': '#f7fbff'
        };

        (LULC as FeatureCollection<LULCFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          const landcover = String(p.landcover ?? '');
          p.fillColor = lulcColors[landcover] ?? '#cccccc';
          const label = lulcLabels[landcover] ?? 'Unknown';
          p.hoverText = `Land Cover Code: ${landcover}<br>${label}<br>Area: ${p.st_areashape?.toLocaleString() ?? 'N/A'} sq units`;
        });

        // State Parks: add hover text and color
        (stateParks as FeatureCollection<StateParksFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          p.fillColor = '#33a02c'; // Green color for parks
          p.hoverText = `Park: ${p.name ?? 'N/A'}<br>Type: ${p.type_defin ?? 'N/A'}<br>Island: ${p.island ?? 'N/A'}<br>Acres: ${p.gis_acre?.toLocaleString() ?? 'N/A'}`;
        });

        // Save states
        setPlantsGeojson(plants as FeatureCollection<PlantFeature>);
        setHabitatGeojson(habitat as FeatureCollection<HabitatFeature>);
        setUrbanGeojson(urban as FeatureCollection<UrbanFeature>);
        setRoadsGeojson(roads as FeatureCollection<RoadFeature>);
        setHotelsGeojson(hotels as FeatureCollection<HotelFeature>);
        setLULCGeojson(LULC as FeatureCollection<LULCFeature>);
        setStateParksGeojson(stateParks as FeatureCollection<StateParksFeature>);
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
    if (showLULC && LULCGeojson) selectedFeatures.push(...LULCGeojson.features);
    if (showStateParks && stateParksGeojson) selectedFeatures.push(...stateParksGeojson.features);

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

    // LULC fills
    if (showLULC && LULCGeojson) {
      mapboxLayers.push(
        ...LULCGeojson.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          type: 'fill' as const,
          color: (f.properties as any).fillColor as string,
          opacity: 0.5,
          below: 'water',
        }))
      );
    }

    // State Parks fills
    if (showStateParks && stateParksGeojson) {
      mapboxLayers.push(
        ...stateParksGeojson.features.map(f => ({
          sourcetype: 'geojson' as const,
          source: { type: 'FeatureCollection', features: [f] },
          type: 'fill' as const,
          color: (f.properties as any).fillColor as string,
          opacity: 0.6,
          below: 'water',
        }))
      );
    }

    // Outline for selected polygonal datasets (plants/habitat/urban)
    const combinedOutlineFeatures: any[] = [];
    if (showPlants && plantsGeojson) combinedOutlineFeatures.push(...plantsGeojson.features);
    if (showHabitat && habitatGeojson) combinedOutlineFeatures.push(...habitatGeojson.features);
    if (showUrban && urbanGeojson) combinedOutlineFeatures.push(...urbanGeojson.features);
    if (showLULC && LULCGeojson) combinedOutlineFeatures.push(...LULCGeojson.features);
    if (showStateParks && stateParksGeojson) combinedOutlineFeatures.push(...stateParksGeojson.features);

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

    // LULC and State Parks hover
    if ((showLULC && LULCGeojson) || (showStateParks && stateParksGeojson)) {
      const centLat: number[] = [];
      const centLon: number[] = [];
      const centText: string[] = [];

      if (showLULC && LULCGeojson) {
        LULCGeojson.features.forEach(f => {
          const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
          centLat.push(coords.reduce((s, c) => s + c[1], 0) / coords.length);
          centLon.push(coords.reduce((s, c) => s + c[0], 0) / coords.length);
          centText.push((f.properties as any).hoverText);
        });
      }

      if (showStateParks && stateParksGeojson) {
        stateParksGeojson.features.forEach(f => {
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
        style: 'carto-positron',
        center: { lat: centerLat, lon: centerLon },
        zoom: 8.5,
        layers: mapboxLayers,
      },
      hovermode: 'closest',
      margin: { t: 0, l: 0, r: 0, b: 0 },
      showlegend: false
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
    showLULC,
    showStateParks,
    plantsGeojson,
    habitatGeojson,
    urbanGeojson,
    roadsGeojson,
    hotelsGeojson,
    LULCGeojson,
    stateParksGeojson,
  ]);

  // Zoom to specific islands
  const zoomToIsland = (island: string) => {
    const centers: Record<string, { lat: number; lon: number; zoom: number }> = {
      'Oahu': { lat: 21.4389, lon: -158.0001, zoom: 9.5 },
      'Maui': { lat: 20.7984, lon: -156.3319, zoom: 9.5 },
      'Hawaii': { lat: 19.5429, lon: -155.6659, zoom: 8.5 },
      'Kauai': { lat: 22.0964, lon: -159.5261, zoom: 9.5 },
      'Molokai': { lat: 21.1444, lon: -157.0226, zoom: 10 },
      'Lanai': { lat: 20.8283, lon: -156.9197, zoom: 10.5 },
      'Kahoolawe': { lat: 20.5497, lon: -156.6034, zoom: 11 },
      'Niihau': { lat: 21.9024, lon: -160.1669, zoom: 10.5 },
      'All': { lat: 20.7, lon: -157.0, zoom: 7 },
    };
  
    const center = centers[island];
    if (center && divRef.current) {
      Plotly.relayout(divRef.current, {
        'mapbox.center.lat': center.lat,
        'mapbox.center.lon': center.lon,
        'mapbox.zoom': center.zoom,
      });
    }
  };

  // LULC custom color legend
  const LULCLegend = () => {
    if (!showLULC) return null;
  
    const legendGroups = [
      {
        category: 'Urban or Built-up Land',
        items: [
          { code: '11', label: 'Residential', color: '#e31a1c' },
          { code: '12', label: 'Commercial & Services', color: '#fb9a99' },
          { code: '13', label: 'Industrial', color: '#984ea3' },
          { code: '14', label: 'Transportation & Utilities', color: '#a6cee3' },
          { code: '15', label: 'Industrial & Commercial Complexes', color: '#b15928' },
          { code: '16', label: 'Mixed Urban or Built-up', color: '#cab2d6' },
          { code: '17', label: 'Other Urban or Built-up', color: '#ffff99' },
        ]
      },
      {
        category: 'Agricultural Land',
        items: [
          { code: '21', label: 'Cropland & Pasture', color: '#fdbf6f' },
          { code: '22', label: 'Orchards & Vineyards', color: '#ff7f00' },
          { code: '23', label: 'Confined Feeding Operations', color: '#b2df8a' },
          { code: '24', label: 'Other Agricultural', color: '#33a02c' },
        ]
      },
      {
        category: 'Rangeland',
        items: [
          { code: '31', label: 'Herbaceous Rangeland', color: '#ffffb3' },
          { code: '32', label: 'Shrub & Brush Rangeland', color: '#bebada' },
          { code: '33', label: 'Mixed Rangeland', color: '#fccde5' },
        ]
      },
      {
        category: 'Forest Land',
        items: [
          { code: '41', label: 'Deciduous Forest', color: '#238b45' },
          { code: '42', label: 'Evergreen Forest', color: '#006d2c' },
          { code: '43', label: 'Mixed Forest', color: '#74c476' },
        ]
      },
      {
        category: 'Water',
        items: [
          { code: '51', label: 'Streams & Canals', color: '#08519c' },
          { code: '52', label: 'Lakes', color: '#3182bd' },
          { code: '53', label: 'Reservoirs', color: '#6baed6' },
          { code: '54', label: 'Bays & Estuaries', color: '#9ecae1' },
        ]
      },
      {
        category: 'Wetland',
        items: [
          { code: '61', label: 'Forested Wetland', color: '#2ca25f' },
          { code: '62', label: 'Nonforested Wetland', color: '#99d8c9' },
        ]
      },
      {
        category: 'Barren Land',
        items: [
          { code: '71', label: 'Dry Salt Flats', color: '#f0f0f0' },
          { code: '72', label: 'Beaches', color: '#fdd0a2' },
          { code: '73', label: 'Sandy Areas', color: '#bdbdbd' },
          { code: '74', label: 'Bare Exposed Rock', color: '#969696' },
          { code: '75', label: 'Strip Mines & Quarries', color: '#737373' },
          { code: '76', label: 'Transitional Areas', color: '#525252' },
          { code: '77', label: 'Mixed Barren', color: '#252525' },
        ]
      },
      {
        category: 'Tundra',
        items: [
          { code: '81', label: 'Shrub & Brush Tundra', color: '#efedf5' },
          { code: '82', label: 'Herbaceous Tundra', color: '#dadaeb' },
          { code: '83', label: 'Bare Ground', color: '#bcbddc' },
          { code: '84', label: 'Wet Tundra', color: '#9e9ac8' },
          { code: '85', label: 'Mixed Tundra', color: '#807dba' },
        ]
      },
      {
        category: 'Perennial Snow',
        items: [
          { code: '91', label: 'Perennial Snowfields or Ice', color: '#ffffff' },
          { code: '92', label: 'Glaciers', color: '#f7fbff' },
        ]
      },
    ];
  
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          maxWidth: 300,
          maxHeight: '70vh',
          background: 'rgba(255,255,255,0.95)',
          padding: '0.75rem',
          borderRadius: 8,
          zIndex: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          fontSize: 12,
          overflowY: 'auto',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14, borderBottom: '2px solid #333', paddingBottom: 6 }}>
          Land Use/Cover Legend
        </div>
        {legendGroups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4, color: '#555' }}>
              {group.category}
            </div>
            {group.items.map(item => (
              <div
                key={item.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 3,
                  paddingLeft: 8,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 14,
                    backgroundColor: item.color,
                    border: '1px solid #333',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 10 }}>
                  <span style={{ fontWeight: 500 }}>{item.code}</span> - {item.label}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showStateParks} onChange={e => setShowStateParks(e.target.checked)} />
                <span>State Parks</span>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showLULC} onChange={e => setShowLULC(e.target.checked)} />
                <span>Land Use/Cover</span>
              </label>
            </div>
          )}
        </div>

        {/* QUICK ZOOM SECTION */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ddd' }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
            Quick Zoom
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {['Oahu', 'Maui', 'Hawaii', 'Kauai', 'Molokai', 'Lanai', 'Kahoolawe', 'Niihau', 'All'].map(island => (
                <button
                key={island}
                onClick={() => zoomToIsland(island)}
                style={{
                  padding: '6px 8px',
                  fontSize: 11,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  background: '#f8f8f8',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8f8f8'}
              >
                {island}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LULC Legend */}
      <LULCLegend />

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

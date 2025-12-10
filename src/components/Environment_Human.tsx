'use client';

import React, { useEffect, useRef, useState } from 'react';
// import Plotly from 'plotly.js-dist-min';
import dynamic from 'next/dynamic';

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

  const [Plotly, setPlotly] = useState<any>(null);

  // Layer visibility: all OFF by default
  const [showPlants, setShowPlants] = useState(false);
  const [showHabitat, setShowHabitat] = useState(false);
  const [showUrban, setShowUrban] = useState(false);
  const [showRoads, setShowRoads] = useState(false);
  const [showHotels, setShowHotels] = useState(false);
  const [showStateParks, setShowStateParks] = useState(false);
  
  // LULC category toggles
  const [showUrbanBuiltup, setShowUrbanBuiltup] = useState(false);
  const [showAgricultural, setShowAgricultural] = useState(false);
  const [showRangeland, setShowRangeland] = useState(false);
  const [showForest, setShowForest] = useState(false);
  const [showWater, setShowWater] = useState(false);
  const [showWetland, setShowWetland] = useState(false);
  const [showBarren, setShowBarren] = useState(false);

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

  const [initialCenter] = useState({ lat: 20.7, lon: -156.0 });
    useEffect(() => {
    import('plotly.js-dist-min').then((module) => {
      setPlotly(module.default);
    });
  }, []);

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
          fetch('/datasets/roads_simplified.json'),
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
          O: '#cad2c5',
          L: '#84a98c',
          M: '#52796f',
          H: '#354f52',
          VH: '#2f3e46',
          OLO: '#4f7958ff',
        };
        (plants as FeatureCollection<PlantFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          const density = p.density ?? 'O';
          p.fillColor = plantColors[density] ?? '#cccccc';
          p.hoverText =
          `Density: ${density}<br>` +
          `Area: ${p.st_areashape?.toLocaleString() ?? 'N/A'}<br>` +
          `Perimeter: ${p.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        // Habitat
        const habitatColors: Record<string, string> = {
          Hawaii: '#e9c46a',
          Oahu: '#e9c46a',
          Maui: '#e9c46a',
          Kauai: '#e9c46a',
          Molokai: '#e9c46a',
          Lanai: '#e9c46a',
        };
        (habitat as FeatureCollection<HabitatFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          const isl = p.island ?? '';
          p.fillColor = habitatColors[isl] ?? '#e9c46a';
          p.hoverText =
          `Island: ${isl}<br>` +
          `Acres: ${p.acres?.toLocaleString() ?? 'N/A'}<br>` +
          `Area: ${p.st_areashape?.toLocaleString() ?? 'N/A'}<br>` +
          `Perimeter: ${p.st_perimetershape?.toLocaleString() ?? 'N/A'}`;
        });

        // Urban: color by population density
        const urbanDensityColors: Record<string, string> = {
          'Very High': 'rgba(103,0,13,0.65)',      // > 10000
          'High': 'rgba(165,15,21,0.6)',           // 5000-10000
          'Medium-High': 'rgba(203,24,29,0.55)',   // 2500-5000
          'Medium': 'rgba(239,59,44,0.5)',         // 1000-2500
          'Medium-Low': 'rgba(251,106,74,0.45)',   // 500-1000
          'Low': 'rgba(252,146,114,0.4)',          // < 500
          'Unknown': 'rgba(150,150,150,0.4)',      // no data
        };

        const getDensityCategory = (density: number | undefined | null): string => {
          if (density == null) return 'Unknown';
          if (density > 10000) return 'Very High';
          if (density > 5000) return 'High';
          if (density > 2500) return 'Medium-High';
          if (density > 1000) return 'Medium';
          if (density > 500) return 'Medium-Low';
          return 'Low';
        };

        (urban as FeatureCollection<UrbanFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { hoverText?: string; fillColor?: string; densityCategory?: string };
          const name = p.NAMELSAD20 ?? p.namelsad20 ?? p.NAME20 ?? p.name20 ?? 'Urban Area';
          const geoid = p.GEOID20 ?? p.geoid20 ?? 'N/A';
          const pop = p.POP ?? p.pop;
          const dens = p.POPDEN ?? p.popden;
          const densityCategory = getDensityCategory(dens);
          p.densityCategory = densityCategory;
          p.fillColor = urbanDensityColors[densityCategory];
          p.hoverText =
            `Urban Area: ${name}` +
            `<br>GEOID20: ${geoid}` +
            (pop != null ? `<br>Population: ${Number(pop).toLocaleString()}` : '') +
            (dens != null ? `<br>Density: ${Number(dens).toFixed(1)} people/sq mi` : '') +
            `<br>Density Category: ${densityCategory}`;
        });

        // Hotels
        (hotels as FeatureCollection<HotelFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { hoverText?: string };
          const name = p.hotel_name ?? p.name ?? p.NAME ?? 'Hotel';
          p.hoverText = `Hotel: ${name}`;
        });

        // LULC
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
          '77': 'Mixed Barren Land'
        };

        const lulcColors: Record<string, string> = {
          // Urban or Built-up land (reds/pinks)
          '11': '#99000d',
          '12': '#cb181d',
          '13': '#ef3b2c',
          '14': '#ff85a1',
          '15': '#ff5c8a',
          '16': '#ffa69e',
          '17': '#ffccd5',

          // Agricultural Land (oranges)
          '21': '#fdbf6f',
          '22': '#ff7f00',
          '23': '#e36414',
          '24': '#D58936',

          // Rangeland (light yellows)
          '31': '#ffffb3',
          '32': '#fcefb4',
          '33': '#eefc57',

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
          '61': '#49dcb1',
          '62': '#72efdd',

          // Barren Land (grays/browns)
          '71': '#f0f0f0',
          '72': '#fdd0a2',
          '73': '#bdbdbd',
          '74': '#969696',
          '75': '#737373',
          '76': '#525252',
          '77': '#252525'
        };

        (LULC as FeatureCollection<LULCFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          const landcover = String(p.landcover ?? '');
          p.fillColor = lulcColors[landcover] ?? '#cccccc';
          const label = lulcLabels[landcover] ?? 'Unknown';
          p.hoverText = `Land Cover Code: ${landcover}<br>${label}<br>Area: ${p.st_areashape?.toLocaleString() ?? 'N/A'} sq units`;
        });

        // State Parks
        (stateParks as FeatureCollection<StateParksFeature>).features.forEach(f => {
          const p = f.properties as GenericProps & { fillColor?: string; hoverText?: string };
          p.fillColor = '#778da9'; // green color
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

    // Helper function to get category from landcover code
    const getLULCCategory = (code: string): string => {
      const codeNum = parseInt(code);
      if (codeNum >= 11 && codeNum <= 17) return 'urban';
      if (codeNum >= 21 && codeNum <= 24) return 'agricultural';
      if (codeNum >= 31 && codeNum <= 33) return 'rangeland';
      if (codeNum >= 41 && codeNum <= 43) return 'forest';
      if (codeNum >= 51 && codeNum <= 54) return 'water';
      if (codeNum >= 61 && codeNum <= 62) return 'wetland';
      if (codeNum >= 71 && codeNum <= 77) return 'barren';
      return 'unknown';
    };

    // Build combined features depending on toggles (used for center & combined outline)
    const selectedFeatures: (PlantFeature | HabitatFeature | UrbanFeature | RoadFeature | HotelFeature | LULCFeature | StateParksFeature)[] = [];

    if (showPlants && plantsGeojson) selectedFeatures.push(...plantsGeojson.features);
    if (showHabitat && habitatGeojson) selectedFeatures.push(...habitatGeojson.features);
    if (showUrban && urbanGeojson) selectedFeatures.push(...urbanGeojson.features);
    if (showRoads && roadsGeojson) selectedFeatures.push(...roadsGeojson.features as any);
    // hotels are point features - include them for centering if toggled
    if (showHotels && hotelsGeojson) selectedFeatures.push(...hotelsGeojson.features as any);
    if (showStateParks && stateParksGeojson) selectedFeatures.push(...stateParksGeojson.features);

    // Add filtered LULC features
    if (LULCGeojson) {
      const filteredLULC = LULCGeojson.features.filter(f => {
        const code = String(f.properties.landcover ?? '');
        const category = getLULCCategory(code);
        
        return (category === 'urban' && showUrbanBuiltup) ||
               (category === 'agricultural' && showAgricultural) ||
               (category === 'rangeland' && showRangeland) ||
               (category === 'forest' && showForest) ||
               (category === 'water' && showWater) ||
               (category === 'wetland' && showWetland) ||
               (category === 'barren' && showBarren)
      });
      selectedFeatures.push(...filteredLULC);
    }

    // Compute map center
    // const [initialCenter] = useState({ lat: 20.7, lon: -156.0 });
    // let centerLat = 20.7;
    // let centerLon = -156.0;

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

    // if (allCoords.length > 0) {
    //   centerLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
    //   centerLon = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
    // }

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

    // Roads layers
    if (showRoads && roadsGeojson) {
      mapboxLayers.push({
        sourcetype: 'geojson' as const,
        source: roadsGeojson,
        type: 'line' as const,
        color: 'rgba(0,0,0,0.35)',
        line: { width: 1,
          opacity: 0.4,
         },
      });
    }

    // LULC fills - filtered by category
    if (LULCGeojson) {
      const filteredLULC = LULCGeojson.features.filter(f => {
        const code = String(f.properties.landcover ?? '');
        const category = getLULCCategory(code);
        
        return (category === 'urban' && showUrbanBuiltup) ||
               (category === 'agricultural' && showAgricultural) ||
               (category === 'rangeland' && showRangeland) ||
               (category === 'forest' && showForest) ||
               (category === 'water' && showWater) ||
               (category === 'wetland' && showWetland) ||
               (category === 'barren' && showBarren)
      });

      mapboxLayers.push(
        ...filteredLULC.map(f => ({
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

    // Outlines
    const combinedOutlineFeatures: any[] = [];
    if (showPlants && plantsGeojson) combinedOutlineFeatures.push(...plantsGeojson.features);
    if (showHabitat && habitatGeojson) combinedOutlineFeatures.push(...habitatGeojson.features);
    if (showUrban && urbanGeojson) combinedOutlineFeatures.push(...urbanGeojson.features);
    if (showStateParks && stateParksGeojson) combinedOutlineFeatures.push(...stateParksGeojson.features);
    
    if (LULCGeojson) {
      const filteredLULC = LULCGeojson.features.filter(f => {
        const code = String(f.properties.landcover ?? '');
        const category = getLULCCategory(code);
        
        return (category === 'urban' && showUrbanBuiltup) ||
               (category === 'agricultural' && showAgricultural) ||
               (category === 'rangeland' && showRangeland) ||
               (category === 'forest' && showForest) ||
               (category === 'water' && showWater) ||
               (category === 'wetland' && showWetland) ||
               (category === 'barren' && showBarren)
      });
      combinedOutlineFeatures.push(...filteredLULC);
    }

    if (combinedOutlineFeatures.length > 0) {
      mapboxLayers.push({
        sourcetype: 'geojson' as const,
        source: { type: 'FeatureCollection', features: combinedOutlineFeatures },
        type: 'line' as const,
        color: 'rgba(0,0,0,0)',
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
    // Urban hover scatter (lots of invisible points along polygons)
    if (showUrban && urbanGeojson) {
      const hoverLat: number[] = [];
      const hoverLon: number[] = [];
      const hoverText: string[] = [];

      urbanGeojson.features.forEach((f) => {
        const geom = f.geometry;

        // Use all boundary coordinates as hover hotspots
        if (geom.type === 'Polygon') {
          // outer ring
          geom.coordinates[0].forEach(([lon, lat]) => {
            hoverLat.push(lat);
            hoverLon.push(lon);
            hoverText.push((f.properties as any).hoverText);
          });
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly) => {
            // outer ring of each polygon
            poly[0].forEach(([lon, lat]) => {
              hoverLat.push(lat);
              hoverLon.push(lon);
              hoverText.push((f.properties as any).hoverText);
            });
          });
        }
      });

      traces.push({
        type: 'scattermapbox' as const,
        lat: hoverLat,
        lon: hoverLon,
        mode: 'markers',
        marker: {
          size: 18,
          color: 'rgba(0,0,0,0)', // fully invisible
        },
        text: hoverText,
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

    // LULC
    const showAnyLULC = showUrbanBuiltup || showAgricultural || showRangeland || 
                        showForest || showWater || showWetland || showBarren;

    if ((showAnyLULC && LULCGeojson) || (showStateParks && stateParksGeojson)) {
      const centLat: number[] = [];
      const centLon: number[] = [];
      const centText: string[] = [];

      if (showAnyLULC && LULCGeojson) {
        const filteredLULC = LULCGeojson.features.filter(f => {
          const code = String(f.properties.landcover ?? '');
          const category = getLULCCategory(code);
          
          return (category === 'urban' && showUrbanBuiltup) ||
                 (category === 'agricultural' && showAgricultural) ||
                 (category === 'rangeland' && showRangeland) ||
                 (category === 'forest' && showForest) ||
                 (category === 'water' && showWater) ||
                 (category === 'wetland' && showWetland) ||
                 (category === 'barren' && showBarren)
        });

        filteredLULC.forEach(f => {
          const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
          centLat.push(coords.reduce((s, c) => s + c[1], 0) / coords.length);
          centLon.push(coords.reduce((s, c) => s + c[0], 0) / coords.length);
          centText.push((f.properties as any).hoverText);
        });
      }

      // State Parks
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
    const layout: any = {
      autosize: true,
      mapbox: {
        style: 'carto-positron',
        center: initialCenter,
        zoom: 8.5,
        layers: mapboxLayers,
      },
      hovermode: 'closest',
      margin: { t: 0, l: 0, r: 0, b: 0 },
      showlegend: false,
      uirevision: 'constant' // Preserves user's pan/zoom
    };
    
    try {
      if ((Plotly as any).react) {
        (Plotly as any).react(divRef.current, traces, layout, { displayModeBar: true, responsive: true, scrollZoom: true });
      } else {
        try { (Plotly as any).purge(divRef.current); } catch {}
        Plotly.newPlot(divRef.current, traces, layout, { displayModeBar: true, responsive: true, scrollZoom: true } );
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
    showUrbanBuiltup,
    showAgricultural,
    showRangeland,
    showForest,
    showWater,
    showWetland,
    showBarren,
    showStateParks,
    plantsGeojson,
    habitatGeojson,
    urbanGeojson,
    roadsGeojson,
    hotelsGeojson,
    LULCGeojson,
    stateParksGeojson,
  ]);

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
      } as any
    );
    }
  };

  const DynamicLegend = () => {
    const legendSections: Array<{title: string; items: Array<{label: string; color: string}>}> = [];

    // Endangered Plants
    if (showPlants) {
      legendSections.push({
        title: 'Endangered Plants (Density)',
        items: [
          { label: 'Very High', color: '#344e41' },
          { label: 'High', color: '#3a5a40' },
          { label: 'Medium', color: '#588157' },
          { label: 'Low', color: '#a3b18a' },
          { label: 'Other/Low Outside', color: '#8dcc94ff' },
          { label: 'Outlier', color: '#dad7cd' },
        ]
      });
    }

    // Critical Habitats
    if (showHabitat) {
      legendSections.push({
        title: 'Critical Habitats',
        items: [
          { label: 'Protected Areas', color: '#e9c46a' },
        ]
      });
    }

    // State Parks
    if (showStateParks) {
      legendSections.push({
        title: 'State Parks',
        items: [
          { label: 'State Park Land', color: '#778da9' },
        ]
      });
    }

    // Forest Land
    if (showForest) {
      legendSections.push({
        title: 'Forest Land',
        items: [
          { label: 'Deciduous Forest', color: '#238b45' },
          { label: 'Evergreen Forest', color: '#006d2c' },
          { label: 'Mixed Forest', color: '#74c476' },
        ]
      });
    }

    // Rangeland
    if (showRangeland) {
      legendSections.push({
        title: 'Rangeland',
        items: [
          { label: 'Herbaceous Rangeland', color: '#ffffb3' },
          { label: 'Shrub & Brush Rangeland', color: '#fcefb4' },
          { label: 'Mixed Rangeland', color: '#eefc57' },
        ]
      });
    }

    // Water
    if (showWater) {
      legendSections.push({
        title: 'Water',
        items: [
          { label: 'Streams & Canals', color: '#08519c' },
          { label: 'Lakes', color: '#3182bd' },
          { label: 'Reservoirs', color: '#6baed6' },
          { label: 'Bays & Estuaries', color: '#9ecae1' },
        ]
      });
    }

    // Wetland
    if (showWetland) {
      legendSections.push({
        title: 'Wetland',
        items: [
          { label: 'Forested Wetland', color: '#49dcb1' },
          { label: 'Nonforested Wetland', color: '#72efdd' },
        ]
      });
    }

    // Barren Land
    if (showBarren) {
      legendSections.push({
        title: 'Barren Land',
        items: [
          { label: 'Dry Salt Flats', color: '#f0f0f0' },
          { label: 'Beaches', color: '#fdd0a2' },
          { label: 'Sandy Areas', color: '#bdbdbd' },
          { label: 'Bare Exposed Rock', color: '#969696' },
          { label: 'Strip Mines & Quarries', color: '#737373' },
          { label: 'Transitional Areas', color: '#525252' },
          { label: 'Mixed Barren', color: '#252525' },
        ]
      });
    }

    // Urban Areas - by Density
    if (showUrban) {
      legendSections.push({
        title: 'Urban Areas (Population Density)',
        items: [
          { label: 'Very High (>10,000/sq mi)', color: 'rgba(103,0,13,0.65)' },
          { label: 'High (5,000-10,000/sq mi)', color: 'rgba(165,15,21,0.6)' },
          { label: 'Medium-High (2,500-5,000/sq mi)', color: 'rgba(203,24,29,0.55)' },
          { label: 'Medium (1,000-2,500/sq mi)', color: 'rgba(239,59,44,0.5)' },
          { label: 'Medium-Low (500-1,000/sq mi)', color: 'rgba(251,106,74,0.45)' },
          { label: 'Low (<500/sq mi)', color: 'rgba(252,146,114,0.4)' },
        ]
      });
    }

    // Roads
    if (showRoads) {
      legendSections.push({
        title: 'Roads',
        items: [
          { label: 'Road Network', color: '#000000'},
        ]
      });
    }

    // Hotels
    if (showHotels) {
      legendSections.push({
        title: 'Hotels',
        items: [
          { label: 'Hotel Locations', color: 'red' },
        ]
      });
    }

    // Urban/Built-up Land
    if (showUrbanBuiltup) {
      legendSections.push({
        title: 'Urban/Built-up Land',
        items: [
          { label: 'Residential', color: '#99000d' },
          { label: 'Commercial & Services', color: '#cb181d' },
          { label: 'Industrial', color: '#ef3b2c' },
          { label: 'Transportation & Utilities', color: '#ff85a1' },
          { label: 'Industrial & Commercial Complexes', color: '#ff5c8a' },
          { label: 'Mixed Urban/Built-up', color: '#ffa69e' },
          { label: 'Other Urban/Built-up', color: '#ffccd5' },
        ]
      });
    }

    // Agricultural Land
    if (showAgricultural) {
      legendSections.push({
        title: 'Agricultural Land',
        items: [
          { label: 'Cropland & Pasture', color: '#fdbf6f' },
          { label: 'Orchards & Vineyards', color: '#ff7f00' },
          { label: 'Confined Feeding Operations', color: '#e36414' },
          { label: 'Other Agricultural', color: '#D58936' },
        ]
      });
    }

    if (legendSections.length === 0) return null;

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
          Active Layers
        </div>
        {legendSections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4, color: '#555' }}>
              {section.title}
            </div>
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
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
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
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
                <span>Endangered Plants</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showHabitat} onChange={e => setShowHabitat(e.target.checked)} />
                <span>Critical Habitats</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showStateParks} onChange={e => setShowStateParks(e.target.checked)} />
                <span>State Parks</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showForest} onChange={e => setShowForest(e.target.checked)} />
                <span>Forest Land</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showRangeland} onChange={e => setShowRangeland(e.target.checked)} />
                <span>Rangeland</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showWater} onChange={e => setShowWater(e.target.checked)} />
                <span>Water</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showWetland} onChange={e => setShowWetland(e.target.checked)} />
                <span>Wetland</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showBarren} onChange={e => setShowBarren(e.target.checked)} />
                <span>Barren Land</span>
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
                <input type="checkbox" checked={showUrbanBuiltup} onChange={e => setShowUrbanBuiltup(e.target.checked)} />
                <span>Built-up Land</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={showAgricultural} onChange={e => setShowAgricultural(e.target.checked)} />
                <span>Agricultural Land</span>
              </label>
            </div>
          )}
        </div>

        {/* Quick Zoom */}
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

      <DynamicLegend />

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
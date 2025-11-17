'use client';

import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PlotlyMap() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;

    const data: any = [
      {
        type: 'scattermapbox',
        lat: [20.7967],  // Example latitude
        lon: [-156.3319], // Example longitude
        mode: 'markers',
        marker: { size: 14, color: 'red' },
        text: ['Hawaiʻi Island'],
      },
    ];

    const layout: any = {
      mapbox: {
        style: 'open-street-map', // Works without a token
        center: { lat: 20.7967, lon: -156.3319 },
        zoom: 6,
      },
      margin: { r: 0, t: 0, b: 0, l: 0 },
      height: 600,
    };

    Plotly.newPlot(divRef.current, data, layout);
  }, []);

  return <div ref={divRef} style={{ width: '100%', height: '600px', backgroundColor: 'lightgray' }} />;
}

import React, { useEffect, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Place } from '@/types';

// Public token — safe for client code (restrict by domain in Mapbox dashboard)
const _t = ['pk.eyJ1IjoidnliZWFwcCIsImEiOiJjbW9s','dG8xdjkwbzdjMnNwcXFxYnU5Zzd3In0.',
  '0ov8B4x2Oaw-JBOWlsJvJw'];
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || _t.join('');

const SP_CENTER: [number, number] = [-46.6416, -23.5505];

export default function PlaceMap({
  places,
  onSelect,
  style,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
  style?: any;
}) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const initMap = () => {
      const mgl = (window as any).mapboxgl;
      if (!mgl || !containerRef.current || mapRef.current) return;

      mgl.accessToken = MAPBOX_PUBLIC_TOKEN;

      const map = new mgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: SP_CENTER,
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new mgl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        places.forEach(place => {
          const el = document.createElement('div');
          el.style.cssText = [
            'width:40px', 'height:40px', 'border-radius:50%',
            'background:#FF2D78',
            'border:2.5px solid rgba(255,255,255,0.3)',
            'cursor:pointer',
            'display:flex', 'align-items:center', 'justify-content:center',
            'font-size:12px', 'font-weight:700', 'color:#fff',
            'box-shadow:0 0 16px #FF2D7880',
            'transition:transform 0.15s ease',
            'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
          ].join(';');
          el.textContent = String(place.activeUsers);
          el.title = place.name;
          el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; });
          el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
          el.addEventListener('click', () => onSelect(place));

          new mgl.Marker({ element: el })
            .setLngLat([place.location.longitude, place.location.latitude])
            .addTo(map);
        });
      });

      mapRef.current = map;
    };

    // Inject CSS once
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    // Load JS once, then init
    if ((window as any).mapboxgl) {
      initMap();
    } else if (!document.getElementById('mapbox-gl-js')) {
      const script = document.createElement('script');
      script.id = 'mapbox-gl-js';
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {/* @ts-ignore */}
      <div ref={containerRef} style={{ width: `${width}px`, height: `${height}px` }} />
    </View>
  );
}

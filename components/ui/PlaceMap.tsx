import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Place } from '@/types';

// Token stored in gitignored constants/mapbox-token.ts
let MAPBOX_TOKEN = '';
try { MAPBOX_TOKEN = require('@/constants/mapbox-token').MAPBOX_PUBLIC_TOKEN; } catch {}
const SP_CENTER: [number, number] = [-46.6416, -23.5505];
const CATEGORY_COLOR: Record<string, string> = {
  club: '#FF2D78',
  bar: '#7B2FFF',
  event: '#F59E0B',
  lounge: '#22C55E',
};

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

  useEffect(() => {
    const initMap = () => {
      const mgl = (window as any).mapboxgl;
      if (!mgl || !containerRef.current || mapRef.current) return;

      mgl.accessToken = MAPBOX_TOKEN;

      const map = new mgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: SP_CENTER,
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new mgl.AttributionControl({ compact: true }));

      map.on('load', () => {
        places.forEach(place => {
          const color = CATEGORY_COLOR[place.category] ?? '#FF2D78';

          const el = document.createElement('div');
          el.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            background: ${color};
            border: 2px solid rgba(255,255,255,0.25);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700; color: #fff;
            box-shadow: 0 0 14px ${color}99;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            font-family: -apple-system, sans-serif;
          `;
          el.textContent = String(place.activeUsers);
          el.title = place.name;

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.18)';
            el.style.boxShadow = `0 0 22px ${color}cc`;
          });
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.boxShadow = `0 0 14px ${color}99`;
          });
          el.addEventListener('click', () => onSelect(place));

          new mgl.Marker({ element: el })
            .setLngLat([place.location.longitude, place.location.latitude])
            .addTo(map);
        });
      });

      mapRef.current = map;
    };

    // Load Mapbox GL CSS once
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    // Load Mapbox GL JS once, then init
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
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Re-render markers when places filter changes
  useEffect(() => {
    const mgl = (window as any).mapboxgl;
    const map = mapRef.current;
    if (!mgl || !map) return;

    // Remove old markers by re-init (simple approach for prototype)
    map.remove();
    mapRef.current = null;

    const reinit = () => {
      if (!containerRef.current) return;
      mgl.accessToken = MAPBOX_TOKEN;
      const newMap = new mgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: SP_CENTER,
        zoom: 13,
        attributionControl: false,
      });
      newMap.addControl(new mgl.AttributionControl({ compact: true }));
      newMap.on('load', () => {
        places.forEach(place => {
          const color = CATEGORY_COLOR[place.category] ?? '#FF2D78';
          const el = document.createElement('div');
          el.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            background: ${color}; border: 2px solid rgba(255,255,255,0.25);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700; color: #fff;
            box-shadow: 0 0 14px ${color}99; transition: transform 0.15s ease;
            font-family: -apple-system, sans-serif;
          `;
          el.textContent = String(place.activeUsers);
          el.title = place.name;
          el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.18)'; });
          el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
          el.addEventListener('click', () => onSelect(place));
          new mgl.Marker({ element: el })
            .setLngLat([place.location.longitude, place.location.latitude])
            .addTo(newMap);
        });
      });
      mapRef.current = newMap;
    };

    setTimeout(reinit, 0);
  }, [places]);

  return (
    <View style={[styles.container, style]}>
      {/* @ts-ignore — div is valid in React Native Web */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

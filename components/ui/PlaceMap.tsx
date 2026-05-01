import React, { useEffect, useRef, useState } from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/constants';
import type { Place } from '@/types';

const SP_CENTER: [number, number] = [-46.6416, -23.5505];
const STYLE_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const MLG_VER = '3.6.2';
const CDN = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MLG_VER}/dist`;

export default function PlaceMap({
  places,
  onSelect,
  heatPoints,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
  heatPoints?: Array<{ lat: number; lng: number }>;
  style?: any;
}) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const { width, height } = useWindowDimensions();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const buildMap = (mgl: any) => {
      if (!containerRef.current || mapRef.current) return;

      let map: any;
      try {
        map = new mgl.Map({
          container: containerRef.current,
          style: STYLE_URL,
          center: SP_CENTER,
          zoom: 13,
          attributionControl: false,
          trackResize: true,
        });
      } catch (e) {
        setStatus('error');
        return;
      }

      map.on('load', () => {
        setStatus('ready');
        map.addControl(new mgl.AttributionControl({ compact: true }), 'bottom-right');

        // Heatmap layer
        if (heatPoints && heatPoints.length > 0) {
          map.addSource('heat', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: heatPoints.map(p => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                properties: {},
              })),
            },
          });
          map.addLayer({
            id: 'heat-layer',
            type: 'heatmap',
            source: 'heat',
            paint: {
              'heatmap-weight': 1,
              'heatmap-intensity': 1.8,
              'heatmap-radius': 55,
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0,   'rgba(0,0,0,0)',
                0.2, 'rgba(123,47,255,0.2)',
                0.5, 'rgba(200,70,255,0.4)',
                0.8, 'rgba(255,45,120,0.6)',
                1,   'rgba(255,45,120,0.85)',
              ],
              'heatmap-opacity': 0.8,
            },
          });
        }

        places.forEach(place => {
          // outer: unstyled wrapper — MapLibre writes transform here for positioning
          const el = document.createElement('div');
          el.style.cssText = 'width:40px;height:40px;';

          // inner: visual pin with transition only for hover scale (not position)
          const pin = document.createElement('div');
          pin.style.cssText = [
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
          pin.textContent = String(place.activeUsers);
          pin.title = place.name;

          el.appendChild(pin);
          el.addEventListener('mouseenter', () => { pin.style.transform = 'scale(1.2)'; });
          el.addEventListener('mouseleave', () => { pin.style.transform = 'scale(1)'; });
          el.addEventListener('click', () => onSelect(place));

          new mgl.Marker({ element: el })
            .setLngLat([place.location.longitude, place.location.latitude])
            .addTo(map);
        });
      });

      map.on('error', () => setStatus('error'));
      mapRef.current = map;
    };

    const loadAndInit = () => {
      if (!document.getElementById('mgl-css')) {
        const link = document.createElement('link');
        link.id = 'mgl-css';
        link.rel = 'stylesheet';
        link.href = `${CDN}/maplibre-gl.css`;
        document.head.appendChild(link);
      }

      const existing = (window as any).maplibregl;
      if (existing) {
        buildMap(existing);
      } else if (!document.getElementById('mgl-js')) {
        const script = document.createElement('script');
        script.id = 'mgl-js';
        script.src = `${CDN}/maplibre-gl.js`;
        script.onload = () => buildMap((window as any).maplibregl);
        script.onerror = () => setStatus('error');
        document.head.appendChild(script);
      } else {
        let attempts = 0;
        const check = setInterval(() => {
          if ((window as any).maplibregl) { clearInterval(check); buildMap((window as any).maplibregl); }
          if (++attempts > 30) { clearInterval(check); setStatus('error'); }
        }, 200);
      }
    };

    loadAndInit();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (status === 'error') {
    return (
      <View style={[styles.fallback, { width, height }]}>
        <Text style={styles.fallbackText}>Não foi possível carregar o mapa</Text>
        <Text style={styles.fallbackSub}>Verifique sua conexão</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height, backgroundColor: Colors.background }}>
      {status === 'loading' && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Carregando mapa...</Text>
        </View>
      )}
      {/* @ts-ignore */}
      <div
        ref={containerRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          filter: 'brightness(0.68) saturate(0.65)',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  fallbackSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});

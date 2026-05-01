import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import type { Place } from '@/types';

import { MAPBOX_PUBLIC_TOKEN } from '@/constants/mapbox-token';
MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN);

const SP_CENTER: [number, number] = [-46.6416, -23.5505];

const CATEGORY_COLOR: Record<Place['category'], string> = {
  club: Colors.secondary,
  bar: '#7B2FFF',
  event: Colors.gold,
  lounge: '#22C55E',
};

export default function PlaceMap({
  places,
  onSelect,
  heatPoints,
  style,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
  heatPoints?: Array<{ lat: number; lng: number }>;
  style?: any;
}) {
  const heatGeoJSON = {
    type: 'FeatureCollection' as const,
    features: (heatPoints ?? []).map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: {},
    })),
  };

  return (
    <View style={[styles.container, style]}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/dark-v11"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera
          zoomLevel={13}
          centerCoordinate={SP_CENTER}
          animationMode="none"
        />

        {heatPoints && heatPoints.length > 0 && (
          <MapboxGL.ShapeSource id="heat-source" shape={heatGeoJSON}>
            <MapboxGL.HeatmapLayer
              id="heat-layer"
              style={{
                heatmapColor: [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.2, 'rgba(123,47,255,0.2)',
                  0.5, 'rgba(200,70,255,0.4)',
                  0.8, 'rgba(255,45,120,0.6)',
                  1, 'rgba(255,45,120,0.85)',
                ],
                heatmapOpacity: 0.8,
                heatmapRadius: 55,
                heatmapIntensity: 1.8,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {places.map(place => (
          <MapboxGL.PointAnnotation
            key={place.id}
            id={place.id}
            coordinate={[place.location.longitude, place.location.latitude]}
            onSelected={() => onSelect(place)}
          >
            <View style={styles.pinOuter}>
              <View style={[styles.pinInner, { backgroundColor: CATEGORY_COLOR[place.category] }]}>
                <Text style={styles.pinCount}>{place.activeUsers}</Text>
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  pinOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pinInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCount: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
});

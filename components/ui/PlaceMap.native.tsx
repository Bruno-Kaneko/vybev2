import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import type { Place } from '@/types';

MapboxGL.setAccessToken('MAPBOX_PUBLIC_TOKEN_HERE');

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
  style,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
  style?: any;
}) {
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

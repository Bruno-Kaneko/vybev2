import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Colors, FontFamily, FontSize, Radius } from '@/constants';
import type { Place } from '@/types';

const SP_REGION = {
  latitude: -23.5505,
  longitude: -46.6416,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CATEGORY_COLOR: Record<Place['category'], string> = {
  club: Colors.secondary,
  bar: '#7B2FFF',
  event: Colors.gold ?? '#F59E0B',
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
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={SP_REGION}
        userInterfaceStyle="dark"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
      >
        {heatPoints?.map((pt, i) => (
          <Circle
            key={`heat-${i}`}
            center={{ latitude: pt.lat, longitude: pt.lng }}
            radius={200}
            fillColor="rgba(255,45,120,0.15)"
            strokeColor="rgba(255,45,120,0.3)"
            strokeWidth={1}
          />
        ))}

        {places.map(place => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.location.latitude, longitude: place.location.longitude }}
            onPress={() => onSelect(place)}
            tracksViewChanges={false}
          >
            <View style={styles.pinOuter}>
              <View style={[styles.pinInner, { backgroundColor: CATEGORY_COLOR[place.category] }]}>
                <Text style={styles.pinCount}>{place.activeUsers}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: Colors.background,
  },
  pinInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCount: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
});

import { supabase } from './supabase';
import { haversineKm } from './db';

const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
const NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';

// Tipos do Google Places relevantes para nightlife
const NIGHTLIFE_TYPES = ['bar', 'night_club', 'restaurant', 'pub'];

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.photos',
].join(',');

export type NearbyPlace = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  distanceM: number;
  lat: number;
  lng: number;
  types: string[];
  primaryType: string | null;
  photoRef: string | null;
};

type GoogleNearbyResponse = {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    location?: { latitude: number; longitude: number };
    types?: string[];
    primaryType?: string;
    photos?: Array<{ name: string }>;
  }>;
};

function extractNeighborhood(address: string): string {
  // Google formatted address example: "Rua Augusta, 200 - Consolação, São Paulo - SP, 01304-000, Brazil"
  // Try to extract neighborhood (between "-" and city)
  const match = address.match(/-\s*([^,-]+?),\s*São Paulo/i);
  if (match) return match[1].trim();
  // Fallback: pick the segment before the city
  const parts = address.split(',').map(s => s.trim());
  return parts[1] ?? '';
}

async function cachePlacesToDB(places: NearbyPlace[]): Promise<void> {
  if (places.length === 0) return;
  const rows = places.map(p => ({
    id: p.id,
    name: p.name,
    address: p.address,
    neighborhood: p.neighborhood || null,
    lat: p.lat,
    lng: p.lng,
    types: p.types,
    primary_type: p.primaryType,
    photo_ref: p.photoRef,
    updated_at: new Date().toISOString(),
  }));
  try {
    await supabase.from('places').upsert(rows, { onConflict: 'id' });
  } catch {
    // Cache é otimização — falha silenciosa não bloqueia o usuário
  }
}

export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters = 1000
): Promise<NearbyPlace[]> {
  if (!GOOGLE_PLACES_KEY) {
    console.warn('[places] EXPO_PUBLIC_GOOGLE_PLACES_KEY não configurada');
    return [];
  }

  try {
    const res = await fetch(NEARBY_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: NIGHTLIFE_TYPES,
        maxResultCount: 20,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: Math.min(radiusMeters, 50000),
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('[places] Google API erro:', res.status, errText);
      return [];
    }

    const data: GoogleNearbyResponse = await res.json();
    const places: NearbyPlace[] = (data.places ?? [])
      .filter(p => p.id && p.location)
      .map(p => {
        const address = p.shortFormattedAddress ?? p.formattedAddress ?? '';
        return {
          id: p.id,
          name: p.displayName?.text ?? 'Lugar sem nome',
          address,
          neighborhood: extractNeighborhood(p.formattedAddress ?? address),
          lat: p.location!.latitude,
          lng: p.location!.longitude,
          distanceM: Math.round(haversineKm(lat, lng, p.location!.latitude, p.location!.longitude) * 1000),
          types: p.types ?? [],
          primaryType: p.primaryType ?? null,
          photoRef: p.photos?.[0]?.name ?? null,
        };
      })
      .sort((a, b) => a.distanceM - b.distanceM);

    cachePlacesToDB(places);

    return places;
  } catch (e) {
    console.warn('[places] erro de rede:', e);
    return [];
  }
}

export function getPlacePhotoUrl(photoRef: string, maxWidth = 800): string {
  // photoRef vem como "places/PLACE_ID/photos/PHOTO_ID"
  return `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_KEY}`;
}

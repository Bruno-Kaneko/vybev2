// Testes de helpers exportados em lib/db.ts e lib/places.ts

import { mapDBPlaceToPlace } from '@/lib/db';

describe('mapDBPlaceToPlace', () => {
  const basePlace = {
    id: 'uuid-123',
    google_place_id: 'ChIJ...',
    name: 'Lab Club',
    address: 'Rua Augusta, 200',
    category: null,
    lat: -23.5505,
    lng: -46.6333,
    neighborhood: 'Consolação',
    description: null,
    tags: null,
    types: ['night_club'] as string[],
    primary_type: 'night_club',
    photo_ref: 'places/X/photos/Y',
    photo_url: 'https://lh3.googleusercontent.com/abc=s4800-w400',
    price_level: null,
    cover_charge: null,
    near_metro: null,
    has_parking: null,
    has_seating: null,
    has_menu: null,
    metro_name: null,
    metro_distance_m: null,
    parking_name: null,
    parking_address: null,
    follower_count: 0,
    crowd_level: null,
    queue_level: null,
    vibe: null,
    crowd_updated_at: null,
    created_at: '2025-01-01T00:00:00Z',
  };

  it('mapeia campos básicos corretamente', () => {
    const place = mapDBPlaceToPlace(basePlace);
    expect(place.id).toBe('uuid-123');
    expect(place.name).toBe('Lab Club');
    expect(place.address).toBe('Rua Augusta, 200');
    expect(place.location.latitude).toBe(-23.5505);
    expect(place.location.longitude).toBe(-46.6333);
  });

  it('deriva category dos tipos do Google quando category é null', () => {
    const club = mapDBPlaceToPlace({ ...basePlace, primary_type: 'night_club' });
    expect(club.category).toBe('club');

    const bar = mapDBPlaceToPlace({ ...basePlace, types: ['bar'], primary_type: 'bar' });
    expect(bar.category).toBe('bar');
  });

  it('thumbnail troca o size token do Google CDN', () => {
    const place = mapDBPlaceToPlace(basePlace);
    expect(place.thumbnail).toBeDefined();
    expect(place.thumbnail).toContain('=w600');
    expect(place.thumbnail).not.toContain('=s4800-w400');
  });

  it('quando photo_url é null, thumbnail fica undefined', () => {
    const place = mapDBPlaceToPlace({ ...basePlace, photo_url: null });
    expect(place.thumbnail).toBeUndefined();
  });

  it('booleans null viram false', () => {
    const place = mapDBPlaceToPlace(basePlace);
    expect(place.nearMetro).toBe(false);
    expect(place.hasParking).toBe(false);
    expect(place.hasSeating).toBe(false);
    expect(place.hasMenu).toBe(false);
  });

  it('follower_count null vira 0', () => {
    const place = mapDBPlaceToPlace({ ...basePlace, follower_count: null });
    expect(place.followers).toBe(0);
  });
});

// Testes de funções PURAS do lib/db.ts (sem dependência de Supabase / rede)

import { haversineKm, googleTypesToCategory } from '@/lib/db';

describe('haversineKm', () => {
  it('retorna 0 quando os dois pontos são iguais', () => {
    const d = haversineKm(-23.5505, -46.6333, -23.5505, -46.6333);
    expect(d).toBe(0);
  });

  it('calcula distância aproximada entre Vila Madalena e Centro/SP (~5km)', () => {
    const vilaMadalena = { lat: -23.5475, lng: -46.6925 };
    const centro = { lat: -23.5505, lng: -46.6333 };
    const d = haversineKm(vilaMadalena.lat, vilaMadalena.lng, centro.lat, centro.lng);
    expect(d).toBeGreaterThan(5);
    expect(d).toBeLessThan(8);
  });

  it('é simétrico (A→B == B→A)', () => {
    const a = { lat: -23.5, lng: -46.6 };
    const b = { lat: -23.6, lng: -46.7 };
    const ab = haversineKm(a.lat, a.lng, b.lat, b.lng);
    const ba = haversineKm(b.lat, b.lng, a.lat, a.lng);
    expect(ab).toBeCloseTo(ba, 6);
  });
});

describe('googleTypesToCategory', () => {
  it('night_club → club', () => {
    expect(googleTypesToCategory(['night_club'], null)).toBe('club');
    expect(googleTypesToCategory(['restaurant', 'night_club'], 'restaurant')).toBe('club');
  });

  it('bar → bar', () => {
    expect(googleTypesToCategory(['bar'], 'bar')).toBe('bar');
    expect(googleTypesToCategory(['pub'], 'pub')).toBe('bar');
  });

  it('restaurante puro → lounge (fallback)', () => {
    expect(googleTypesToCategory(['restaurant'], 'restaurant')).toBe('lounge');
    expect(googleTypesToCategory(['italian_restaurant'], 'italian_restaurant')).toBe('lounge');
  });

  it('quando types é null, retorna lounge', () => {
    expect(googleTypesToCategory(null, null)).toBe('lounge');
  });

  it('night_club tem prioridade sobre bar', () => {
    expect(googleTypesToCategory(['bar', 'night_club'], 'bar')).toBe('club');
  });
});

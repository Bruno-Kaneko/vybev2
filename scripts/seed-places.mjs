// ────────────────────────────────────────────────────────────────
// Seed da tabela `places` com bares/baladas/restaurantes reais de SP
// via Google Places API (Nearby Search).
//
// Rodar:  node scripts/seed-places.mjs
//
// Requer no .env.local:
//   - EXPO_PUBLIC_GOOGLE_PLACES_KEY
//   - SUPABASE_SERVICE_ROLE_KEY   (não prefixar com EXPO_PUBLIC_)
// ────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Carrega .env.local manualmente (sem dep extra)
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const eq = l.indexOf('=');
      return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()];
    })
);

const GOOGLE_KEY = env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = 'https://dbvresswgtgouudyotpx.supabase.co';

if (!GOOGLE_KEY) { console.error('❌ falta EXPO_PUBLIC_GOOGLE_PLACES_KEY'); process.exit(1); }
if (!SERVICE_ROLE) { console.error('❌ falta SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Pontos de busca: bairros com vida noturna em SP
const SEARCH_POINTS = [
  { name: 'Vila Madalena',     lat: -23.5475, lng: -46.6925, radius: 1500 },
  { name: 'Pinheiros',         lat: -23.5670, lng: -46.6820, radius: 1500 },
  { name: 'Itaim Bibi',        lat: -23.5860, lng: -46.6760, radius: 1500 },
  { name: 'Vila Olímpia',      lat: -23.5950, lng: -46.6870, radius: 1500 },
  { name: 'Jardim Paulista',   lat: -23.5680, lng: -46.6700, radius: 1500 },
  { name: 'Augusta/Consolação',lat: -23.5570, lng: -46.6620, radius: 1200 },
  { name: 'Bela Vista',        lat: -23.5610, lng: -46.6510, radius: 1200 },
  { name: 'Centro/República',  lat: -23.5430, lng: -46.6420, radius: 1200 },
  { name: 'Liberdade',         lat: -23.5590, lng: -46.6350, radius: 1000 },
  { name: 'Higienópolis',      lat: -23.5440, lng: -46.6590, radius: 1200 },
  { name: 'Santa Cecília',     lat: -23.5380, lng: -46.6520, radius: 1200 },
  { name: 'Moema',             lat: -23.6010, lng: -46.6650, radius: 1500 },
  { name: 'Brooklin',          lat: -23.6160, lng: -46.6900, radius: 1500 },
  { name: 'Mooca',             lat: -23.5570, lng: -46.5950, radius: 1500 },
  { name: 'Lapa',              lat: -23.5210, lng: -46.7050, radius: 1500 },
];

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

function extractNeighborhood(address) {
  const match = address.match(/-\s*([^,-]+?),\s*São Paulo/i);
  if (match) return match[1].trim();
  const parts = address.split(',').map(s => s.trim());
  return parts[1] ?? '';
}

async function searchPoint(point) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: NIGHTLIFE_TYPES,
      maxResultCount: 20,
      languageCode: 'pt-BR',
      regionCode: 'BR',
      locationRestriction: {
        circle: { center: { latitude: point.lat, longitude: point.lng }, radius: point.radius },
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn(`⚠️  ${point.name}: HTTP ${res.status} — ${txt.slice(0, 200)}`);
    return [];
  }

  const data = await res.json();
  return (data.places ?? [])
    .filter(p => p.id && p.location)
    .map(p => ({
      google_place_id: p.id,
      name: p.displayName?.text ?? 'Lugar sem nome',
      address: p.shortFormattedAddress ?? p.formattedAddress ?? '',
      neighborhood: extractNeighborhood(p.formattedAddress ?? '') || point.name,
      lat: p.location.latitude,
      lng: p.location.longitude,
      types: p.types ?? [],
      primary_type: p.primaryType ?? null,
      photo_ref: p.photos?.[0]?.name ?? null,
      updated_at: new Date().toISOString(),
    }));
}

async function main() {
  console.log(`🚀 Buscando bares/baladas em ${SEARCH_POINTS.length} bairros de SP...\n`);

  const byGoogleId = new Map();
  for (const point of SEARCH_POINTS) {
    process.stdout.write(`📍 ${point.name.padEnd(22)} `);
    const places = await searchPoint(point);
    for (const p of places) byGoogleId.set(p.google_place_id, p);
    console.log(`→ ${places.length} lugares`);
    // Pausa rápida pra não estourar rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  const allPlaces = [...byGoogleId.values()];
  console.log(`\n✨ Total único: ${allPlaces.length} estabelecimentos\n`);

  if (allPlaces.length === 0) {
    console.error('❌ Nenhum lugar encontrado. Verifica se a Places API (New) está habilitada.');
    process.exit(1);
  }

  // Upsert em batches de 50 (Supabase tem limite por request)
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < allPlaces.length; i += BATCH) {
    const batch = allPlaces.slice(i, i + BATCH);
    const { error } = await supabase
      .from('places')
      .upsert(batch, { onConflict: 'google_place_id' });
    if (error) {
      console.error(`❌ Erro no batch ${i}-${i + batch.length}:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`✅ Inseridos/atualizados ${inserted}/${allPlaces.length}`);
  }

  console.log(`\n🎉 Pronto! ${inserted} estabelecimentos no banco.`);
}

main().catch(e => { console.error('💥 Falhou:', e); process.exit(1); });

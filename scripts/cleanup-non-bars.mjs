// ────────────────────────────────────────────────────────────────
// Remove da tabela `places` lugares que não são vida noturna.
//
// Estratégia:
//  MANTÉM: primary_type de vida noturna (bar, night_club, cocktail_bar, pub, etc)
//  MANTÉM: restaurantes que tenham 'bar' ou 'night_club' no array types
//  REMOVE: padaria, fast food, supermercado, hotel, sorveteria, etc.
//
// Rodar: node scripts/cleanup-non-bars.mjs
// ────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const eq = l.indexOf('='); return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()]; })
);

const supabase = createClient(
  'https://dbvresswgtgouudyotpx.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Tipos primários sempre relevantes pra vida noturna
const KEEP_PRIMARY = new Set([
  'bar', 'night_club', 'cocktail_bar', 'pub', 'irish_pub',
  'bar_and_grill', 'wine_bar', 'sports_bar',
  'live_music_venue', 'comedy_club', 'event_venue',
  'karaoke', 'dance_hall',
]);

// Tipos no array types[] que qualificam o lugar como vida noturna
// (mesmo se primary_type for "restaurant" ou similar)
const NIGHTLIFE_TYPES_IN_ARRAY = new Set([
  'bar', 'night_club', 'cocktail_bar', 'pub', 'wine_bar', 'sports_bar', 'live_music_venue', 'comedy_club',
]);

// Tipos primários que SEMPRE são removidos (não importa o que mais tenha)
const ALWAYS_REMOVE_PRIMARY = new Set([
  'fast_food_restaurant', 'bakery', 'coffee_shop', 'sandwich_shop',
  'ice_cream_shop', 'pastry_shop', 'supermarket', 'deli', 'store',
  'wholesaler', 'movie_theater', 'breakfast_restaurant', 'hot_dog_restaurant',
  'meal_takeaway', 'meal_delivery', 'hostel', 'hotel',
]);

const { data: places, error } = await supabase
  .from('places')
  .select('id, google_place_id, name, primary_type, types');

if (error) { console.error('❌', error.message); process.exit(1); }

const toKeep = [];
const toRemove = [];

for (const p of places) {
  const types = p.types ?? [];
  const primary = p.primary_type ?? '';

  if (ALWAYS_REMOVE_PRIMARY.has(primary)) {
    toRemove.push(p);
    continue;
  }

  if (KEEP_PRIMARY.has(primary)) {
    toKeep.push(p);
    continue;
  }

  // Restaurante? Mantém só se tiver bar/night_club em types[]
  const hasNightlifeType = types.some(t => NIGHTLIFE_TYPES_IN_ARRAY.has(t));
  if (hasNightlifeType) {
    toKeep.push(p);
  } else {
    toRemove.push(p);
  }
}

console.log(`\n📊 Análise:`);
console.log(`   Manter:  ${toKeep.length}`);
console.log(`   Remover: ${toRemove.length}`);
console.log(`\n🗑️  Exemplos de remoção:`);
toRemove.slice(0, 15).forEach(p => console.log(`   ${p.name.padEnd(38)} (${p.primary_type})`));
if (toRemove.length > 15) console.log(`   ... e mais ${toRemove.length - 15}`);

// Deleta em batches
const ids = toRemove.map(p => p.id);
if (ids.length === 0) {
  console.log('\n✅ Nada a remover.');
  process.exit(0);
}

console.log(`\n⚠️  Deletando ${ids.length} lugares...`);
const BATCH = 50;
let done = 0;
for (let i = 0; i < ids.length; i += BATCH) {
  const batch = ids.slice(i, i + BATCH);
  const { error: delError } = await supabase.from('places').delete().in('id', batch);
  if (delError) { console.error('❌', delError.message); process.exit(1); }
  done += batch.length;
  console.log(`   ✓ ${done}/${ids.length}`);
}

console.log(`\n🎉 ${done} lugares removidos. Banco com ${toKeep.length} estabelecimentos relevantes.`);

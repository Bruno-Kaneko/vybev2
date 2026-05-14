// ────────────────────────────────────────────────────────────────
// Resolve photo_ref → photo_url (URL CDN do Google) pra cada lugar.
//
// Rodar: node scripts/resolve-photo-urls.mjs
//
// Faz 1 chamada por lugar (~211 chamadas, ~$1.50 no total).
// É uma operação UMA VEZ — depois disso o app usa photo_url direto.
// ────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const eq = l.indexOf('='); return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()]; })
);

const GOOGLE_KEY = env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient('https://dbvresswgtgouudyotpx.supabase.co', SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function resolvePhotoUrl(photoRef) {
  const url = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${GOOGLE_KEY}&skipHttpRedirect=true`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.photoUri ?? null;
}

const { data: places, error } = await supabase
  .from('places')
  .select('id, name, photo_ref')
  .not('photo_ref', 'is', null)
  .is('photo_url', null);

if (error) { console.error('❌', error.message); process.exit(1); }

console.log(`🔍 Resolvendo URLs de ${places.length} fotos...\n`);

let ok = 0, fail = 0;
for (let i = 0; i < places.length; i++) {
  const p = places[i];
  process.stdout.write(`[${i + 1}/${places.length}] ${p.name.padEnd(38).slice(0, 38)} `);
  try {
    const photoUrl = await resolvePhotoUrl(p.photo_ref);
    if (photoUrl) {
      await supabase.from('places').update({ photo_url: photoUrl }).eq('id', p.id);
      console.log('✅');
      ok++;
    } else {
      console.log('⚠️  null');
      fail++;
    }
  } catch (e) {
    console.log(`❌ ${e.message}`);
    fail++;
  }
  // Pequeno delay pra não estourar rate limit
  await new Promise(r => setTimeout(r, 80));
}

console.log(`\n🎉 ${ok} resolvidas, ${fail} falharam.`);

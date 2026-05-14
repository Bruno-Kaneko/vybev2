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

// Conta lugares com e sem foto
const { count: total } = await supabase.from('places').select('*', { count: 'exact', head: true });
const { count: withPhoto } = await supabase.from('places').select('*', { count: 'exact', head: true }).not('photo_ref', 'is', null);
const { count: withoutPhoto } = await supabase.from('places').select('*', { count: 'exact', head: true }).is('photo_ref', null);

console.log(`Total de lugares: ${total}`);
console.log(`Com photo_ref: ${withPhoto}`);
console.log(`Sem photo_ref: ${withoutPhoto}`);

// Amostra dos primeiros 5 com foto
const { data: sample } = await supabase.from('places').select('name, photo_ref').not('photo_ref', 'is', null).limit(3);
console.log('\nAmostra de photo_ref:');
sample?.forEach(p => console.log(`  ${p.name}: ${p.photo_ref}`));

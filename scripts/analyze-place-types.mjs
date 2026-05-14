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

const { data } = await supabase.from('places').select('primary_type, name');

const counts = {};
const samples = {};
for (const p of data) {
  const t = p.primary_type ?? 'NULL';
  counts[t] = (counts[t] ?? 0) + 1;
  if (!samples[t]) samples[t] = [];
  if (samples[t].length < 3) samples[t].push(p.name);
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log('Tipos no banco:\n');
for (const [type, count] of sorted) {
  console.log(`  ${type.padEnd(28)} ${count.toString().padStart(4)}  (${samples[type].slice(0, 2).join(', ')})`);
}

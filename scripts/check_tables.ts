import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(url, key);

const tables = [
  'niches','channels','videos','transcripts','analyses',
  'knowledge_entries','pipeline_runs','video_snapshots',
  'channel_snapshots','niche_snapshots','video_velocity_snapshots'
];

async function main() {
  for (const t of tables) {
    const { error } = await client.from(t).select('count').limit(1);
    console.log(error ? `❌ ${t}: ${error.message}` : `✅ ${t}`);
  }
}
main().catch(console.error);

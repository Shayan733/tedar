import { getRecentRuns } from '../lib/supabase-queries';

async function main() {
  const runs = await getRecentRuns(5);
  console.log('✅ Recent runs fetched:', runs.length);
}

main().catch(console.error);

import { getRecentRuns } from '../lib/supabase-queries';

async function main() {
  const runs = await getRecentRuns(10);
  console.log('Recent pipeline runs:');
  runs.forEach(r => {
    console.log(`  [${r.status}] ${r.id} — ${r.inputType}:"${r.inputValue}" — ${r.videosScanned} videos, ${r.outliersFound} outliers`);
  });
}

main().catch(console.error);

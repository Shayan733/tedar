import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { decodeVideo } from '../lib/analysis';

const urls = [
  'https://www.youtube.com/watch?v=xdfeXqHFmPI',
  'https://www.youtube.com/watch?v=lIW5jBrrsS0',
  'https://www.youtube.com/watch?v=dtp6b76pMak',
  'https://www.youtube.com/watch?v=ZoqgAy3h4OM',
  'https://www.youtube.com/watch?v=tLQLa6lM3Us',
];

async function main() {
  const idx = parseInt(process.env.VIDEO_INDEX ?? '0', 10);
  const url = urls[idx];
  if (!url) { console.error('Invalid VIDEO_INDEX'); process.exit(1); }

  console.log(`\n=== VIDEO ${idx + 1}: ${url} ===\n`);
  const start = Date.now();
  const { result, cached } = await decodeVideo(url, { forceRefresh: true });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Time: ${elapsed}s | cached: ${cached}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });

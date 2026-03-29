import { resolveChannelId, getChannelVideos } from '../lib/youtube/channel';

async function main() {
  const id = await resolveChannelId('https://www.youtube.com/@mkbhd');
  const videos = await getChannelVideos(id, 100);
  console.log('✅ Pagination test: requested 100, got', videos.length, 'videos');
  console.log('First:', videos[0].title);
  console.log('Last:', videos[videos.length - 1].title);
}
main().catch(console.error);

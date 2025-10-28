import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateUserData } from '../../db/dbUpdate.js';

// Proper __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const episodeDataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(episodeDataPath, 'utf-8'));

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handleDeeplink(ctx, payload) {
  const user_id = ctx.from.id;
  const username = ctx.from.username || `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim();
  console.log(`[Deeplink2] User ${user_id} (${username}) requested payload: ${payload}`);

  const [animeCode, seasonId, quality] = payload.split('_');

  let found = false;

  for (const animeName in episodeData.anime_list) {
    const anime = episodeData.anime_list[animeName];

    if (String(anime.anime_id) !== animeCode) continue;

    const seasonKey = Object.keys(anime.content).find(season => {
      return anime.content[season].season_id === `s${seasonId}`;
    });

    if (!seasonKey) {
      console.log(`[Deeplink2] Invalid season ID: ${seasonId} for user ${user_id} (${username})`);
      return ctx.reply('Invalid season ID');
    }

    const episodes = anime.content[seasonKey].episodes;

    const sortedEpisodes = Object.keys(episodes)
      .sort((a, b) => parseInt(episodes[a].ep_number) - parseInt(episodes[b].ep_number));

    for (const epKey of sortedEpisodes) {
      const ep = episodes[epKey];
      const qualityObj = ep.qualities[quality];

      if (!qualityObj) continue;

      const { file_id, file_size } = qualityObj;
      const caption = `🎬 *${animeName}* – *${seasonKey}*\n📺 Episode ${ep.ep_number}\n🎞 Quality: ${quality}\n📦 Size: ${file_size}`;
      console.log(`[Deeplink2] Sending Episode ${ep.ep_number} (${quality}) to user ${user_id} (${username})`);

      // Update DB for each episode sent
      const recentsEntry = {
        anime_id: animeCode,
        anime_title: animeName,
        season_id: `s${seasonId}`,
        episode_number: Number(ep.ep_number),
        quality: quality
      };

      try {
        await updateUserData(user_id, { recents: [recentsEntry] });
        console.log(`[Deeplink2] DB updated for user ${user_id} (${username}), episode ${ep.ep_number}`);
      } catch (err) {
        console.error(`[Deeplink2] DB update error for user ${user_id} (${username}):`, err);
      }

      try {
        await ctx.replyWithVideo(file_id, {
          caption,
          parse_mode: 'Markdown'
        });
        console.log(`[Deeplink2] Video sent to user ${user_id} (${username}), episode ${ep.ep_number}`);
      } catch (err) {
        console.error(`[Deeplink2] Error sending video to user ${user_id} (${username}):`, err);
      }

      await delay(200);
    }

    found = true;
    break;
  }

  if (!found) {
    console.log(`[Deeplink2] Anime with code ${animeCode} not found for user ${user_id} (${username})`);
    ctx.reply('Anime not found');
  }
}

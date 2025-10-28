import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateUserData } from '../../db/dbUpdate.js';

// Proper __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

export default async function handleDeeplink(ctx, payload) {
  const user_id = ctx.from.id;
  const username = ctx.from.username || `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim();
  console.log(`[Deeplink1] User ${user_id} (${username}) requested payload: ${payload}`);

  const parts = payload.split('_');

  if (parts.length !== 4) {
    console.log(`[Deeplink1] Invalid deeplink format for user ${user_id} (${username})`);
    return ctx.reply('Invalid deeplink format.');
  }

  const [animeCode, seasonIdRaw, episodeNum, quality] = parts;
  const seasonId = seasonIdRaw.startsWith('s') ? seasonIdRaw : `s${seasonIdRaw}`;

  let matchedTitle = null;
  let seasonKey = null;
  let episode = null;

  for (const [title, anime] of Object.entries(episodeData.anime_list)) {
    if (String(anime.anime_id) === animeCode) {
      matchedTitle = title;

      for (const [key, s] of Object.entries(anime.content)) {
        if (s.season_id === seasonId) {
          seasonKey = key;
          episode = s.episodes[`Episode ${episodeNum}`];
          break;
        }
      }

      break;
    }
  }

  if (!matchedTitle || !seasonKey || !episode) {
    console.log(`[Deeplink1] Invalid deeplink reference for user ${user_id} (${username})`);
    return ctx.reply('Invalid deeplink reference.');
  }

  const fileObj = episode.qualities[quality];
  if (!fileObj || !fileObj.file_id) {
    console.log(`[Deeplink1] Requested quality not available (${quality}) for user ${user_id} (${username})`);
    return ctx.reply('Requested quality not available.');
  }

  const caption = `🎬 *${matchedTitle}* – *${seasonKey}*\n📺 Episode ${episodeNum}\n🎞 Quality: ${quality}\n📦 Size: ${fileObj.file_size}`;

  try {
    await updateUserData(user_id, { recents: [{
      anime_id: animeCode,
      anime_title: matchedTitle,
      season_id: seasonId,
      episode_number: Number(episodeNum),
      quality: quality
    }] });
    console.log(`[Deeplink1] DB updated for user ${user_id} (${username}), episode ${episodeNum}`);
  } catch (err) {
    console.error(`[Deeplink1] DB update error for user ${user_id} (${username}):`, err);
  }

  try {
    await ctx.replyWithVideo(fileObj.file_id, { caption, parse_mode: 'Markdown' });
    console.log(`[Deeplink1] Video sent to user ${user_id} (${username}), episode ${episodeNum}`);
  } catch (err) {
    console.error(`[Deeplink1] Error sending video to user ${user_id} (${username}):`, err);
  }
}

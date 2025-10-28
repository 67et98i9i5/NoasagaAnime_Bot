import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateUserData } from '../../db/dbUpdate.js';

// Proper __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const episodeDataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(episodeDataPath, 'utf-8'));

export function handleDeeplink3(ctx, payload) {
  const [animeCode, seasonId, episodeNumber] = payload.split('_');

  for (const animeName in episodeData.anime_list) {
    const anime = episodeData.anime_list[animeName];
    if (String(anime.anime_id) !== animeCode) continue;

    const seasonKey = Object.keys(anime.content).find(season => {
      return anime.content[season].season_id === `s${seasonId}`;
    });

    if (!seasonKey) return ctx.reply('Invalid season ID');

    const epKey = `Episode ${episodeNumber}`;
    const episode = anime.content[seasonKey].episodes[epKey];
    if (!episode) return ctx.reply('Invalid episode number');

    const buttons = [];

    for (const quality in episode.qualities) {
      const q = episode.qualities[quality];
      if (!q || !q.file_id) continue;

      const label = `${quality} [${q.file_size}]`;
      const callbackData = `${animeCode}_${seasonId}_${episodeNumber}_${quality}_${encodeURIComponent(animeName)}_${encodeURIComponent(seasonKey)}`;
      buttons.push({ text: label, callback_data: callbackData });
    }

    if (buttons.length === 0) return ctx.reply('No available qualities for this episode.');

    return ctx.reply('Select quality:', {
      reply_markup: {
        inline_keyboard: [buttons]
      }
    });
  }

  ctx.reply('Anime not found');
}

export async function handleDeeplink3Callback(ctx) {
  const data = ctx.callbackQuery.data; // "animeCode_seasonId_episodeId_quality_animeName_seasonKey"
  const parts = data.split('_');

  if (parts.length < 6) return ctx.reply('Invalid callback data');

  const [animeCode, seasonId, episodeId, quality, rawTitle, rawSeasonKey] = parts;
  const title = decodeURIComponent(rawTitle);
  const seasonKey = decodeURIComponent(rawSeasonKey);

  const anime = episodeData.anime_list[title];
  if (!anime || String(anime.anime_id) !== animeCode) return ctx.reply('Invalid anime');

  const season = anime.content[seasonKey];
  if (!season || season.season_id !== `s${seasonId}`) return ctx.reply('Invalid season');

  const ep = season.episodes[`Episode ${episodeId}`];
  if (!ep) return ctx.reply('Invalid episode');

  const q = ep.qualities[quality];
  if (!q || !q.file_id) return ctx.reply('Invalid quality');

  const caption = `🎬 *${title}* – *${seasonKey}*\n📺 Episode ${episodeId}\n🎞 Quality: ${quality}\n📦 Size: ${q.file_size}`;

  // Update DB when user selects a quality
  const user_id = ctx.from.id;
  const recentsEntry = {
    anime_id: animeCode,
    anime_title: title,
    season_id: `s${seasonId}`,
    episode_number: Number(episodeId),
    quality: quality
  };

  await updateUserData(user_id, { recents: [recentsEntry] });

  await ctx.answerCbQuery();
  return ctx.replyWithVideo(q.file_id, {
    caption,
    parse_mode: 'Markdown'
  });
}

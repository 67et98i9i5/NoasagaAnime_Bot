const fs = require('fs');
const path = require('path');

const episodeDataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(episodeDataPath, 'utf-8'));

function handleDeeplink(ctx, payload) {
  const [animeCode, seasonId, episodeNumber] = payload.split('_');

  for (const animeName in episodeData.anime_list) {
    const anime = episodeData.anime_list[animeName];
    if (anime.anime_id !== animeCode) continue;

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

async function handleCallback(ctx) {
  const data = ctx.callbackQuery.data; // "animeCode_seasonId_episodeId_quality_animeName_seasonKey"
  const parts = data.split('_');

  if (parts.length < 6) return ctx.reply('Invalid callback data');

  const [animeCode, seasonId, episodeId, quality, rawTitle, rawSeasonKey] = parts;
  const title = decodeURIComponent(rawTitle);
  const seasonKey = decodeURIComponent(rawSeasonKey);

  const anime = episodeData.anime_list[title];
  if (!anime || anime.anime_id !== animeCode) return ctx.reply('Invalid anime');

  const season = anime.content[seasonKey];
  if (!season || season.season_id !== `s${seasonId}`) return ctx.reply('Invalid season');

  const ep = season.episodes[`Episode ${episodeId}`];
  if (!ep) return ctx.reply('Invalid episode');

  const q = ep.qualities[quality];
  if (!q || !q.file_id) return ctx.reply('Invalid quality');

  const caption = `🎬 *${title}* – *${seasonKey}*\n📺 Episode ${episodeId}\n🎞 Quality: ${quality}\n📦 Size: ${q.file_size}`;

  await ctx.answerCbQuery();
  return ctx.replyWithVideo(q.file_id, {
    caption,
    parse_mode: 'Markdown'
  });
}

module.exports = {
  handleDeeplink3: handleDeeplink,
  handleDeeplink3Callback: handleCallback
};

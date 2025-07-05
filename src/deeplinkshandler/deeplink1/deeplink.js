const handleSendFile = require('../../helpers/anime/handleSendFile');
const fs = require('fs');
const path = require('path');
const dataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

module.exports = async function handleDeeplink(ctx, payload) {
  const parts = payload.split('_');

  if (parts.length !== 4) {
    return ctx.reply('Invalid deeplink format.');
  }

  const [animeCode, seasonIdRaw, episodeNum, quality] = parts;
  const seasonId = seasonIdRaw.startsWith('s') ? seasonIdRaw : `s${seasonIdRaw}`;

  let matchedTitle = null;
  let seasonKey = null;

  for (const [title, anime] of Object.entries(episodeData.anime_list)) {
    if (String(anime.anime_id) === animeCode) {
      matchedTitle = title;

      for (const [key, season] of Object.entries(anime.content)) {
        if (season.season_id === seasonId) {
          seasonKey = key;
          break;
        }
      }

      break;
    }
  }

  if (!matchedTitle || !seasonKey) {
    return ctx.reply('Invalid deeplink reference.');
  }

  return handleSendFile(
    ctx,
    animeCode,
    seasonId,
    episodeNum,
    quality,
    matchedTitle,
    seasonKey
  );
};

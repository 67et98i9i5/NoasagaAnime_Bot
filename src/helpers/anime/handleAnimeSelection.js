const fs = require('fs');
const path = require('path');
const { updateUserRecents } = require('../../state/userStateCache');

const dataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

module.exports = async function handleAnimeSelection(ctx, rawTitle) {
  const title = decodeURIComponent(rawTitle);
  const animeList = episodeData.anime_list;

  let anime = animeList[title];
  let matchedTitle = title;

  if (!anime) {
    const key = Object.keys(animeList).find(k => k.toLowerCase() === title.toLowerCase());
    if (key) {
      anime = animeList[key];
      matchedTitle = key;
    }
  }

  if (!anime) return ctx.editMessageText('Anime not found.');

  const userId = String(ctx.from.id);
  const animeId = anime.anime_id;

  updateUserRecents(userId, {
    anime_id: animeId,
    title: matchedTitle,
    last_accessed: Date.now()
  });

  const seasons = Object.keys(anime.content);
  if (seasons.length === 0) return ctx.editMessageText('No seasons found.');

  const buttons = seasons.map(season => [
    {
      text: season,
      callback_data: `season_${encodeURIComponent(matchedTitle)}_${encodeURIComponent(season)}`
    }
  ]);

  await ctx.editMessageText(`Select a season for ${matchedTitle}:`, {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
};

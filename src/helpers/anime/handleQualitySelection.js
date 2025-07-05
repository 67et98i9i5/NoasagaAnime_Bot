const fs = require('fs');
const path = require('path');
const dataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

module.exports = async function handleQualitySelection(ctx, animeId, seasonId, episodeNum, title, seasonKey) {
  const anime = episodeData.anime_list[title];
  if (!anime) return ctx.editMessageText('Anime not found.');

  const season = anime.content[seasonKey];
  if (!season) return ctx.editMessageText('Season not found.');

  const episode = Object.values(season.episodes).find(e => e.ep_number === episodeNum);
  if (!episode) return ctx.editMessageText('Episode not found.');

  const qualityButtons = [];

  for (const quality in episode.qualities) {
    const q = episode.qualities[quality];
    qualityButtons.push([
      {
        text: `${quality} [${q.file_size}]`,
        callback_data: `sendfile_${animeId}_${seasonId}_${episodeNum}_${quality}_${encodeURIComponent(title)}_${encodeURIComponent(seasonKey)}`
      }
    ]);
  }

  await ctx.editMessageText(
    `*Select quality for Ep ${episodeNum} – ${title} ${seasonKey}*`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: qualityButtons
      }
    }
  );
};

const fs = require('fs');
const path = require('path');
const dataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function pad(num) {
  return num.toString().padStart(2, '0');
}

module.exports = async function handleSeasonSelection(ctx, rawTitle, rawSeasonKey, page = 1) {
  try {
    const title = decodeURIComponent(rawTitle);
    const seasonKey = decodeURIComponent(rawSeasonKey);

    const anime = episodeData.anime_list[title];
    if (!anime) return ctx.editMessageText('Anime not found.');

    const season = anime.content[seasonKey];
    if (!season) return ctx.editMessageText('Season not found.');

    const sortedEpisodes = Object.values(season.episodes)
      .sort((a, b) => parseInt(a.ep_number) - parseInt(b.ep_number));

    const perPage = 20;
    const totalPages = Math.ceil(sortedEpisodes.length / perPage);
    if (page < 1 || page > totalPages) return ctx.editMessageText('Invalid page.');

    const start = (page - 1) * perPage;
    const currentSlice = sortedEpisodes.slice(start, start + perPage);

    const leftColumn = currentSlice.slice(0, 10);
    const rightColumn = currentSlice.slice(10, 20);

    const buttons = [];
    for (let i = 0; i < 10; i++) {
      const row = [];

      const left = leftColumn[i];
      const right = rightColumn[i];

      if (left) {
        row.push({
          text: `Ep ${pad(left.ep_number)}`,
          callback_data: `quality_${anime.anime_id}_${season.season_id}_${left.ep_number}_${encodeURIComponent(title)}_${encodeURIComponent(seasonKey)}`
        });
      }

      if (right) {
        row.push({
          text: `Ep ${pad(right.ep_number)}`,
          callback_data: `quality_${anime.anime_id}_${season.season_id}_${right.ep_number}_${encodeURIComponent(title)}_${encodeURIComponent(seasonKey)}`
        });
      }

      if (row.length) buttons.push(row);
    }

    const navRow = [];
    if (page > 1) {
      navRow.push({
        text: '◀ Prev',
        callback_data: `episodes_${encodeURIComponent(title)}_${encodeURIComponent(seasonKey)}_${page - 1}`
      });
    }
    if (page < totalPages) {
      navRow.push({
        text: 'Next ▶',
        callback_data: `episodes_${encodeURIComponent(title)}_${encodeURIComponent(seasonKey)}_${page + 1}`
      });
    }
    if (navRow.length) buttons.push(navRow);

    await ctx.editMessageText(
      `*${title}* – *${seasonKey}*\nSelect an episode:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );
  } catch (err) {
    ctx.editMessageText('Failed to load episodes.');
    console.error(err);
  }
};

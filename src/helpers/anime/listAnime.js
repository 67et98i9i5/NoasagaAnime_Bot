const fs = require('fs');
const path = require('path');
const dataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

module.exports = async function listAnime(ctx, page = 1) {
  const animeNames = Object.keys(episodeData.anime_list);
  const perPage = 10;
  const totalPages = Math.ceil(animeNames.length / perPage);

  if (page < 1 || page > totalPages) {
    return ctx.editMessageText('Invalid anime page.');
  }

  const start = (page - 1) * perPage;
  const slice = animeNames.slice(start, start + perPage);

  const buttons = slice.map(title => {
    return [{ text: title, callback_data: `anime_${encodeURIComponent(title)}` }];
  });

  const nav = [];
  if (page > 1) nav.push({ text: '◀ Prev', callback_data: `animepage_${page - 1}` });
  if (page < totalPages) nav.push({ text: 'Next ▶', callback_data: `animepage_${page + 1}` });
  if (nav.length) buttons.push(nav);

  await ctx.editMessageText(
    '*Select an anime:*',
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons }
    }
  );
};

const fs = require('fs');
const path = require('path');
const dataPath = path.resolve(__dirname, '../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

module.exports = async function processSearchInput(ctx) {
  const query = ctx.message.text.toLowerCase();
  const results = [];

  for (const title in episodeData.anime_list) {
    if (title.toLowerCase().includes(query)) {
      results.push(title);
    }
  }

  if (results.length === 0) {
    return ctx.reply('No results found.');
  }

  const topResults = results.slice(0, 10).map(title => [{
    text: title,
    callback_data: `anime_${encodeURIComponent(title)}`
  }]);

  await ctx.reply('Search results:', {
    reply_markup: {
      inline_keyboard: topResults
    }
  });
};

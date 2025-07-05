const fs = require('fs');
const path = require('path');
const dataPath = path.resolve(__dirname, '../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

module.exports = async function handleSearch(ctx) {
  await ctx.reply('Enter anime name to search:', {
    reply_markup: { force_reply: true }
  });
};

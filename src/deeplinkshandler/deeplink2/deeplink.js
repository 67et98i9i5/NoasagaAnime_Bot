const fs = require('fs');
const path = require('path');

const episodeDataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(episodeDataPath, 'utf-8'));

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleDeeplink(ctx, payload) {
  const [animeCode, seasonId, quality] = payload.split('_');

  let found = false;

  for (const animeName in episodeData.anime_list) {
    const anime = episodeData.anime_list[animeName];

    if (anime.anime_id !== animeCode) continue;

    const seasonKey = Object.keys(anime.content).find(season => {
      return anime.content[season].season_id === `s${seasonId}`;
    });

    if (!seasonKey) {
      ctx.reply('Invalid season ID');
      return;
    }

    const episodes = anime.content[seasonKey].episodes;

    const sortedEpisodes = Object.keys(episodes)
      .sort((a, b) => {
        const aNum = parseInt(episodes[a].ep_number);
        const bNum = parseInt(episodes[b].ep_number);
        return aNum - bNum;
      });

    for (const epKey of sortedEpisodes) {
      const ep = episodes[epKey];
      const qualityObj = ep.qualities[quality];

      if (!qualityObj) continue;

      const { file_url, file_id, file_unique_id, file_size } = qualityObj;

      const caption = `🎬 *${animeName}* – *${seasonKey}*\n📺 Episode ${ep.ep_number}\n🎞 Quality: ${quality}\n📦 Size: ${file_size}`;

      await ctx.replyWithVideo(file_id, {
        caption,
        parse_mode: 'Markdown'
      });

      await delay(200);
    }

    found = true;
    break;
  }

  if (!found) {
    ctx.reply('Anime not found');
  }
}

module.exports = handleDeeplink;

const fs = require('fs');
const path = require('path');
const dataPath = path.resolve(__dirname, '../../../data/EpisodeData.json');
const episodeData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const { updateUserRecents } = require('../../state/userStateCache');

module.exports = async function handleSendFile(ctx, animeId, seasonId, episodeNum, quality, title, seasonKey) {
  console.log(`[handleSendFile] START -> animeId: ${animeId}, seasonId: ${seasonId}, ep: ${episodeNum}, quality: ${quality}, title: ${title}, seasonKey: ${seasonKey}`);

  let anime = episodeData.anime_list[title];
  let actualTitle = title;

  // If title not found or doesn't match animeId, fallback to animeId lookup
  if (!anime || String(anime.anime_id) !== String(animeId)) {
    const entry = Object.entries(episodeData.anime_list).find(
      ([, val]) => String(val.anime_id) === String(animeId)
    );

    if (!entry) {
      console.log(`[handleSendFile] Anime not found for ID: ${animeId}`);
      return ctx.reply('Anime not found.');
    }

    actualTitle = entry[0];
    anime = entry[1];
    console.log(`[handleSendFile] Found title by ID: ${actualTitle}`);
  }

  const normalizedSeasonId = seasonId.startsWith('s') ? seasonId : `s${seasonId}`;

  const season = Object.entries(anime.content).find(
    ([seasonKey, seasonData]) => seasonData.season_id === normalizedSeasonId
  )?.[1];

  if (!season) {
    console.log(`[handleSendFile] Season not found: ${seasonId}`);
    return ctx.reply('Season not found.');
  }

  const episode = Object.values(season.episodes).find(e => e.ep_number === episodeNum);
  if (!episode) {
    console.log(`[handleSendFile] Episode not found: ${episodeNum}`);
    return ctx.reply('Episode not found.');
  }

  const q = episode.qualities[quality];
  if (!q || !q.file_id) {
    console.log(`[handleSendFile] Quality not available: ${quality}`);
    return ctx.reply('Quality not available.');
  }

  const epNumInt = parseInt(episodeNum);

  const nextEp = Object.values(season.episodes)
    .map(e => parseInt(e.ep_number))
    .filter(n => n > epNumInt)
    .sort((a, b) => a - b)[0];

  const prevEp = Object.values(season.episodes)
    .map(e => parseInt(e.ep_number))
    .filter(n => n < epNumInt)
    .sort((a, b) => b - a)[0];

  const buttons = [];

  if (nextEp) {
    buttons.push([{
      text: `▶ Continue – Ep ${String(nextEp).padStart(2, '0')}`,
      callback_data: `quality_${animeId}_${normalizedSeasonId}_${nextEp}_${encodeURIComponent(actualTitle)}_${encodeURIComponent(seasonKey)}`
    }]);
  }

  if (prevEp) {
    buttons.push([{
      text: `⏪ Previous – Ep ${String(prevEp).padStart(2, '0')}`,
      callback_data: `quality_${animeId}_${normalizedSeasonId}_${prevEp}_${encodeURIComponent(actualTitle)}_${encodeURIComponent(seasonKey)}`
    }]);
  }

  const videoCaption = `🎬 *${actualTitle}* – *${seasonKey}*\n📺 Episode ${episode.ep_number}`;
  const detailText = `🎞 Quality: ${quality}\n📦 Size: ${q.file_size}`;

  try {
    if (ctx.callbackQuery?.message?.video) {
      console.log(`[handleSendFile] Deleting previous video message: ${ctx.callbackQuery.message.message_id}`);
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    }
  } catch (err) {
    console.log(`[handleSendFile] Failed to delete video message: ${err.message}`);
  }

  console.log(`[handleSendFile] Sending video with file_id: ${q.file_id}`);
  const sentVideo = await ctx.replyWithVideo(q.file_id, {
    caption: videoCaption,
    parse_mode: 'Markdown'
  });

  console.log(`[handleSendFile] Sending episode details and navigation buttons`);
  await ctx.reply(detailText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });

  try {
    const oldMsgId = ctx.callbackQuery?.message?.message_id;
    if (oldMsgId && oldMsgId !== sentVideo.message_id) {
      console.log(`[handleSendFile] Cleaning up extra message: ${oldMsgId}`);
      await ctx.deleteMessage(oldMsgId);
    }
  } catch (err) {
    console.log(`[handleSendFile] Failed to clean up extra message: ${err.message}`);
  }

  const userId = String(ctx.from.id);
  console.log(`[handleSendFile] Updating user recents for user ${userId}`);

  await updateUserRecents(userId, {
    anime_id: animeId,
    anime_title: actualTitle,
    season_id: normalizedSeasonId,
    season_name: seasonKey,
    episode_number: episodeNum,
    quality,
    last_accessed: Date.now()
  });

  console.log(`[handleSendFile] END`);
};

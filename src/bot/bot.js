// src/bot/bot.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Telegraf } = require('telegraf');

const connectDB = require('../../db/mongo');
const User = require('../../db/models/User'); // <- Ensure this path is correct
const registerUser = require('../helpers/registerUser');

const handleDeeplink = require('../deeplinkshandler/deeplink1/deeplink');
const handleDeeplink2 = require('../deeplinkshandler/deeplink2/deeplink');
const { handleDeeplink3, handleDeeplink3Callback } = require('../deeplinkshandler/deeplink3/deeplink');

const listAnime = require('../helpers/anime/listAnime');
const handleAnimeSelection = require('../helpers/anime/handleAnimeSelection');
const handleSeasonSelection = require('../helpers/anime/handleSeasonSelection');
const handleQualitySelection = require('../helpers/anime/handleQualitySelection');
const handleSendFile = require('../helpers/anime/handleSendFile');

const handleSearch = require('../searchbar/searchHandler');
const processSearchInput = require('../searchbar/processSearchInput');

const { flushUserStatesToDB } = require('../state/syncScheduler');
const { setUserState } = require('../state/userStateCache');

const bot = new Telegraf(process.env.BOT_TOKEN);
connectDB();

bot.start(async (ctx) => {
  await registerUser(ctx);

  // Restore user's cache state from DB
  const userId = String(ctx.from.id);
  try {
    const userData = await User.findOne({ user_id: userId }).lean();
    if (userData) setUserState(userId, userData);
  } catch (err) {
    console.error(`[bot] Failed to load user cache: ${err.message}`);
  }

  const payload = ctx.startPayload;
  if (payload) {
    const parts = payload.split('_');
    const animeCode = parts[0];
    const seasonRaw = parts[1];
    const seasonId = seasonRaw.startsWith('s') ? seasonRaw.slice(1) : seasonRaw;

    if (parts.length === 4) {
      return handleDeeplink(ctx, `${animeCode}_${seasonId}_${parts[2]}_${parts[3]}`);
    }
    if (parts.length === 3) {
      const third = parts[2];
      if (/^\d+p$/i.test(third)) return await handleDeeplink2(ctx, `${animeCode}_${seasonId}_${third}`);
      if (/^\d+$/.test(third)) return handleDeeplink3(ctx, `${animeCode}_${seasonId}_${third}`);
    }
    if (parts.length === 2) {
      return await handleDeeplink2(ctx, `${animeCode}_${seasonId}`);
    }
    return ctx.reply('Invalid deeplink format');
  }

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Search Bar', callback_data: 'search_bar' }],
        [{ text: 'Anime List', callback_data: 'anime_list' }],
        [
          { text: 'Personal Stuff', callback_data: 'personal_stuff' },
          { text: 'Leaderboard', callback_data: 'leaderboard' }
        ],
        [{ text: 'Settings', callback_data: 'settings' }]
      ]
    }
  };

  await ctx.editMessageText?.('Choose an option below:').catch(() =>
    ctx.reply('Choose an option below:', keyboard)
  );
});

bot.action('search_bar', handleSearch);

bot.action('anime_list', async (ctx) => {
  await ctx.answerCbQuery();
  await listAnime(ctx);
});

bot.action(/^anime_(.+)$/, async (ctx) => {
  const rawTitle = ctx.match[1];
  const title = decodeURIComponent(rawTitle);
  await handleAnimeSelection(ctx, title);
});

bot.action(/^season_(.+)_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const [title, seasonKey] = [ctx.match[1], ctx.match[2]];
  await handleSeasonSelection(ctx, title, seasonKey);
});

bot.action(/^episodes_/, async (ctx) => {
  const data = ctx.callbackQuery.data;
  const [, rawTitle, rawSeason, rawPage] = data.split('_');
  const title = decodeURIComponent(rawTitle);
  const season = decodeURIComponent(rawSeason);
  const page = parseInt(rawPage);
  await handleSeasonSelection(ctx, title, season, page);
});

bot.action('personal_stuff', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('Personal dashboard Coming Soon...');
});

bot.action('leaderboard', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('Leaderboard coming soon.');
});

bot.action('settings', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('Settings panel coming soon.');
});

bot.on('message', async (ctx, next) => {
  if (ctx.message.reply_to_message?.text === 'Enter anime name to search:') {
    return processSearchInput(ctx);
  }
  return next();
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith('quality_')) {
    const [, animeId, seasonId, ep, title, seasonKey] = data.split('_');
    await handleQualitySelection(ctx, animeId, seasonId, ep, decodeURIComponent(title), decodeURIComponent(seasonKey));
    return;
  }

  if (data.startsWith('sendfile_')) {
    const [, animeId, seasonId, ep, quality, title, seasonKey] = data.split('_');
    await handleSendFile(ctx, animeId, seasonId, ep, quality, decodeURIComponent(title), decodeURIComponent(seasonKey));
    return;
  }

  await handleDeeplink3Callback(ctx);
});

(async () => {
  try {
    await bot.launch();
    console.log('Bot is running');
  } catch (err) {
    console.error('Bot launch failed:', err);
  }
})();

// Auto flush cache to DB every 5 seconds
setInterval(flushUserStatesToDB, 5000);

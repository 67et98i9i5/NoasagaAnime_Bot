// File: src/helpers/leaderboard/leaderboard.js

const { Markup } = require('telegraf');

const leaderboardKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('👤 User Leaderboard', 'leaderboard_users'),
    Markup.button.callback('🎬 Anime Leaderboard', 'leaderboard_anime')
  ]
]);

async function handleLeaderboard(ctx) {
  try {
    const oldText = ctx.update.callback_query.message.text;
    const newText = '*🏆 Leaderboards*\n\nChoose a leaderboard to view:';

    const oldMarkup = JSON.stringify(ctx.update.callback_query.message.reply_markup);
    const newMarkup = JSON.stringify(leaderboardKeyboard.reply_markup);

    if (oldText !== newText || oldMarkup !== newMarkup) {
      await ctx.editMessageText(newText, {
        parse_mode: 'Markdown',
        reply_markup: leaderboardKeyboard.reply_markup
      });
    }
  } catch (_) {}
}

module.exports = handleLeaderboard;

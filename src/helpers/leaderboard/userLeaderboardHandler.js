// File: src/helpers/leaderboard/userLeaderboardHandler.js

const User = require('../../../db/models/User');
const renderUserLeaderboard = require('./renderUserLeaderboard');

const leaderboardKeyboard = {
  inline_keyboard: [
    [
      { text: '👤 User Leaderboard', callback_data: 'leaderboard_users' },
      { text: '🎬 Anime Leaderboard', callback_data: 'leaderboard_anime' }
    ]
  ]
};

module.exports = async function handleUserLeaderboard(ctx) {
  const users = await User.find({}).lean();

  users.sort((a, b) => {
    const ra = a.recents?.length || 0;
    const rb = b.recents?.length || 0;
    if (rb !== ra) return rb - ra;
    return (b.session_count || 0) - (a.session_count || 0);
  });

  const topUsers = users.slice(0, 10);
  const userMap = {};

  await Promise.all(
    topUsers.map(async (u) => {
      try {
        const tgUser = await ctx.telegram.getChat(u.user_id);
        userMap[u.user_id] = {
          name:
            tgUser.username ||
            tgUser.first_name ||
            tgUser.last_name ||
            `User ${u.user_id}`
        };
      } catch {
        userMap[u.user_id] = {
          name: `User ${u.user_id}`
        };
      }
    })
  );

  const msg = renderUserLeaderboard(topUsers, userMap);

  const oldText = ctx.update.callback_query.message.text;
  const oldMarkup = JSON.stringify(ctx.update.callback_query.message.reply_markup);
  const newMarkup = JSON.stringify(leaderboardKeyboard);

  if (msg !== oldText || newMarkup !== oldMarkup) {
    try {
      await ctx.editMessageText(msg, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: leaderboardKeyboard
      });
    } catch (_) {}
  }
};

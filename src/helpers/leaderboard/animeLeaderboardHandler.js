module.exports = async function handleAnimeLeaderboard(ctx) {
  await ctx.editMessageText('*📊 Anime Leaderboard Coming Soon...*', {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👤 User Leaderboard', callback_data: 'leaderboard_users' },
          { text: '🎬 Anime Leaderboard', callback_data: 'leaderboard_anime' }
        ]
      ]
    }
  });
};

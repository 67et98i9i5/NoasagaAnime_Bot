module.exports = function renderUserLeaderboard(users, userMap) {
  if (!users.length) return 'No user data available.';

  let msg = '*🏆 Top Users by Anime Watched*\n\n';

  users.forEach((user, i) => {
    const recents = user.recents?.length || 0;
    const tgInfo = userMap[user.user_id] || {};
    const name = tgInfo.name || `User ${user.user_id}`;

    msg += `*${i + 1}. ${name}*\n`;
    msg += `   └ 🎬 *${recents}* anime watched\n\n`;
  });

  return msg;
};

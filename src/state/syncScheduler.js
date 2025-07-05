const mongoose = require('mongoose');
const User = require('../../db/models/User');
const { userStateCache } = require('./userStateCache');

async function flushUserStatesToDB() {
  const userIds = Object.keys(userStateCache);
  for (const userId of userIds) {
    const state = userStateCache[userId];
    if (!state.__dirty) continue;

    try {
      const userDoc = await User.findOne({ user_id: userId });
      if (!userDoc) continue;

      const existingRecents = userDoc.recents || [];
      const updatedRecents = state.recents;

      // Create composite key: anime_id + season_id
      const recentsMap = new Map();

      for (const entry of existingRecents) {
        if (entry.anime_id && entry.season_id) {
          const key = `${entry.anime_id}_${entry.season_id}`;
          recentsMap.set(key, entry);
        }
      }

      for (const entry of updatedRecents) {
        if (entry.anime_id && entry.season_id) {
          const key = `${entry.anime_id}_${entry.season_id}`;
          recentsMap.set(key, {
            ...entry,
            last_updated: new Date()
          });
        }
      }

      const finalRecents = Array.from(recentsMap.values());

      await User.updateOne(
        { user_id: userId },
        {
          $set: {
            recents: finalRecents,
            __cache_sync: true,
            __last_cache_sync: new Date(),
            last_updated: new Date()
          }
        },
        { strict: false }
      );

      console.log(`[syncScheduler] Synced user: ${userId}`);
      state.__dirty = false;
    } catch (err) {
      console.error(`[syncScheduler] Failed to sync user ${userId}: ${err.message}`);
    }
  }
}

setInterval(flushUserStatesToDB, 5000); // every 5 seconds

module.exports = { flushUserStatesToDB };

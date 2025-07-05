const userStateCache = {};

/**
 * Ensure a user has a cache entry
 */
function ensureUserState(userId) {
  if (!userStateCache[userId]) {
    userStateCache[userId] = {
      recents: [],
      currently_watching: {},
      completed: [],
      __dirty: false
    };
    console.log(`[userStateCache] Initialized cache for user ${userId}`);
  }
}

/**
 * Add or update anime+season in recents
 */
function updateUserRecents(userId, animeInfo) {
  ensureUserState(userId);

  const recents = userStateCache[userId].recents;
  const existingIndex = recents.findIndex(
    r => r.anime_id === animeInfo.anime_id && r.season_id === animeInfo.season_id
  );

  if (existingIndex !== -1) {
    recents[existingIndex] = { ...recents[existingIndex], ...animeInfo };
    console.log(`[userStateCache] Updated recent: ${animeInfo.anime_title} (User: ${userId})`);
  } else {
    recents.push(animeInfo);
    console.log(`[userStateCache] Added to recents: ${animeInfo.anime_title} (User: ${userId})`);
  }

  userStateCache[userId].__dirty = true;
}

/**
 * Update user's watching progress or move to completed
 */
function updateUserProgress(userId, data) {
  ensureUserState(userId);

  const { anime_id, anime_title, season_id, episode, total_eps } = data;
  const episodeInt = parseInt(episode);
  const total = parseInt(total_eps);

  if (episodeInt >= total) {
    delete userStateCache[userId].currently_watching[anime_id];
    if (!userStateCache[userId].completed.includes(anime_id)) {
      userStateCache[userId].completed.push(anime_id);
    }
    console.log(`[userStateCache] Marked anime as completed: ${anime_title} (User: ${userId})`);
  } else {
    userStateCache[userId].currently_watching[anime_id] = {
      anime_title,
      season_id,
      episode: episodeInt,
      last_updated: new Date()
    };
    console.log(`[userStateCache] Updated progress: ${anime_title} → Ep ${episode} (User: ${userId})`);
  }

  userStateCache[userId].__dirty = true;
}

/**
 * Bootstrap from DB
 */
function setUserState(userId, state) {
  userStateCache[userId] = {
    recents: Array.isArray(state.recents) ? [...state.recents] : [],
    currently_watching: { ...state.currently_watching },
    completed: Array.isArray(state.completed) ? [...state.completed] : [],
    __dirty: false
  };
  console.log(`[userStateCache] Bootstrapped state for user ${userId}`);
}

module.exports = {
  userStateCache,
  updateUserRecents,
  updateUserProgress,
  setUserState
};

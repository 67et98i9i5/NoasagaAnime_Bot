// src/db/dbUpdate.js
import UserData from './models/User.js';

/**
 * Ensures a user record exists and updates it with consistent defaults.
 * Prevents duplicate recents or redundant inserts.
 */
export async function updateUserData(user_id, newData = {}) {
  try {
    const defaults = {
      session_count: 0,
      source: null,
      recents: [],
      settings: {
        auto_next: false,
        default_quality: null,
        notifications: {
          new_episodes: false,
          new_anime: false,
          selected_anime: []
        }
      },
      user_tags: {},
      user_stats: {
        total_watched_episodes: 0,
        total_completed_anime: 0,
        total_minutes_watched: 0
      },
      start_method: null
    };

    const existingUser = await UserData.findOne({ user_id });

    if (!existingUser) {
      const newUser = new UserData({
        user_id,
        ...defaults,
        ...newData,
        last_updated: new Date()
      });
      await newUser.save();
      return { status: 'created', user: newUser };
    }

    // Prevent duplicate recents
    if (newData.recents && newData.recents.length > 0) {
      const filteredRecents = newData.recents.filter((entry) => {
        return !existingUser.recents.some(
          (r) =>
            r.anime_id === entry.anime_id &&
            r.season_id === entry.season_id &&
            r.episode_number === entry.episode_number &&
            r.quality === entry.quality
        );
      });

      if (filteredRecents.length > 0) {
        existingUser.recents.push(...filteredRecents);
      }
    }

    Object.assign(existingUser, {
      ...defaults,
      ...newData,
      last_updated: new Date()
    });

    await existingUser.save();
    return { status: 'updated', user: existingUser };
  } catch (err) {
    console.error('Error updating user data:', err);
    return { status: 'error', error: err.message };
  }
}

const mongoose = require('mongoose');

const NoasagaUserData = new mongoose.Schema({
  user_id: { type: Number, required: true, unique: true },
  session_count: { type: Number, default: 0 },

  recents: {
    type: [
      {
        anime_id: { type: String, required: true },
        anime_title: { type: String, required: true },
        season_id: { type: String, required: true },
        episode_number: { type: Number },
        quality: { type: String },
        last_updated: { type: Date, default: Date.now }
      }
    ],
    default: []
  },

  completed: {
    type: [
      {
        anime_id: { type: String, required: true },
        anime_title: { type: String, required: true },
        season_id: { type: String },
        completed_on: { type: Date, default: Date.now },
        quality: { type: String }
      }
    ],
    default: []
  },

  settings: {
    auto_next: { type: Boolean, default: false },
    default_quality: { type: String, default: null },
    reset_enabled: {
      recents: { type: String, default: 'enabled' },
      completed: { type: String, default: 'enabled' }
    },
    notifications: {
      new_episodes: { type: Boolean, default: false },
      new_anime: { type: Boolean, default: false },
      selected_anime: { type: [String], default: [] }
    }
  },

  user_tags: {
    type: Map,
    of: {
      tag: String,
      rating: Number
    },
    default: {}
  },

  user_stats: {
    total_watched_episodes: { type: Number, default: 0 },
    total_completed_anime: { type: Number, default: 0 },
    total_minutes_watched: { type: Number, default: 0 }
  },

  start_method: { type: String, default: 'command' },
  source: { type: String, default: null },

  created_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },

  __cache_sync: { type: Boolean, default: false },
  __last_cache_sync: { type: Date, default: null }
});

module.exports = mongoose.model('UserData', NoasagaUserData);

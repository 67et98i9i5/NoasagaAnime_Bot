const User = require('../../db/models/User');

async function registerUser(ctx) {
  const userId = ctx.from.id;

  try {
    const existing = await User.findOne({ user_id: userId });

    if (existing) {
      // Increment session count + update timestamp
      await User.updateOne(
        { user_id: userId },
        {
          $inc: { session_count: 1 },
          $set: { last_updated: new Date() }
        }
      );
      return;
    }

    // New user document
    await User.create({
      user_id: userId,
      session_count: 1,
      created_at: new Date(),
      last_updated: new Date()
    });
  } catch (err) {
    console.error('User registration error:', err);
  }
}

module.exports = registerUser;

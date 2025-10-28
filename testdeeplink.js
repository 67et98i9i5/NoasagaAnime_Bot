import mongoose from 'mongoose';
import handleDeeplink from './src/deeplinkshandler/deeplink2/deeplink.js';

(async () => {
  try {
    await mongoose.connect("mongodb+srv://noasagaproject:XEB7i6f6iEwUDk05@animebotdb.tg9qolm.mongodb.net/NoasagaDB?retryWrites=true&w=majority&appName=AnimeBotDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const mockCtx = {
      reply: (msg) => console.log('Reply:', msg),
      replyWithVideo: (fileId, opts) =>
        console.log(`Sent video: ${fileId}`, opts.caption),
      from: { id: 123456 }, // test user_id
    };

    await handleDeeplink(mockCtx, '67931_1_720p'); // test payload

    console.log('Done');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
  }
})();

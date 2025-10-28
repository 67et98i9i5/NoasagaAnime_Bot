import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import fs from 'fs';
import input from 'input'; // npm i input
import dotenv from 'dotenv';

dotenv.config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession('1BQANOTEuMTA4LjU2LjEwNgG7RNLW7ZAj9NOvLN2KoVIQesRBROQDhAjbACE7TvpVzwWg7CiPrB6h4i4ScCwkFvpQnInsBcI/LNx/azG8AZCpBiWn/NkLImgoJdWQBgl5F1tSLkAyTRUn2S8DDSC7mRZffgOzk8tunaNbumKP7W8Xf2MqNcI8Abfc6k+I6UWt7icbdxSO3+KYc0JAnEuE0HA6FXnx+bAhlvZ4nn+1iVna/Johs/6KfqdPjoVgEfJpNzB+IL0Y4KNQzzZb15omUyf93zcQG4TXaKdBeCrIpv/c7QDdLhheKunpzPhZsnGcGyrLXpNh6hgTF0umoiHRKsy5tbRcSDyXAAQ3EJLes9QWRA==');

(async () => {
  console.log('Connecting...');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text('Enter phone number: '),
    password: async () => await input.text('Enter 2FA password (if any): '),
    phoneCode: async () => await input.text('Enter code: '),
    onError: (err) => console.log(err),
  });

  console.log('Connected.');
  console.log('Session string (save this):');
  console.log(client.session.save());

  const channelId = '-1002345987006';
  const outputFile = `data_${channelId}.json`;
  const allFiles = [];

  let offsetId = 0;
  const limit = 100;

  while (true) {
    const history = await client.invoke(
      new Api.messages.GetHistory({
        peer: channelId,
        offsetId,
        limit,
      })
    );

    if (!history.messages.length) break;

    for (const msg of history.messages) {
      if (!msg.media) continue;
      const m = msg.media;
      if (m.document || m.photo) {
        const file = m.document || m.photo;
        const attrs = file.attributes || [];

        const filenameAttr = attrs.find((a) => a.fileName);
        const fileName = filenameAttr ? filenameAttr.fileName : null;

        allFiles.push({
          id: msg.id,
          type: m.document ? 'document' : 'photo',
          fileName,
          date: msg.date,
          size: file.size || null,
          mimeType: file.mimeType || null,
          caption: msg.message || null,
        });
      }
    }

    offsetId = history.messages[history.messages.length - 1].id;
    if (history.messages.length < limit) break;
  }

  fs.writeFileSync(outputFile, JSON.stringify(allFiles, null, 2));
  console.log(`Saved ${allFiles.length} entries to ${outputFile}`);

  await client.disconnect();
})();

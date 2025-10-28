import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dataDir = path.resolve('data');
const channelsFile = path.join(dataDir, 'channelsJoined.json');
const outputFile = path.join(dataDir, 'channelFilesData.json');

/**
 * Reads all channels from channelsJoined.json
 * Scans each for media files and writes details to channelFilesData.json
 */
export async function scanAllChannels() {
  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH;
  const sessionString = process.env.USER_SESSION;

  if (!apiId || !apiHash || !sessionString) {
    throw new Error('Missing API_ID / API_HASH / USER_SESSION in .env');
  }
  if (!fs.existsSync(channelsFile)) {
    throw new Error('channelsJoined.json not found');
  }

  const channels = JSON.parse(fs.readFileSync(channelsFile, 'utf-8'));
  const results = {};

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5
  });

  await client.connect();

  for (const ch of channels) {
    const channelId = ch.id;
    const title = ch.title || 'unknown';
    const collected = [];

    console.log(`Scanning ${title} (${channelId})...`);

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
        const file = m.document || m.photo;
        if (!file) continue;

        const attrs = file.attributes || [];
        const filenameAttr = attrs.find((a) => a.fileName);
        const fileName = filenameAttr ? filenameAttr.fileName : null;

        collected.push({
          message_id: msg.id,
          file_id: file.id || null,
          file_unique_id: file.accessHash || null,
          type: m.document ? 'document' : 'photo',
          fileName,
          date: msg.date,
          size: file.size || null,
          mimeType: file.mimeType || null,
          caption: msg.message || null,
        });
      }

      offsetId = history.messages[history.messages.length - 1].id;
      if (history.messages.length < limit) break;
    }

    results[channelId] = {
      title,
      total: collected.length,
      files: collected
    };

    console.log(`→ ${title}: ${collected.length} files`);
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  await client.disconnect();
  console.log(`All results saved to ${outputFile}`);

  return Object.keys(results).length;
}

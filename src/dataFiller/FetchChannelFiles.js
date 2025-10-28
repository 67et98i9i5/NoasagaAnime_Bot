import fs from 'fs';
import path from 'path';

// Load channelsJoined.json using fs
const channelsFile = path.resolve('./data/channelsJoined.json');
const channelsData = JSON.parse(fs.readFileSync(channelsFile, 'utf-8'));

const outputFile = path.resolve('./data/channelFilesData.json');
let allFiles = [];

// Load existing data if exists
if (fs.existsSync(outputFile)) {
  allFiles = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
}

export async function handleChannelMessage1(ctx) {
  const msg = ctx.message || ctx.update?.message;
  if (!msg) return;

  // Only process messages from channels in channelsJoined.json
  const channel = channelsData.find(c => c.id === msg.chat.id);
  if (!channel) return;

  const files = [];
  if (msg.document) files.push(msg.document);
  if (msg.video) files.push(msg.video);
  if (msg.audio) files.push(msg.audio);
  if (msg.photo) files.push(msg.photo[msg.photo.length - 1]);

  files.forEach(f => {
    allFiles.push({
      channel_id: msg.chat.id,
      channel_title: msg.chat.title,
      file_id: f.file_id,
      file_name: f.file_name || f.file_unique_id,
      file_size: f.file_size
    });
  });

  // Save after each message
  fs.writeFileSync(outputFile, JSON.stringify(allFiles, null, 2));
}

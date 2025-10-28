import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import fs from "fs";
import path, { join, dirname } from "path";
import { fileURLToPath } from "url";
import { handleChatMembership, handleChannelMessage, startChannelScanner } from "../Scanner/js/scanChannels.js";
import { connectDB } from '../db/mongo.js';
import handleDeeplink from '../deeplinkshandler/deeplink1/deeplink.js';
import handleDeeplink2 from '../deeplinkshandler/deeplink2/deeplink.js';
import { handleDeeplink3, handleDeeplink3Callback } from '../deeplinkshandler/deeplink3/deeplink.js';
import { scanAllChannels } from "../Scanner/js/channelFileScanner.js";

await connectDB();

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
   const payload = ctx.startPayload;
    if (payload) {
      const parts = payload.split('_');
      const animeCode = parts[0];
      const seasonRaw = parts[1];
      const seasonId = seasonRaw.startsWith('s') ? seasonRaw.slice(1) : seasonRaw;
  
      if (parts.length === 4) {
        return handleDeeplink(ctx, `${animeCode}_${seasonId}_${parts[2]}_${parts[3]}`);
      }
      if (parts.length === 3) {
        const third = parts[2];
        if (/^\d+p$/i.test(third)) return await handleDeeplink2(ctx, `${animeCode}_${seasonId}_${third}`);
        if (/^\d+$/.test(third)) return handleDeeplink3(ctx, `${animeCode}_${seasonId}_${third}`);
      }
      if (parts.length === 2) {
        return await handleDeeplink2(ctx, `${animeCode}_${seasonId}`);
      }
      return ctx.reply('Invalid deeplink format');
    }
  
    await ctx.editMessageText?.('Thanks a lot for using our bot! For any other errors or issues, you can message here -> @YourUsername').catch(() =>
      ctx.reply('Thanks a lot for using our bot! For any other errors or issues, you can message here -> @noasagaproject')
    );

});

// Proper __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to settings.json
const settingsPath = join(__dirname, "../../settings/settings.json");

// Check if settings.json exists
if (!fs.existsSync(settingsPath)) {
  console.error("❌ Cannot find settings.json at", settingsPath);
  process.exit(1);
}

bot.command('scanallchannels', async (ctx) => {
  ctx.reply('Starting full scan of all joined channels. This may take several minutes.');

  try {
    const total = await scanAllChannels();
    ctx.reply(`Scan complete. Processed ${total} channels. Data saved to channelFilesData.json`);
  } catch (err) {
    console.error(err);
    ctx.reply(`Error during scan: ${err.message}`);
  }
});


// Read settings
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
const scanInterval = settings.ScanInterval || 60000; // default 60s if missing

// Initialize bot

// Track join/leave events
bot.on("my_chat_member", handleChatMembership);

// Track messages in channels
bot.on("channel_post", handleChannelMessage);

bot.on('channel_post', async (ctx) => {
  await handleChannelMessage(ctx);
});

// Start periodic scanner
startChannelScanner(scanInterval);

// Launch bot
bot.launch();
console.log("🤖 Bot is live! Waiting for channel messages...");

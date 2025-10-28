import fs from "fs";
import path from "path";

const __dirname = path.resolve();

// Path to save channels
const outputPath = path.join(__dirname, "data", "channelsJoined.json");

// Load existing channels
let joinedChannels = [];
if (fs.existsSync(outputPath)) {
  joinedChannels = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
}

// Save channels to file
function saveChannels() {
  fs.writeFileSync(outputPath, JSON.stringify(joinedChannels, null, 2));
}

// Handle join/leave updates
function handleChatMembership(ctx) {
  const chat = ctx.chat;  
  const newStatus = ctx.update.my_chat_member.new_chat_member.status;

  if (chat.type === "channel") {
    if (newStatus === "member" || newStatus === "administrator") {
      if (!joinedChannels.find((c) => c.id === chat.id)) {
        joinedChannels.push({
          id: chat.id,
          title: chat.title,
          username: chat.username || null,
        });
        console.log(`📢 Joined new channel: ${chat.title}`);
        saveChannels();
      }
    } else if (newStatus === "left" || newStatus === "kicked") {
      joinedChannels = joinedChannels.filter((c) => c.id !== chat.id);
      console.log(`🚪 Left channel: ${chat.title}`);
      saveChannels();
    }
  }
}

// Handle messages in channels
function handleChannelMessage(ctx) {
  const chat = ctx.chat;

  // Check if channel is already in joinedChannels
  if (!joinedChannels.find((c) => c.id === chat.id)) {
    joinedChannels.push({
      id: chat.id,
      title: chat.title,
      username: chat.username || null,
    });
    console.log(`📥 Detected channel via message: ${chat.title}`);
    saveChannels();
  }

  // Log the message
  console.log(`📢 Message in channel "${chat.title || chat.id}":`, ctx.channelPost.text || "<non-text message>");
  console.log("✅ Bot confirms it is in this channel!");
}

// Periodic scanner (optional)
function startChannelScanner(scanInterval) {
  console.log("🔁 Channel scanner initialized. Interval:", scanInterval / 1000, "seconds");
  setInterval(() => {
    console.log("🔍 Scanning channels...");
    console.table(joinedChannels);
    saveChannels();
  }, scanInterval);
}

export { handleChatMembership, handleChannelMessage, startChannelScanner };

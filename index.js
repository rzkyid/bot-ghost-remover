const { Client, GatewayIntentBits, ActivityType, joinVoiceChannel } = require('discord.js');
const { createAudioPlayer, createAudioResource, VoiceConnectionStatus } = require('@discordjs/voice');
require('dotenv').config();
const express = require('express');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
});

const app = express();
const port = 3000;
app.get('/', (req, res) => {
  const imagePath = path.join(__dirname, 'index.html');
  res.sendFile(imagePath);
});
app.listen(port, () => {
  console.log('\x1b[36m[ SERVER ]\x1b[0m', '\x1b[32m SH : http://localhost:' + port + ' ✅\x1b[0m');
});

const statusMessages = ["⚠️ Mohon Perhatian", "👥 Bagi Seluruh Warga", "📝 Baca Peraturan Desa!"];
const statusTypes = ['dnd', 'idle'];
let currentStatusIndex = 0;
let currentTypeIndex = 0;

// Fungsi untuk menghubungkan ke voice channel dan bertahan
async function joinAndStayInVoiceChannel() {
  const channel = client.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) {
    console.error("Channel tidak ditemukan.");
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  const player = createAudioPlayer();
  const resource = createAudioResource('path/to/silence.mp3'); // Beri file silence yang berjalan loop

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log("Bot berhasil terhubung ke voice channel.");
    player.play(resource);
  });

  connection.subscribe(player);

  connection.on('stateChange', (oldState, newState) => {
    if (newState.status === VoiceConnectionStatus.Disconnected) {
      console.log("Bot terputus, mencoba reconnect...");
      joinAndStayInVoiceChannel();
    }
  });
}

async function login() {
  try {
    await client.login(process.env.TOKEN);
    console.log('\x1b[36m[ LOGIN ]\x1b[0m', `\x1b[32mLogged in as: ${client.user.tag} ✅\x1b[0m`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[35mBot ID: ${client.user.id} \x1b[0m`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mConnected to ${client.guilds.cache.size} server(s) \x1b[0m`);
    joinAndStayInVoiceChannel();
  } catch (error) {
    console.error('\x1b[31m[ ERROR ]\x1b[0m', 'Failed to log in:', error);
    process.exit(1);
  }
}

function updateStatus() {
  const currentStatus = statusMessages[currentStatusIndex];
  const currentType = statusTypes[currentTypeIndex];
  client.user.setPresence({
    activities: [{ name: currentStatus, type: ActivityType.Custom }],
    status: currentType,
  });
  console.log('\x1b[33m[ STATUS ]\x1b[0m', `Updated status to: ${currentStatus} (${currentType})`);
  currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
  currentTypeIndex = (currentTypeIndex + 1) % statusTypes.length;
}

function heartbeat() {
  setInterval(() => {
    console.log('\x1b[35m[ HEARTBEAT ]\x1b[0m', `Bot is alive at ${new Date().toLocaleTimeString()}`);
  }, 30000);
}

client.once('ready', () => {
  console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`);
  updateStatus();
  setInterval(updateStatus, 10000);
  heartbeat();
});

client.once('ready', () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error("Guild (Server) not found.");
    return;
  }
  
  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) {
    console.error("Voice Channel not found.");
    return;
  }
  
  console.log("Bot is ready and found the channel!");
  channel.join();
});


login();

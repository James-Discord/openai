const Discord = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Discord.Client({
  intents: [
    'GUILD_MESSAGES',
    'GUILD_VOICE_STATES',
    'GUILD_MEMBERS',
    'GUILD_PRESENCES',
    'MESSAGE_CONTENT',
    'MESSAGE_REACTIONS',
    'DIRECT_MESSAGES',
    'DIRECT_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE_TYPING',
  ],
});

const token = 'YOUR_DISCORD_BOT_TOKEN';
const transcriptionsAPI = 'https://api.cattto.repl.co/v1/audio/transcriptions';
const apiKey = 'catto_key_UVSctZHJmQo2IQh0nnfiZUBW';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!start') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.reply('You need to join a voice channel first.');
      return;
    }

    const connection = await joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    const receiver = connection.receiver;

    connection.on('speaking', async (user, speaking) => {
      if (speaking.bitfield === 0 || user.bot) {
        return;
      }
      console.log(`Listening to ${user.username}`);

      const audioStream = await receiver.createStream(user, { mode: 'pcm' });
      const audioBuffer = await audioStream.pipe(fs.createReadStream(`./${user.id}.pcm`)).promise();

      const formData = new FormData();
      formData.append('file', audioBuffer);
      formData.append('model', 'whisper-1');

      const transcriptionResponse = await axios.post(transcriptionsAPI, formData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        },
      });

      const transcription = transcriptionResponse.data.transcription;
      message.channel.send(`Transcription (${user.username}): ${transcription}`);

      fs.unlinkSync(`./${user.id}.pcm`);
    });
  } else if (message.content === '!stop') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.reply('You need to join a voice channel first.');
      return;
    }

    voiceChannel.leave();
    message.reply('Stopped transcribing.');
  }
});

client.login(token);

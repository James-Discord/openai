const Discord = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const client = new Discord.Client();
const token = 'YOUR_DISCORD_BOT_TOKEN';
const transcriptionsAPI = 'https://api.cattto.repl.co/v1/audio/transcriptions';
const apiKey = 'YOUR_API_KEY';

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

    const connection = await voiceChannel.join();
    const receiver = connection.receiver;

    connection.on('speaking', async (user, speaking) => {
      if (speaking.bitfield === 0 || user.bot) {
        return;
      }
      console.log(`Listening to ${user.username}`);

      const audioStream = receiver.createStream(user, { mode: 'pcm' });

      const audioPath = `./${user.id}.pcm`;
      audioStream.pipe(fs.createWriteStream(audioPath));

      audioStream.on('end', async () => {
        try {
          const formData = new FormData();
          formData.append('file', fs.createReadStream(audioPath));
          formData.append('model', 'whisper-1');

          const transcriptionResponse = await axios.post(transcriptionsAPI, formData, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            },
          });

          const transcription = transcriptionResponse.data.transcription;
          message.channel.send(`Transcription (${user.username}): ${transcription}`);
        } catch (error) {
          console.error('Transcription failed:', error.message);
          message.channel.send('Transcription failed.');
        } finally {
          fs.unlinkSync(audioPath);
        }
      });
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

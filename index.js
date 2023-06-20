const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});

app.use(express.json());

app.post('/transcriptions', upload.single('file'), async (req, res) => {
  const { originalname, path: filePath } = req.file;
  const model = req.body.model || 'whisper-1';
  const token = 'catto_key_UVSctZHJmQo2IQh0nnfiZUBW';

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', model);

    console.time('Transcription Time');
    const response = await axios.post(
      'https://api.cattto.repl.co/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        },
      }
    );
    console.timeEnd('Transcription Time');

    res.json(response.data);
  } catch (error) {
    console.error('Transcription failed:', error.message);
    res.status(500).json({ error: 'Transcription failed.' });
  }
});

app.get('/gpt/gpt-3.5turbo', async (req, res) => {
  const { prompt } = req.query;
  const promptMessages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ];
  
  const apiKey = 'catto_key_UVSctZHJmQo2IQh0nnfiZUBW';
  const apiUrl = 'https://api.cattto.repl.co/v1/chat/completions';
  
  try {
    const response = await axios.post(apiUrl, {
      model: 'gpt-3.5-turbo',
      messages: promptMessages,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const generatedResponse = response.data.choices[0].message.content;
    res.json({ response: generatedResponse });
  } catch (error) {
    console.error('OpenAI API request failed:', error.message);
    res.status(500).json({ error: 'OpenAI API request failed.' });
  }
});


app.listen(3000, () => {
  console.log('API server is running on port 3000');
});

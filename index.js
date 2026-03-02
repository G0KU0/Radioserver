// index.js

const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

// Express alkalmazás létrehozása
const app = express();
const port = process.env.PORT || 3000;

// Shoutcast szerver részletei
const shoutcastDetails = {
  ip: 'uk3freenew.listen2myradio.com',
  port: 31822,
  password: '2002',
};

// YouTube videó URL
const youtubeUrl = 'https://www.youtube.com/watch?v=RzRhcnN-2XQ'; // A YouTube videó URL

// YouTube stream áramlásának küldése Shoutcast-ra FFmpeg segítségével
const streamToShoutcast = (youtubeUrl) => {
  const stream = ytdl(youtubeUrl, {
    filter: 'audioonly',
    quality: 'highestaudio',
  });

  ffmpeg()
    .input(stream)
    .inputFormat('mp4') // Az mp4 bemeneti formátumot használjuk a YouTube audiohoz
    .audioCodec('libmp3lame') // MP3 kódolás
    .audioBitrate(128) // MP3 bitráta
    .format('mp3') // Kimeneti formátum
    .output(`http://${shoutcastDetails.ip}:${shoutcastDetails.port}`) // Shoutcast kimeneti cím
    .on('start', () => {
      console.log('Streaming started...');
    })
    .on('error', (err) => {
      console.error('Error:', err);
    })
    .on('end', () => {
      console.log('Streaming ended.');
    })
    .run();
};

// Streaming indítása endpoint
app.get('/start-stream', (req, res) => {
  streamToShoutcast(youtubeUrl);
  res.send('Streaming started...');
});

// Alapértelmezett útvonal
app.get('/', (req, res) => {
  res.send('Welcome to the Radio Stream!');
});

// Express szerver indítása
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

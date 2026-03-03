const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = process.env.PORT || 3000;

// Shoutcast szerver beállítások
const shoutcastDetails = {
  ip: 'uk3freenew.listen2myradio.com',
  port: 31822,
  password: '2002',
};

// YouTube URL
const youtubeUrl = 'https://www.youtube.com/watch?v=RzRhcnN-2XQ'; // A YouTube videó URL

// Funkció, hogy streameljük a YouTube audiót a Shoutcast szerverre
const streamToShoutcast = () => {
  // YouTube stream
  const youtubeStream = ytdl(youtubeUrl, {
    filter: 'audioonly',
    quality: 'highestaudio',
  });

  ffmpeg()
    .input(youtubeStream)
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

// Express route a stream indításához
app.get('/start-stream', (req, res) => {
  streamToShoutcast();
  res.send('Streaming started...');
});

// Alapértelmezett route
app.get('/', (req, res) => {
  res.send('Welcome to the Radio Stream!');
});

// Express szerver indítása
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

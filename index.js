const express = require('express');
const ytdl = require('ytdl-core');
const shoutcastClient = require('shoutcast-client'); // Shoutcast client library
const fs = require('fs');

// Express alkalmazás létrehozása
const app = express();
const port = process.env.PORT || 3000;

// Shoutcast szerver részletei
const shoutcastDetails = {
  ip: 'uk3freenew.listen2myradio.com',
  port: 31822,
  password: '2002',
  mount: '/stream', // Mountpoint, amit a Shoutcast használ
  username: 'admin', // Shoutcast admin felhasználó
};

// YouTube videó URL
const youtubeUrl = 'https://www.youtube.com/watch?v=RzRhcnN-2XQ'; // A YouTube videó URL

// Streamelés a Shoutcast szerverre
const streamToShoutcast = () => {
  const youtubeStream = ytdl(youtubeUrl, {
    filter: 'audioonly',
    quality: 'highestaudio',
  });

  // Shoutcast kliens kapcsolat
  const client = new shoutcastClient.Client({
    host: shoutcastDetails.ip,
    port: shoutcastDetails.port,
    password: shoutcastDetails.password,
    mount: shoutcastDetails.mount,
    username: shoutcastDetails.username,
  });

  client.on('connect', () => {
    console.log('Connected to Shoutcast server');
  });

  client.on('error', (err) => {
    console.error('Shoutcast connection error:', err);
  });

  // Streamelés YouTube-ból a Shoutcast-ra
  youtubeStream.pipe(client);
  
  client.start(() => {
    console.log('Shoutcast streaming started...');
  });

  youtubeStream.on('end', () => {
    console.log('YouTube stream ended.');
    client.stop(); // Ha a stream véget ér, állítsuk le a Shoutcast kapcsolatot
  });
};

// Endpoint a stream indítására
app.get('/start-stream', (req, res) => {
  streamToShoutcast();
  res.send('Streaming started from YouTube...');
});

// Alapértelmezett útvonal
app.get('/', (req, res) => {
  res.send('Welcome to the Radio Stream!');
});

// Express szerver indítása
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

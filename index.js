const express = require('express');
const ytdl = require('ytdl-core');
const net = require('net');  // TCP kapcsolat a Shoutcast szerverhez

// Express alkalmazás
const app = express();
const port = process.env.PORT || 3000;

// Shoutcast szerver beállítások
const shoutcastDetails = {
  ip: 'uk3freenew.listen2myradio.com',
  port: 31822,
  password: '2002',
  mount: '/stream',  // Mount point beállítás
  username: 'admin', // Admin felhasználó
};

// YouTube URL
const youtubeUrl = 'https://www.youtube.com/watch?v=RzRhcnN-2XQ'; // YouTube URL

// Funkció, hogy streameljük a YouTube audiót a Shoutcast szerverre
const streamToShoutcast = () => {
  // YouTube stream
  const youtubeStream = ytdl(youtubeUrl, {
    filter: 'audioonly',
    quality: 'highestaudio',
  });

  // TCP socket kapcsolat a Shoutcast szerverhez
  const socket = net.createConnection(shoutcastDetails.port, shoutcastDetails.ip, () => {
    console.log('Connected to Shoutcast server');
    
    // Hitelesítés és stream mount beállítás
    socket.write(`GET ${shoutcastDetails.mount} HTTP/1.0\r\n`);
    socket.write(`Authorization: Basic ${Buffer.from(shoutcastDetails.username + ':' + shoutcastDetails.password).toString('base64')}\r\n`);
    socket.write(`Content-Type: audio/mpeg\r\n`);
    socket.write('Connection: close\r\n\r\n');
    
    // A YouTube streamet adatfolyamként továbbítjuk a Shoutcast szerverre
    youtubeStream.pipe(socket);
  });

  // Hiba kezelés
  socket.on('error', (err) => {
    console.error('Error:', err);
  });

  // Amikor a stream befejeződik
  youtubeStream.on('end', () => {
    console.log('YouTube stream ended.');
    socket.end();
  });
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

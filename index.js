// Required packages
const express = require('express');
const ytdl = require('ytdl-core');
const shoutcast = require('shoutcast-server');

// Create an Express app
const app = express();
const port = process.env.PORT || 3000;

// Stream YouTube content to Shoutcast server
const streamToShoutcast = (youtubeUrl, shoutcastDetails) => {
  const { ip, port, password } = shoutcastDetails;
  
  // Set up the shoutcast server
  const scServer = shoutcast.createServer({
    ip: ip,
    port: port,
    password: password,
  });

  // Get the YouTube stream
  const youtubeStream = ytdl(youtubeUrl, {
    filter: 'audioonly',
    quality: 'highestaudio',
  });

  // Pipe the YouTube audio to the Shoutcast server
  youtubeStream.pipe(scServer);

  console.log('Streaming YouTube to Shoutcast server...');
  scServer.start();  // Start the Shoutcast server
};

// Example Shoutcast details (replace with the actual info)
const shoutcastDetails = {
  ip: 'uk3freenew.listen2myradio.com',
  port: 31822,
  password: '2002',
};

// Endpoint to start streaming (with a fixed YouTube URL)
app.get('/start-stream', (req, res) => {
  const youtubeUrl = 'https://www.youtube.com/watch?v=RzRhcnN-2XQ';  // YouTube URL

  // Start streaming the YouTube video to Shoutcast server
  streamToShoutcast(youtubeUrl, shoutcastDetails);
  res.send('Streaming started from YouTube...');
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Radio Stream!');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

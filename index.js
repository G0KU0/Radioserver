const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

// --- RENDER PORT BEÁLLÍTÁS ---
const PORT = process.env.PORT || 3000;

// Egyszerű weboldal, hogy a Render ne lője le a botot
app.get('/', (req, res) => {
    res.send('A Rádió Bot vígan fut! 🎵');
});

app.listen(PORT, () => {
    console.log(`Webszerver fut a ${PORT} porton.`);
});

// --- RÁDIÓ ADATOK ---
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = 9411;
const SOURCE_PASS = '2002';

const YOUTUBE_LINKS = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Ide írd a saját linkjeidet
    'https://www.youtube.com/watch?v=5qap5aO4i9A'
];

function playNext() {
    const randomUrl = YOUTUBE_LINKS[Math.floor(Math.random() * YOUTUBE_LINKS.length)];
    console.log(`[AutoDJ] Következő: ${randomUrl}`);

    const stream = ytdl(randomUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    });

    ffmpeg(stream)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .format('mp3')
        .outputOptions([
            '-content_type audio/mpeg',
            '-metadata title="YouTube Auto DJ"'
        ])
        .save(`http://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}`)
        .on('end', () => {
            console.log('Váltás a következő számra...');
            playNext();
        })
        .on('error', (err) => {
            console.error('Hiba:', err.message);
            setTimeout(playNext, 5000);
        });
}

playNext();

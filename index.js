const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

// --- BEÁLLÍTÁSOK ---
const PORT = process.env.PORT || 10000;

// Sütik (Cookie) betöltése az Environment Variable-ből
let agent;
if (process.env.YT_COOKIE) {
    try {
        const cookies = JSON.parse(process.env.YT_COOKIE);
        agent = ytdl.createAgent(cookies);
        console.log(">>> [RENDSZER] Sütik sikeresen betöltve. YouTube hozzáférés OK.");
    } catch (e) {
        console.error(">>> [HIBA] A YT_COOKIE nem érvényes JSON! Ellenőrizd a Render beállításait.");
    }
}

// Webszerver a Render életben tartásához
app.get('/', (req, res) => {
    res.send('<h1>AutoDJ Online 🎵</h1><p>A rádióbot sikeresen fut a Renderen.</p>');
});

app.listen(PORT, () => {
    console.log(`>>> [WEBSZERVER] Fut a ${PORT} porton.`);
});

// --- RÁDIÓ SZERVER ADATOK ---
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = 9411;
const SOURCE_PASS = '2002';

// --- ZENE LISTA ---
const YOUTUBE_LINKS = [
    'https://www.youtube.com/watch?v=RzRhcnN-2XQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
];

function playNext() {
    const randomUrl = YOUTUBE_LINKS[Math.floor(Math.random() * YOUTUBE_LINKS.length)];
    console.log(`>>> [AutoDJ] Következő dal indítása: ${randomUrl}`);

    // YouTube stream kérése a sütikkel (agent)
    const stream = ytdl(randomUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        agent: agent 
    });

    // Átkódolás MP3-ba és küldés a Shoutcast szerverre
    ffmpeg(stream)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .audioFrequency(44100)
        .format('mp3')
        .outputOptions([
            '-content_type audio/mpeg',
            '-metadata title="YouTube Auto DJ"'
        ])
        .save(`http://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}`)
        .on('start', () => {
            console.log('>>> [SZERVER] Csatlakozva a rádióhoz. Adás elindult!');
        })
        .on('end', () => {
            console.log('>>> [AutoDJ] Dal vége, váltás...');
            playNext();
        })
        .on('error', (err) => {
            console.error('>>> [HIBA]', err.message);
            // Hiba esetén 10 másodperc múlva újrapróbálja
            setTimeout(playNext, 10000);
        });
}

// Bot indítása
playNext();

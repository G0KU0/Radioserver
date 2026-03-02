const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

// --- BEÁLLÍTÁSOK ---
const PORT = process.env.PORT || 10000;

// Sütik betöltése és a YouTube ügynök (agent) létrehozása
let agent;
if (process.env.YT_COOKIE) {
    try {
        const cookies = JSON.parse(process.env.YT_COOKIE);
        agent = ytdl.createAgent(cookies);
        console.log(">>> [RENDSZER] Sütik sikeresen betöltve. YouTube hozzáférés OK.");
    } catch (e) {
        console.error(">>> [HIBA] A YT_COOKIE formátuma nem megfelelő JSON!");
    }
}

// Webszerver a Render életben tartásához
app.get('/', (req, res) => {
    res.send('<h1>AutoDJ Online 🎵</h1><p>A rádió folyamatosan sugároz.</p>');
});

app.listen(PORT, () => {
    console.log(`>>> [WEBSZERVER] Fut a ${PORT} porton.`);
});

// --- RÁDIÓ SZERVER ADATOK ---
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = 9411;
const SOURCE_PASS = '2002';

// --- ZENE LISTA (Cseréld le ezeket valódi YouTube linkekre!) ---
const YOUTUBE_LINKS = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Példa link 1
    'https://www.youtube.com/watch?v=jfKfPfyJRdk'  // Példa link 2
];

function playNext() {
    if (YOUTUBE_LINKS.length === 0) {
        console.error(">>> [HIBA] Nincsenek linkek a listában!");
        return;
    }

    const randomUrl = YOUTUBE_LINKS[Math.floor(Math.random() * YOUTUBE_LINKS.length)];
    console.log(`>>> [AutoDJ] Következő dal indítása: ${randomUrl}`);

    const stream = ytdl(randomUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        agent: agent 
    });

    // Átkódolás és küldés
    ffmpeg(stream)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .audioFrequency(44100)
        .format('mp3')
        .outputOptions([
            '-content_type', 'audio/mpeg',
            '-metadata', 'title=YouTube Auto DJ'
        ])
        .save(`http://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}`)
        .on('start', () => {
            console.log('>>> [SZERVER] Csatlakozva a rádióhoz. Adás elindult!');
        })
        .on('end', () => {
            console.log('>>> [AutoDJ] Szám vége, váltás...');
            playNext();
        })
        .on('error', (err) => {
            console.error('>>> [HIBA]', err.message);
            // Ha hiba van, 10 mp múlva újrapróbálja
            setTimeout(playNext, 10000);
        });
}

// Indítás
playNext();

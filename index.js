const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

// --- ALAPBEÁLLÍTÁSOK ---
const PORT = process.env.PORT || 10000;

// Sütik (Cookie) betöltése a JSON formátumból
let agent;
if (process.env.YT_COOKIE) {
    try {
        const cookies = JSON.parse(process.env.YT_COOKIE);
        agent = ytdl.createAgent(cookies);
        console.log(">>> [RENDSZER] Sütik sikeresen betöltve. YouTube hozzáférés OK.");
    } catch (e) {
        console.error(">>> [HIBA] A YT_COOKIE formátuma nem megfelelő JSON! Ellenőrizd a Rendert!");
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

// --- A TE ZENE LISTÁD (Csak az az egy link, amit kértél) ---
const YOUTUBE_LINKS = [
    'https://www.youtube.com/watch?v=RzRhcnN-2XQ&feature=youtu.be'
];

function playNext() {
    if (YOUTUBE_LINKS.length === 0) return;

    const url = YOUTUBE_LINKS[0]; // Mivel csak egy link van
    console.log(`>>> [AutoDJ] Indítás: ${url}`);

    const stream = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        agent: agent 
    });

    // FFmpeg átalakítás és küldés a Shoutcast szerverre
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
            console.log('>>> [AutoDJ] Dal vége, újraindítás...');
            playNext(); // Mivel csak egy dal van, újra elindítja ugyanazt
        })
        .on('error', (err) => {
            console.error('>>> [HIBA]', err.message);
            // Hiba esetén (pl. hálózati szakadás) 10 mp múlva újrapróbálja
            setTimeout(playNext, 10000);
        });
}

// Bot indítása
playNext();

const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

const PORT = process.env.PORT || 10000;

// Sütik betöltése és ügynök létrehozása
let agent;
if (process.env.YT_COOKIE) {
    try {
        const cookies = JSON.parse(process.env.YT_COOKIE);
        agent = ytdl.createAgent(cookies);
        console.log(">>> [RENDSZER] Sütik betöltve.");
    } catch (e) {
        console.error(">>> [HIBA] JSON hiba a sütiknél!");
    }
}

app.get('/', (req, res) => res.send('AutoDJ fut! 🎵'));
app.listen(PORT, () => console.log(`Webszerver: ${PORT}`));

const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = 9411;
const SOURCE_PASS = '2002';

const YOUTUBE_LINKS = [
    'https://www.youtube.com/watch?v=RzRhcnN-2XQ' // Sickick - Infected
];

function playNext() {
    const url = YOUTUBE_LINKS[Math.floor(Math.random() * YOUTUBE_LINKS.length)];
    console.log(`>>> [AutoDJ] Indítás: ${url}`);

    // Letöltés beállításai: IOS és ANDROID kliensnek álcázva
    const stream = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        agent: agent,
        playerClients: ['IOS', 'ANDROID', 'TV'] // Ez segít a decipher hiba ellen
    });

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
            console.log('>>> [SZERVER] Csatlakozva a rádióhoz!');
        })
        .on('end', () => playNext())
        .on('error', (err) => {
            console.error('>>> [HIBA]', err.message);
            // Ha a hiba "No such format found", várjunk egy kicsit, hátha javul
            setTimeout(playNext, 15000);
        });
}

playNext();

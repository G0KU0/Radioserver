const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

const PORT = process.env.PORT || 10000;

// Sütik betöltése
let agent;
if (process.env.YT_COOKIE) {
    try {
        const cookies = JSON.parse(process.env.YT_COOKIE);
        agent = ytdl.createAgent(cookies);
        console.log(">>> [RENDSZER] Sütik betöltve.");
    } catch (e) {
        console.error(">>> [HIBA] Süti formátum hiba!");
    }
}

app.get('/', (req, res) => res.send('AutoDJ fut! 🎵'));
app.listen(PORT, () => console.log(`Szerver fut: ${PORT}`));

const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = 9411;
const SOURCE_PASS = '2002';

// A videó ID-ja (Sickick - Infected)
const VIDEO_URL = 'https://www.youtube.com/watch?v=A9eneMWen3U&feature=youtu.be';

function playNext() {
    console.log(`>>> [AutoDJ] Indítás: ${VIDEO_URL}`);

    // Bonyolultabb beállítások a 403-as hiba elkerülésére
    const stream = ytdl(VIDEO_URL, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        agent: agent,
        // Ezzel próbáljuk megkerülni a 403-at:
        playerClients: ['ANDROID', 'IOS', 'TV', 'WEB_EMBEDDED'] 
    });

    ffmpeg(stream)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .format('mp3')
        .save(`http://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}`)
        .on('start', () => {
            console.log('>>> [SZERVER] Sugárzás elindult!');
        })
        .on('end', () => {
            console.log('>>> Dal vége, újraindítás...');
            playNext();
        })
        .on('error', (err) => {
            console.error('>>> [HIBA]', err.message);
            // Ha 403 hiba van, 15 másodperc múlva próbálja újra
            setTimeout(playNext, 15000);
        });
}

playNext();

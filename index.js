const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

// --- BEÁLLÍTÁSOK ---
const PORT = process.env.PORT || 10000;
const YT_COOKIE = process.env.YT_COOKIE; // A Render-en megadott hosszú szöveg

const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = 9411;
const SOURCE_PASS = '2002';

const YOUTUBE_LINKS = [
    'https://www.youtube.com/watch?v=eK0xGydFN68', // Példa zene
    'https://www.youtube.com/watch?v=eK0xGydFN68', 
    // Ide pakolj minél több linket vesszővel elválasztva!
];

// Egyszerű weboldal a Render számára
app.get('/', (req, res) => {
    res.send('<h1>AutoDJ Online 🎵</h1><p>A rádió folyamatosan sugároz.</p>');
});

app.listen(PORT, () => {
    console.log(`Webszerver aktív a ${PORT} porton.`);
});

function playNext() {
    if (YOUTUBE_LINKS.length === 0) {
        console.error("Hiba: Nincsenek YouTube linkek a listában!");
        return;
    }

    const randomUrl = YOUTUBE_LINKS[Math.floor(Math.random() * YOUTUBE_LINKS.length)];
    console.log(`[AutoDJ] Most játszom: ${randomUrl}`);

    const stream = ytdl(randomUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        requestOptions: {
            headers: {
                cookie: YT_COOKIE || ""
            }
        }
    });

    ffmpeg(stream)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .audioFrequency(44100)
        .format('mp3')
        .outputOptions([
            '-content_type audio/mpeg',
            '-metadata title="YouTube Auto DJ"'
        ])
        // Csatlakozás a listen2myradio szerverhez
        .save(`http://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}`)
        .on('start', () => {
            console.log('>>> Adás sikeresen elindult a szerveren!');
        })
        .on('end', () => {
            console.log('>>> Szám vége, jön a következő...');
            playNext();
        })
        .on('error', (err) => {
            console.error('>>> HIBA:', err.message);
            // Ha hiba van, 5 mp múlva próbálja a következőt (pl. ha letiltott a YT)
            setTimeout(playNext, 5000);
        });
}

// Bot indítása
playNext();

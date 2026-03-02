const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = '9411';
const SOURCE_PASS = '2002';

// A TE VALÓDI YOUTUBE LINKED
const VIDEO_URL = 'https://www.youtube.com/watch?v=RzRhcnN-2XQ';

// Sütik kiírása fájlba a yt-dlp számára
if (process.env.YT_COOKIE) {
    fs.writeFileSync('cookies.json', process.env.YT_COOKIE);
    console.log(">>> [RENDSZER] cookies.json létrehozva.");
}

app.get('/', (req, res) => res.send('AutoDJ fut a Renderen! 🎵'));
app.listen(PORT, () => console.log(`Szerver aktív: ${PORT}`));

function startStream() {
    console.log(`>>> [AutoDJ] Indítás: ${VIDEO_URL}`);

    // yt-dlp indítása sütikkel és android kliens álcával
    const ytDlp = spawn('yt-dlp', [
        '--cookies', 'cookies.json',
        '-o', '-',
        '--format', 'bestaudio',
        '--no-playlist',
        VIDEO_URL
    ]);

    // ffmpeg indítása a Shoutcast küldéshez
    const ffmpeg = spawn('ffmpeg', [
        '-re', '-i', 'pipe:0',
        '-c:a', 'libmp3lame', '-ab', '128k', '-f', 'mp3',
        `http://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}`
    ]);

    ytDlp.stdout.pipe(ffmpeg.stdin);

    // Hibák figyelése
    ytDlp.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('403')) console.error('>>> [YT HIBA] 403 Forbidden! Új sütik kellenek!');
    });

    ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('Connection refused')) {
            console.error('>>> [RÁDIÓ HIBA] A szerver elutasította a kapcsolatot! Kapcsold be a panelen!');
        }
    });

    ffmpeg.on('close', () => {
        console.log('>>> Újraindítás 10 mp múlva...');
        setTimeout(startStream, 10000);
    });
}

// Rövid várakozás indítás előtt
setTimeout(startStream, 5000);

const express = require('express');
const { spawn } = require('child_process');
const app = express();

const PORT = process.env.PORT || 10000;
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = '9411';
const SOURCE_PASS = '2002';

// FONTOS: Csak igazi YouTube linket használj!
const VIDEO_URL = 'http://www.youtube.com/watch?v=RzRhcnN-2XQ';

app.get('/', (req, res) => res.send('AutoDJ fut a Renderen! 🎵'));
app.listen(PORT, () => console.log(`Szerver aktív: ${PORT}`));

function startStream() {
    console.log(`>>> [AutoDJ] Indítás: ${VIDEO_URL}`);

    // yt-dlp indítása (ez kéri le a hangot a YouTube-ról)
    const ytDlp = spawn('yt-dlp', [
        '-o', '-', 
        '--no-playlist',
        '--extract-audio',
        '--audio-format', 'mp3',
        VIDEO_URL
    ]);

    // ffmpeg indítása (ez küldi el a Shoutcast szerverre)
    const ffmpeg = spawn('ffmpeg', [
        '-re', '-i', 'pipe:0',
        '-c:a', 'libmp3lame', '-ab', '128k', '-f', 'mp3',
        `http://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}`
    ]);

    ytDlp.stdout.pipe(ffmpeg.stdin);

    ytDlp.stderr.on('data', (data) => console.log(`[yt-dlp]: ${data}`));
    ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('Connection refused')) {
            console.error('>>> [HIBA] A rádió szerver elutasította a kapcsolatot! Be van kapcsolva a panelen?');
        }
    });

    ffmpeg.on('close', () => {
        console.log('>>> Stream vége, újraindítás 15 mp múlva...');
        setTimeout(startStream, 15000);
    });
}

startStream();

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = '9411';
const SOURCE_PASS = '2002';

const PLAYLIST = [
    'https://www.youtube.com/watch?v=RzRhcnN-2XQ', // Sickick - Infected
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'  // Rick Astley
];

function jsonToNetscape(jsonStr) {
    try {
        const cookies = JSON.parse(jsonStr);
        let netscapeStr = "# Netscape HTTP Cookie File\n";
        for (const c of cookies) {
            const domain = ".youtube.com"; // Kényszerített tiszta domain
            netscapeStr += `${domain}\tTRUE\t/\tTRUE\t2147483647\t${c.name}\t${c.value}\n`;
        }
        return netscapeStr;
    } catch (e) { return ""; }
}

if (process.env.YT_COOKIE) {
    fs.writeFileSync('cookies.txt', jsonToNetscape(process.env.YT_COOKIE));
}

app.get('/', (req, res) => res.send('AutoDJ Status: Online 📻'));
app.listen(PORT);

let currentSongIndex = 0;

function playNextSong() {
    const videoUrl = PLAYLIST[currentSongIndex];
    console.log(`\n>>> 🎵 INDÍTÁS (ANDROID MÓD): ${videoUrl}`);

    const ytDlpArgs = [
        '--cookies', 'cookies.txt',
        '-o', '-',
        // Ez a sor a trükk: Androidos mobilnak álcázza a botot
        '--extractor-args', 'youtube:player_client=android', 
        '--format', 'bestaudio/best',
        '--no-playlist',
        videoUrl
    ];

    const ytDlp = spawn('yt-dlp', ytDlpArgs);
    const ffmpeg = spawn('ffmpeg', [
        '-re', '-i', 'pipe:0',
        '-c:a', 'libmp3lame', '-ab', '128k', '-f mp3',
        `icecast://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}/`
    ]);

    ytDlp.stdout.pipe(ffmpeg.stdin);

    ytDlp.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('ERROR')) console.error(`[YT Hiba]: ${msg}`);
    });

    ffmpeg.on('close', () => {
        currentSongIndex = (currentSongIndex + 1) % PLAYLIST.length;
        setTimeout(playNextSong, 5000);
    });
}

setTimeout(playNextSong, 3000);

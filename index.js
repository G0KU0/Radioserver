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
            const domain = ".youtube.com"; 
            netscapeStr += `${domain}\tTRUE\t/\tTRUE\t2147483647\t${c.name}\t${c.value}\n`;
        }
        return netscapeStr;
    } catch (e) { return ""; }
}

if (process.env.YT_COOKIE) {
    fs.writeFileSync('cookies.txt', jsonToNetscape(process.env.YT_COOKIE));
}

app.get('/', (req, res) => res.send('AutoDJ Status: Online 📻'));
app.listen(PORT, () => {
    console.log(`Webszerver: ${PORT}`);
    playNextSong();
});

let currentSongIndex = 0;

function playNextSong() {
    const videoUrl = PLAYLIST[currentSongIndex];
    console.log(`\n>>> 🎵 INDÍTÁS: ${videoUrl}`);

    const ytDlpArgs = [
        '--cookies', 'cookies.txt',
        '-o', '-',
        '--js-runtimes', 'deno',
        // EZ A JAVÍTÁS: Engedélyezzük a külső titkosítás-megoldót
        '--remote-components', 'ejs:github',
        '--extractor-args', 'youtube:player_client=web_embedded,tv',
        '--format', 'bestaudio/best',
        '--no-playlist',
        videoUrl
    ];

    const ytDlp = spawn('yt-dlp', ytDlpArgs);
    const ffmpeg = spawn('ffmpeg', [
        '-re', '-i', 'pipe:0',
        '-c:a', 'libmp3lame', '-ab', '128k', '-f', 'mp3',
        `icecast://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}/`
    ]);

    ytDlp.stdout.pipe(ffmpeg.stdin);

    ytDlp.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.log(`[YT Log]: ${msg}`);
    });

    ffmpeg.on('close', () => {
        console.log('>>> Újraindítás...');
        currentSongIndex = (currentSongIndex + 1) % PLAYLIST.length;
        setTimeout(playNextSong, 5000);
    });
}

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

// --- RÁDIÓ BEÁLLÍTÁSOK ---
const PORT = process.env.PORT || 10000;
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = '9411';
const SOURCE_PASS = '2002';

// --- LEJÁTSZÁSI LISTA (Ide rakhatod a kedvenc zenéidet) ---
const PLAYLIST = [
    'https://www.youtube.com/watch?v=RzRhcnN-2XQ', // Sickick - Infected (Eredeti link)
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'  // Példa 2 (Rick Astley) - cseréld le, amire akarod!
];

// Sütik mentése a fájlba
if (process.env.YT_COOKIE) {
    fs.writeFileSync('cookies.json', process.env.YT_COOKIE);
    console.log(">>> [RENDSZER] Sütik előkészítve a YouTube-hoz.");
}

app.get('/', (req, res) => res.send('<h1>Rádió AutoDJ 24/7 Aktív! 📻</h1>'));
app.listen(PORT, () => console.log(`Webszerver fut a ${PORT} porton.`));

let currentSongIndex = 0;

function playNextSong() {
    const videoUrl = PLAYLIST[currentSongIndex];
    console.log(`\n>>> 🎵 KÖVETKEZŐ DAL INDÍTÁSA: ${videoUrl}`);

    // YT-DLP: Zene letöltése közvetlenül a memóriába
    const ytDlpArgs = ['-o', '-', '--format', 'bestaudio', '--no-playlist'];
    if (fs.existsSync('cookies.json')) {
        ytDlpArgs.push('--cookies', 'cookies.json');
    }
    ytDlpArgs.push(videoUrl);

    const ytDlp = spawn('yt-dlp', ytDlpArgs);

    // FFMPEG: Valós idejű kódolás és küldés a Shoutcast/Icecast szerverre
    const ffmpegArgs = [
        '-re', // FONTOS: Valós idejű olvasás (élő adás mód)
        '-i', 'pipe:0', // Bemenet a yt-dlp-ből
        '-c:a', 'libmp3lame',
        '-b:a', '128k', // 128 kbps minőség
        '-ar', '44100',
        '-ac', '2',
        '-content_type', 'audio/mpeg',
        '-f', 'mp3',
        `icecast://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}/` // Stabilabb protokoll a küldéshez
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    // Csövezzük (pipe) a zenét a letöltőből a kódolóba
    ytDlp.stdout.pipe(ffmpeg.stdin);

    // Hibafigyelők
    ytDlp.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('ERROR') || msg.includes('403')) console.error(`[YT Hiba]: ${msg}`);
    });

    ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString();
        // Csak a legfontosabb hibát írjuk ki, ha a rádió visszautasít
        if (msg.includes('Connection refused')) {
            console.error('\n>>> ❌ KRITIKUS HIBA: A rádiószerver elutasított! KAPCSOLD BE A LISTEN2MYRADIO PANELEN!\n');
        }
    });

    // Ha vége a dalnak, vagy megszakad a kapcsolat
    ffmpeg.on('close', () => {
        console.log('>>> 🛑 Dal vége.');
        
        // Ugrás a következő dalra a listában
        currentSongIndex++;
        if (currentSongIndex >= PLAYLIST.length) {
            currentSongIndex = 0; // Ha végigértünk, kezdje elölről
        }

        console.log('>>> 🔄 Váltás a következő zenére 5 másodperc múlva...');
        setTimeout(playNextSong, 5000);
    });
}

// Rendszer indítása rövid késleltetéssel
console.log(">>> 🚀 AutoDJ Rendszer indul...");
setTimeout(playNextSong, 3000);

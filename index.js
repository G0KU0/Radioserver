const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

// --- RÁDIÓ BEÁLLÍTÁSOK ---
const PORT = process.env.PORT || 10000;
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = '9411';
const SOURCE_PASS = '2002';

// --- LEJÁTSZÁSI LISTA ---
const PLAYLIST = [
    'https://www.youtube.com/watch?v=RzRhcnN-2XQ', // Sickick - Infected
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'  // Rick Astley
];

// --- SÜTI KONVERTÁLÓ (A JAVÍTOTT .youtube.com DOMAINNEL) ---
function jsonToNetscape(jsonStr) {
    try {
        const cookies = JSON.parse(jsonStr);
        let netscapeStr = "# Netscape HTTP Cookie File\n# http://curl.haxx.se/rfc/cookie_spec.html\n# This is a generated file!  Do not edit.\n\n";
        
        for (const c of cookies) {
            // A LEGFONTOSABB JAVÍTÁS: Kényszerítjük a .youtube.com domaint!
            const domain = ".youtube.com";
            const flag = "TRUE";
            const path = "/";
            const secure = "TRUE";
            const expiry = 2147483647; // Távoli jövő, hogy ne járjon le
            
            // Csak akkor adjuk hozzá, ha van neve és értéke a sütinek
            if (c.name && c.value) {
                netscapeStr += `${domain}\t${flag}\t${path}\t${secure}\t${expiry}\t${c.name}\t${c.value}\n`;
            }
        }
        return netscapeStr;
    } catch (e) {
        console.error(">>> [HIBA] Nem sikerült a JSON sütit konvertálni!", e);
        return "";
    }
}

// Sütik mentése
if (process.env.YT_COOKIE) {
    const netscapeCookies = jsonToNetscape(process.env.YT_COOKIE);
    if (netscapeCookies) {
        fs.writeFileSync('cookies.txt', netscapeCookies);
        console.log(">>> [RENDSZER] cookies.txt sikeresen létrehozva a .youtube.com domainhez!");
    }
}

app.get('/', (req, res) => res.send('<h1>Rádió AutoDJ 24/7 Aktív! 📻</h1>'));
app.listen(PORT, () => console.log(`Webszerver fut a ${PORT} porton.`));

let currentSongIndex = 0;

function playNextSong() {
    if (PLAYLIST.length === 0) return;
    
    const videoUrl = PLAYLIST[currentSongIndex];
    console.log(`\n>>> 🎵 KÖVETKEZŐ DAL INDÍTÁSA: ${videoUrl}`);

    // YT-DLP paraméterek
    const ytDlpArgs = [
        '-o', '-', 
        '-f', 'bestaudio/best', 
        '--no-playlist'
    ];
    
    if (fs.existsSync('cookies.txt')) {
        ytDlpArgs.push('--cookies', 'cookies.txt');
    }
    ytDlpArgs.push(videoUrl);

    const ytDlp = spawn('yt-dlp', ytDlpArgs);

    // FFMPEG paraméterek
    const ffmpegArgs = [
        '-re', 
        '-i', 'pipe:0', 
        '-c:a', 'libmp3lame',
        '-b:a', '128k', 
        '-ar', '44100',
        '-ac', '2',
        '-content_type', 'audio/mpeg',
        '-f', 'mp3',
        `icecast://source:${SOURCE_PASS}@${SERVER_IP}:${SHOUTCAST_PORT}/`
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    // Csövezzük (pipe) az adatot
    ytDlp.stdout.pipe(ffmpeg.stdin);

    // Hibafigyelők
    ytDlp.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('ERROR') || msg.includes('403')) {
            console.error(`[YT Hiba]: ${msg}`);
        }
    });

    ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('Connection refused')) {
            console.error('\n>>> ❌ KRITIKUS HIBA: A rádiószerver elutasított! KAPCSOLD BE A LISTEN2MYRADIO PANELEN!\n');
        }
    });

    ffmpeg.on('close', () => {
        console.log('>>> 🛑 Dal vége.');
        
        currentSongIndex++;
        if (currentSongIndex >= PLAYLIST.length) {
            currentSongIndex = 0;
        }

        console.log('>>> 🔄 Váltás a következő zenére 5 másodperc múlva...');
        setTimeout(playNextSong, 5000);
    });
}

console.log(">>> 🚀 AutoDJ Rendszer indul...");
setTimeout(playNextSong, 3000);

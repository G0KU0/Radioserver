const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;
const SERVER_IP = 'uk18freenew.listen2myradio.com';
const SHOUTCAST_PORT = '9411';
const SOURCE_PASS = '2002';

// Ide rakd be az eredeti YouTube linkjeidet!
const PLAYLIST = [
    'https://www.youtube.com/watch?v=RzRhcnN-2XQ', 
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'  
];

// --- JAVÍTOTT SÜTI KONVERTÁLÓ ---
function jsonToNetscape(jsonStr) {
    try {
        const cookies = JSON.parse(jsonStr);
        let netscapeStr = "# Netscape HTTP Cookie File\n# This is a generated file! Do not edit.\n\n";
        
        for (const c of cookies) {
            // A LEGFONTOSABB JAVÍTÁS: Trükkösen írjuk be a domaint, hogy semmi ne írhassa át hibásra!
            const domain = "." + "youtube" + ".com";
            const flag = "TRUE";
            const path = "/";
            const secure = "TRUE";
            const expiry = 2147483647; // Sosem jár le
            
            if (c.name && c.value) {
                netscapeStr += `${domain}\t${flag}\t${path}\t${secure}\t${expiry}\t${c.name}\t${c.value}\n`;
            }
        }
        return netscapeStr;
    } catch (e) { 
        console.error(">>> [HIBA] JSON hiba!", e);
        return ""; 
    }
}

if (process.env.YT_COOKIE) {
    fs.writeFileSync('cookies.txt', jsonToNetscape(process.env.YT_COOKIE));
    console.log(">>> [RENDSZER] cookies.txt sikeresen létrehozva a hivatalos YouTube domainnel!");
}

app.get('/', (req, res) => res.send('AutoDJ Status: Online 📻'));
app.listen(PORT, () => console.log(`Webszerver fut a ${PORT} porton.`));

let currentSongIndex = 0;

function playNextSong() {
    const videoUrl = PLAYLIST[currentSongIndex];
    console.log(`\n>>> 🎵 INDÍTÁS (ANDROID MÓD + JAVÍTOTT SÜTIK): ${videoUrl}`);

    const ytDlpArgs = [
        '--cookies', 'cookies.txt',
        '-o', '-',
        // Android kliens álcázása
        '--extractor-args', 'youtube:player_client=android',
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
        const msg = data.toString();
        // A letöltő hibáinak kijelzése
        if (msg.includes('ERROR') || msg.includes('403')) {
            console.error(`[YT Hiba]: ${msg}`);
        }
    });

    ffmpeg.on('close', () => {
        console.log('>>> 🛑 Dal vége.');
        currentSongIndex = (currentSongIndex + 1) % PLAYLIST.length;
        console.log('>>> 🔄 Váltás a következő zenére 5 másodperc múlva...');
        setTimeout(playNextSong, 5000);
    });
}

// Rendszer indítása
setTimeout(playNextSong, 3000);

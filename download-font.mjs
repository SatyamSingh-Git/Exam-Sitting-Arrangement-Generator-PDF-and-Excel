// Script to download Noto Sans Devanagari TTF and generate base64 JS module
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const URLS = [
    'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf',
    'https://fonts.gstatic.com/s/notosansdevanagari/v26/TuGOUVpzXI5FBtUq5a8bjKYTZjtRU6Sgv3E.ttf',
];

function download(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
                console.log(`  Redirect -> ${res.headers.location.substring(0, 80)}...`);
                return resolve(download(res.headers.location, maxRedirects - 1));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    let fontBuffer = null;

    for (const url of URLS) {
        console.log(`Trying: ${url.substring(0, 80)}...`);
        try {
            const buf = await download(url);
            if (buf.length > 1000) {
                console.log(`  SUCCESS: ${buf.length} bytes`);
                fontBuffer = buf;
                break;
            } else {
                console.log(`  Too small (${buf.length} bytes), skipping`);
            }
        } catch (e) {
            console.log(`  FAILED: ${e.message}`);
        }
    }

    if (!fontBuffer) {
        console.error('\nAll download attempts failed!');
        console.error('Please manually download Noto Sans Devanagari TTF from:');
        console.error('https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari');
        console.error('Place the .ttf file at: src/utils/NotoSansDevanagari-Regular.ttf');
        process.exit(1);
    }

    // Save TTF
    const ttfPath = path.join('src', 'utils', 'NotoSansDevanagari-Regular.ttf');
    fs.writeFileSync(ttfPath, fontBuffer);
    console.log(`\nSaved TTF: ${ttfPath} (${fontBuffer.length} bytes)`);

    // Generate base64 JS module
    const b64 = fontBuffer.toString('base64');
    const jsContent = `// Auto-generated — Noto Sans Devanagari Regular font in base64
// Source: Google Fonts (Noto Sans Devanagari)
export const NOTO_SANS_DEVANAGARI_BASE64 = '${b64}';\n\nexport function registerHindiFont(doc) {\n  doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', NOTO_SANS_DEVANAGARI_BASE64);\n  doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');\n  doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'bold');\n}\n`;
    const jsPath = path.join('src', 'utils', 'hindiFont.js');
    fs.writeFileSync(jsPath, jsContent);
    console.log(`Generated: ${jsPath} (${jsContent.length} chars)`);
    console.log('Done!');
}

main();

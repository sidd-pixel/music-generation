import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const makeRequest = (options, postData) => new Promise((resolve) => {
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  req.on('error', e => resolve({ status: 'ERROR', body: e.message }));
  if (postData) req.write(postData);
  req.end();
});

// Get token
const tokenBody = 'grant_type=client_credentials';
const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
const tokenRes = await makeRequest({
  hostname: 'accounts.spotify.com',
  path: '/api/token',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${creds}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(tokenBody),
  }
}, tokenBody);
const token = JSON.parse(tokenRes.body).access_token;
console.log('Token OK');

// Test search with emotion-based queries
const queries = ['happy upbeat pop', 'sad emotional', 'energetic rock angry'];
for (const q of queries) {
  const params = new URLSearchParams({ q, type: 'track', limit: '5', market: 'US' });
  const r = await makeRequest({
    hostname: 'api.spotify.com',
    path: `/v1/search?${params}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = JSON.parse(r.body);
  console.log(`\nSearch "${q}" → status ${r.status}, tracks: ${data.tracks?.items?.length}`);
  if (data.tracks?.items?.length) {
    data.tracks.items.slice(0, 2).forEach(t => {
      console.log(`  - ${t.name} / ${t.artists[0]?.name} | preview: ${t.preview_url ? 'YES' : 'NO'}`);
    });
  }
}

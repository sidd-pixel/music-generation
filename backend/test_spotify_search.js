import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const testSearches = async () => {
    const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;
  
    const queries = [
        // Japanese
        { q: '嬉', market: 'JP' }, 
        { q: '悲', market: 'JP' },
        { q: '楽しい', market: 'JP' }, 
        // Korean
        { q: '슬픈', market: 'KR' }, // sad
        { q: '사랑', market: 'KR' }, // love
        // Hindi
        { q: 'दर्द', market: 'IN' },
        { q: 'खुश', market: 'IN' },
        // Spanish
        { q: 'feliz', market: 'MX' },
        { q: 'triste', market: 'MX' }
    ];

    for (let {q, market} of queries) {
        try {
            const res = await axios.get('https://api.spotify.com/v1/search', {
                headers: { Authorization: `Bearer ${token}` },
                params: { q, type: 'track', limit: 3, market }
            });
            console.log(`\nQuery: ${q}`);
            res.data.tracks.items.forEach((t) => {
                console.log(` - ${t.name} by ${t.artists.map(a=>a.name).join(', ')}`);
            });
            if (res.data.tracks.items.length === 0) console.log(" - No results");
        } catch (e) {
            console.error(e.response ? e.response.data : e.message);
        }
    }
};

testSearches();

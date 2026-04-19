/**
 * services/spotifyService.js
 * Handles Spotify API authentication and music search by emotion + language + genre.
 *
 * KEY CHANGES vs previous version:
 *  - Uses language-native search queries (Hindi/Japanese/Korean/Spanish/French)
 *    instead of just appending the language name to an English query.
 *  - Uses the correct Spotify market per language (e.g. IN for Hindi, JP for Japanese)
 *    so the regional catalog is actually searched.
 *  - Genre is appended as a plain keyword (NOT with the broken genre:"..." filter syntax
 *    which Spotify removed from their search API).
 *  - Augments results with YouTube video IDs for in-browser playback.
 */

import axios from 'axios';
import ytSearch from 'yt-search';
import {
  getSearchQueries,
  LANGUAGE_CONFIG,
  LANGUAGE_GENRE_TERMS,
} from '../utils/emotionMapper.js';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE  = 'https://api.spotify.com/v1';

// ── In-memory token cache ────────────────────────────────────────────────────
let cachedToken    = null;
let tokenExpiresAt = 0;

const getAccessToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    }
  );

  cachedToken    = response.data.access_token;
  tokenExpiresAt = now + response.data.expires_in * 1000;
  return cachedToken;
};

// ── Track formatter ──────────────────────────────────────────────────────────
const formatTrack = (track) => ({
  id:          track.id,
  name:        track.name,
  artist:      track.artists.map((a) => a.name).join(', '),
  album:       track.album?.name || '',
  albumImage:  track.album?.images?.[0]?.url || null,
  spotifyUrl:  track.external_urls?.spotify || null,
  durationMs:  track.duration_ms,
});

// ── Array shuffle ────────────────────────────────────────────────────────────
const shuffleArray = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Find the YouTube video that best matches a Spotify track for in-browser playback.
 */
const fetchYouTubeId = async (songName, artistName) => {
  try {
    const query  = `${songName} ${artistName} audio`;
    const result = await ytSearch(query);
    return result?.videos?.[0]?.videoId || null;
  } catch (err) {
    console.error(`YouTube lookup failed for "${songName}":`, err.message);
    return null;
  }
};

// ── Genre keyword resolution ─────────────────────────────────────────────────
/**
 * Resolve the genre selection to a language-aware keyword string.
 * Uses LANGUAGE_GENRE_TERMS so "Pop" + "Hindi" → "bollywood pop"
 * rather than the useless genre:"pop" filter syntax.
 *
 * @param {string} genre    - UI selection, e.g. "Pop", "Rock", ""
 * @param {string} language - UI selection, e.g. "Hindi", "English"
 * @returns {string} keyword to append to the search query, or ''
 */
const resolveGenreKeyword = (genre, language) => {
  if (!genre || genre === '') return '';
  const langTerms = LANGUAGE_GENRE_TERMS[language] || LANGUAGE_GENRE_TERMS['English'];
  return langTerms[genre] || genre.toLowerCase();
};

// ── Core search helper ───────────────────────────────────────────────────────
/**
 * Execute a single Spotify /search call.
 *
 * @param {string} token
 * @param {string} query
 * @param {string} market - Spotify ISO 3166-1 alpha-2 market code
 */
const spotifySearch = async (token, query, market) => {
  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q:      query,
        type:   'track',
        limit:  10,
        market,
      },
      timeout: 10000,
    });
    return response.data.tracks?.items || [];
  } catch (err) {
    console.error(`Spotify search failed for query "${query}":`, err.message);
    return [];
  }
};

// ── Main export ──────────────────────────────────────────────────────────────
/**
 * Fetch music recommendations based on emotion, intensity, language and genre.
 *
 * @param {string} emotion   - e.g. 'joy', 'sadness'
 * @param {number} intensity - 1–10
 * @param {string} language  - 'English' | 'Hindi' | 'Japanese' | 'Korean' | 'Spanish' | 'French'
 * @param {string} genre     - 'Pop' | 'Rock' | '' | etc.
 */
export const fetchRecommendations = async (
  emotion,
  intensity = 5,
  language  = 'English',
  genre     = ''
) => {
  const token = await getAccessToken();

  // ── 1. Resolve language config ─────────────────────────────────────────────
  const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['English'];
  const market     = langConfig.market;

  // ── 2. Get language-native emotion queries ─────────────────────────────────
  const baseQueries = getSearchQueries(emotion, intensity, language);

  // ── 3. Resolve genre keyword ───────────────────────────────────────────────
  const genreKeyword = resolveGenreKeyword(genre, language);

  // ── 4. Build final query strings ───────────────────────────────────────────
  //  Append genre keyword naturally (NOT with genre:"..." — that syntax is broken).
  const finalQueries = baseQueries.slice(0, 3).map((q) => {
    // Only append genre keyword if it isn't already in the query string
    if (genreKeyword && !q.toLowerCase().includes(genreKeyword.toLowerCase())) {
      return `${q} ${genreKeyword}`;
    }
    return q;
  });

  console.log(`[SpotifyService] language="${language}" market="${market}" emotion="${emotion}" genre="${genre}"`);
  console.log('[SpotifyService] queries:', finalQueries);

  // ── 5. Run searches in parallel ────────────────────────────────────────────
  const allTracks = [];
  const seenIds   = new Set();

  const results = await Promise.all(
    finalQueries.map((query) => spotifySearch(token, query, market))
  );

  for (const tracks of results) {
    for (const track of tracks) {
      if (!seenIds.has(track.id)) {
        seenIds.add(track.id);
        allTracks.push(formatTrack(track));
      }
    }
  }

  // ── 6. Fallback if no results ──────────────────────────────────────────────
  let finalTracks =
    allTracks.length > 0
      ? shuffleArray(allTracks).slice(0, 15)
      : await fetchGenericFallback(token, language, genre, market);

  // ── 7. Attach YouTube IDs in parallel ─────────────────────────────────────
  const tracksWithYoutube = await Promise.all(
    finalTracks.map(async (track) => {
      const ytId = await fetchYouTubeId(track.name, track.artist);
      return { ...track, youtubeId: ytId };
    })
  );

  return tracksWithYoutube;
};

// ── Generic fallback ─────────────────────────────────────────────────────────
/**
 * Called when the emotion-specific search returns nothing.
 * Uses a generic "popular songs" query in the correct market/language context.
 */
const fetchGenericFallback = async (token, language, genre, market) => {
  try {
    // Build a language-aware fallback query
    const languageFallbackTerms = {
      English:  'popular hits 2024',
      Hindi:    'बॉलीवुड सुपरहिट',
      Japanese: '人気曲',
      Korean:   '인기곡',
      Spanish:  'éxitos',
      French:   'succès',
    };

    let fallbackQuery = languageFallbackTerms[language] || 'popular hits 2024';
    const genreKeyword = resolveGenreKeyword(genre, language);
    if (genreKeyword) fallbackQuery += ` ${genreKeyword}`;

    console.log(`[SpotifyService] Fallback query: "${fallbackQuery}" market="${market}"`);

    const tracks = await spotifySearch(token, fallbackQuery, market);
    return tracks.map(formatTrack);
  } catch (err) {
    console.error('Fallback search failed:', err.message);
    return [];
  }
};

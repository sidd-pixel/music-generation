/**
 * utils/emotionMapper.js
 * Maps detected emotions to Spotify search queries and audio parameters.
 *
 * NOTE: Spotify deprecated /recommendations in Nov 2024.
 *       We now use /search with curated keyword queries per emotion.
 *
 * LANGUAGE SUPPORT:
 *   Native locale character sets are REQUIRED for accurate non-English searching.
 *   Using English strings like "Japanese happy pop" breaks Spotify's search indexing, returning mixed languages.
 *   Using native strings like "楽しい" (fun/happy) flawlessly scopes to that language.
 */

export const VALID_EMOTIONS = [
  'joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise', 'neutral', 'calm',
];

export const LANGUAGE_CONFIG = {
  English:  { market: 'US' },
  Hindi:    { market: 'IN' },
  Spanish:  { market: 'MX' },
  Korean:   { market: 'KR' },
  Japanese: { market: 'JP' },
  French:   { market: 'FR' },
};

// Genre translations - these will be appended to queries
export const LANGUAGE_GENRE_TERMS = {
  English: {
    'Pop': 'pop', 'Rock': 'rock', 'Hip Hop': 'hip hop', 'Lo-Fi': 'lo-fi',
    'Classical': 'classical', 'Electronic': 'electronic', 'R&B': 'r&b', 'Jazz': 'jazz',
  },
  Hindi: {
    'Pop': 'पॉप', 'Rock': 'रॉक', 'Hip Hop': 'हिप हॉप',
    'Lo-Fi': 'लोफाई', 'Classical': 'क्लासिकल', 'Electronic': 'ईडीएम',
    'R&B': 'आर एंड बी', 'Jazz': 'जैज़',
  },
  Japanese: {
    'Pop': 'J-Pop', 'Rock': 'J-Rock', 'Hip Hop': 'ヒップホップ',
    'Lo-Fi': 'ローファイ', 'Classical': 'クラシック', 'Electronic': 'EDM',
    'R&B': 'R&B', 'Jazz': 'ジャズ',
  },
  Korean: {
    'Pop': 'K-Pop', 'Rock': '록', 'Hip Hop': '힙합',
    'Lo-Fi': '로파이', 'Classical': '클래식', 'Electronic': 'EDM',
    'R&B': 'R&B', 'Jazz': '재즈',
  },
  Spanish: {
    'Pop': 'pop', 'Rock': 'rock', 'Hip Hop': 'hip hop',
    'Lo-Fi': 'lo-fi', 'Classical': 'clásico', 'Electronic': 'electrónica',
    'R&B': 'r&b', 'Jazz': 'jazz',
  },
  French: {
    'Pop': 'pop', 'Rock': 'rock', 'Hip Hop': 'rap',
    'Lo-Fi': 'lo-fi', 'Classical': 'classique', 'Electronic': 'électronique',
    'R&B': 'r&b', 'Jazz': 'jazz',
  },
};

const ENGLISH_QUERIES = {
  joy: {
    low:  ['happy mellow songs', 'uplifting acoustic pop', 'feel good indie'],
    mid:  ['happy pop hits', 'upbeat feel good songs', 'joyful popular music'],
    high: ['energetic happy dance', 'upbeat pop party hits', 'euphoric electronic dance'],
  },
  sadness: {
    low:  ['sad quiet songs', 'melancholy ambient', 'soft sad instrumental'],
    mid:  ['sad emotional songs', 'heartbreak ballads', 'melancholy indie pop'],
    high: ['sad dramatic songs', 'emotional breakup playlist', 'crying songs sad pop'],
  },
  anger: {
    low:  ['alternative rock frustrated', 'grunge songs anger', 'punk rock angst'],
    mid:  ['angry rock music', 'metal hard rock intensity', 'aggressive rock songs'],
    high: ['heavy metal rage', 'intense punk metal', 'aggressive intense heavy metal'],
  },
  fear: {
    low:  ['dark ambient music', 'eerie atmospheric songs', 'tense cinematic music'],
    mid:  ['dark intense music', 'suspenseful cinematic', 'haunting atmospheric'],
    high: ['intense dark electronic', 'dramatic horror soundtrack', 'intense thriller music'],
  },
  disgust: {
    low:  ['alternative indie music', 'moody alternative', 'cynical indie rock'],
    mid:  ['grunge alternative rock', 'edgy alternative music', 'dark indie alternative'],
    high: ['aggressive alternative metal', 'intense grunge punk', 'dark heavy alternative'],
  },
  surprise: {
    low:  ['quirky indie music', 'whimsical pop songs', 'unexpected indie'],
    mid:  ['exciting pop music', 'upbeat surprising hits', 'eclectic popular songs'],
    high: ['euphoric electronic pop', 'exciting EDM dance', 'intense exciting beats'],
  },
  neutral: {
    low:  ['chill background music', 'relaxed indie chill', 'calm background songs'],
    mid:  ['popular indie pop', 'chill pop hits', 'relaxed popular music'],
    high: ['moderate pop hits', 'popular energetic songs', 'mainstream pop music'],
  },
  calm: {
    low:  ['ambient relaxing music', 'calm meditation music', 'peaceful acoustic'],
    mid:  ['chill relaxing songs', 'calm acoustic songs', 'peaceful indie'],
    high: ['relaxed chill songs', 'soft indie folk', 'soothing popular music'],
  },
};

const LANGUAGE_EMOTION_QUERIES = {
  Hindi: {
    joy: {
      low:  ['खुशी गाने', 'सुहाना', 'हल्का फुल्का'],
      mid:  ['मस्त गाने', 'खुश', 'डांस'],
      high: ['पार्टी गाने', 'एनर्जेटिक', 'धमाकेदार'],
    },
    sadness: {
      low:  ['उदासी', 'हल्का दर्द', 'ग़म'],
      mid:  ['दर्द भरे गीत', 'ब्रेकअप', 'सैड सॉन्ग'],
      high: ['रुलाने वाले गाने', 'अत्यधिक दर्द', 'तड़प'],
    },
    anger: {
      low:  ['नाराजगी', 'गुस्सा', 'थोड़ा गुस्सा'],
      mid:  ['तीव्र गुस्सा', 'क्रोधित', 'भयंकर'],
      high: ['खतरनाक', 'आक्रामक', 'रॉक गुस्सा'],
    },
    fear: {
      low:  ['अंधेरा', 'सस्पेंस', 'रहस्यमय'],
      mid:  ['डरावना', 'खौफ', 'भयभीत'],
      high: ['बहुत डरावना', 'थ्रिलर', 'भयानक'],
    },
    disgust: {
      low:  ['विद्रोही', 'चिड़चिड़ापन', 'अलग हटके'],
      mid:  ['पंक', 'तीखा', 'गहरी सोच'],
      high: ['डार्क ऑल्टरनेटिव', 'भारी ऑल्टरनेटिव', 'गुस्से वाला रॉक'],
    },
    surprise: {
      low:  ['अनोखा', 'सरप्राइज', 'हटके'],
      mid:  ['उत्साही', 'मजेदार', 'उत्साहपूर्ण'],
      high: ['धमाकेदार डांस', 'इलेक्ट्रॉनिक डांस', 'अत्यधिक ऊर्जा'],
    },
    neutral: {
      low:  ['शांत', 'सुकून', 'रिलैक्सिंग म्‍यूजिक'],
      mid:  ['सुखदायक', 'आरामदायक', 'पॉपुलर'],
      high: ['टॉप हिट्स', 'पसंदीदा', 'मशहूर'],
    },
    calm: {
      low:  ['शांतिदायक', 'मेडिटेशन', 'ध्यान'],
      mid:  ['सुकून भरे गाने', 'रिलैक्स', 'शांति'],
      high: ['आराम', 'हल्की धुन', 'धीमे गाने'],
    },
  },

  Japanese: {
    joy: {
      low:  ['ハッピー', '優しい', 'ほっこり'],
      mid:  ['楽しい', '嬉しい曲', 'ポップ'],
      high: ['盛り上がる', 'テンション上がる', 'ダンス'],
    },
    sadness: {
      low:  ['切ない', '静か', '憂鬱'],
      mid:  ['悲しい曲', '失恋ソング', '泣ける曲'],
      high: ['号泣', '絶望', '激しい悲しみ'],
    },
    anger: {
      low:  ['苛立ち', 'フラストレーション', 'ロック'],
      mid:  ['怒り', '激しいロック', 'アグレッシブ'],
      high: ['激怒', 'メタル', 'パンク'],
    },
    fear: {
      low:  ['不気味', '暗い雰囲気', 'ミステリアス'],
      mid:  ['怖い曲', 'ホラー音楽', 'サスペンス'],
      high: ['恐怖', 'スリラー', 'パニック'],
    },
    disgust: {
      low:  ['シニカル', 'オルタナ', 'インディーズ'],
      mid:  ['エッジ', '反抗的', 'パンクロック'],
      high: ['ダークマター', 'ダークオルタナティブ', 'ノイズ'],
    },
    surprise: {
      low:  ['サプライズ', '変わった曲', '不思議'],
      mid:  ['ワクワク', '驚き', 'エキサイティング'],
      high: ['エレクトロダンス', 'ハイエナジー', '激しいダンス'],
    },
    neutral: {
      low:  ['bgm', '環境音', 'チルアウト'],
      mid:  ['チル', 'リラックス', '定番'],
      high: ['人気曲', '流行り', 'ヒットソング'],
    },
    calm: {
      low:  ['睡眠', '瞑想', 'ヒーリング'],
      mid:  ['穏やか', '癒し', '落ち着く曲'],
      high: ['アコースティック', 'アンビエント', '静かな夜'],
    },
  },

  Korean: {
    joy: {
      low:  ['소소한 행복', '따뜻한', '기분 좋은 노래'],
      mid:  ['기쁜', '신나는', '행복한 노래'],
      high:  ['파티 노래', '흥겨운', '댄스곡'],
    },
    sadness: {
      low:  ['쓸쓸한', '잔잔한 이별', '우울한 날'],
      mid:  ['슬픈 노래', '이별', '눈물나는 노래'],
      high:  ['오열', '비극적인', '가슴 아픈'],
    },
    anger: {
      low:  ['짜증나는', '답답한', '하드 록'],
      mid:  ['분노', '격렬한', '강렬한 록'],
      high:  ['분노 폭발', '헤비 메탈', '강렬한 힙합'],
    },
    fear: {
      low:  ['긴장되는', '어두운 분위기', '미스터리'],
      mid:  ['무서운 노래', '호러', '스릴러'],
      high:  ['공포', '오싹한', '소름 돋는'],
    },
    disgust: {
      low:  ['냉소적인', '인디 음악', '얼터너티브'],
      mid:  ['반항적인', '펑크 록', '강렬한 사운드'],
      high:  ['다크 얼터너티브', '거친 메탈', '어두운 록'],
    },
    surprise: {
      low:  ['독특한', '신비로운', '놀라운'],
      mid:  ['흥미진진한', '신나는 댄스', '일렉트로닉'],
      high:  ['초고음', '에너지 넘치는', '폭발적인 댄스'],
    },
    neutral: {
      low:  ['로파이', '백그라운드 뮤직', '카페 음악'],
      mid:  ['잔잔한 노래', '편안한', '인기곡'],
      high:  ['최신 유행', '인기 차트', '트렌디한'],
    },
    calm: {
      low:  ['명상', '수면 음악', '치유'],
      mid:  ['차분한', '평화로운', '힐링'],
      high:  ['어쿠스틱', '자장가', '조용한 밤'],
    },
  },

  Spanish: {
    joy: {
      low:  ['alegre acustico', 'feliz suave', 'buenas vibras'],
      mid:  ['alegre', 'feliz', 'canciones felices'],
      high: ['fiesta', 'reggaeton intenso', 'baile energetico'],
    },
    sadness: {
      low:  ['tristeza suave', 'melancolia', 'triste instrumental'],
      mid:  ['triste', 'canciones tristes', 'corazon roto'],
      high: ['llorar', 'depresión', 'tragedia'],
    },
    anger: {
      low:  ['frustración', 'rock suave', 'enojo alternativo'],
      mid:  ['enojo', 'rock intenso', 'agresivo'],
      high: ['rabia metal', 'punk agresivo', 'ira metal'],
    },
    fear: {
      low:  ['musica oscura', 'misterio', 'tenso'],
      mid:  ['miedo', 'terror', 'suspenso'],
      high: ['horror', 'pesadilla', 'panico'],
    },
    disgust: {
      low:  ['indie raro', 'alternativo cinico', 'punk suave'],
      mid:  ['alternativo', 'punk', 'rebelde'],
      high: ['metal oscuro', 'ruido agresivo', 'punk pesado'],
    },
    surprise: {
      low:  ['sorpresa', 'musica rara', 'indie magico'],
      mid:  ['canciones emocionantes', 'divertido', 'intenso'],
      high: ['electronica loca', 'baile explosivo', 'edm fuerte'],
    },
    neutral: {
      low:  ['chill', 'musica de fondo', 'lofi'],
      mid:  ['relajado', 'canciones populares', 'exitos'],
      high: ['top hits', 'lo mas escuchado', 'viral'],
    },
    calm: {
      low:  ['meditacion', 'musica para dormir', 'paz'],
      mid:  ['calmado', 'acustico', 'tranquilo'],
      high: ['suave', 'relajacion total', 'chill out'],
    },
  },

  French: {
    joy: {
      low:  ['joie douce', 'heureux', 'bonnes ondes'],
      mid:  ['joie', 'chansons heureuses', 'joyeux'],
      high: ['fete', 'danse energetique', 'pop explosive'],
    },
    sadness: {
      low:  ['melancolie', 'tristesse douce', 'ambiance triste'],
      mid:  ['triste', 'chansons tristes', 'coeur brise'],
      high: ['pleurer', 'chagrin', 'tragedie'],
    },
    anger: {
      low:  ['frustration', 'rock alternatif', 'colère douce'],
      mid:  ['colère', 'rock intense', 'agressif'],
      high: ['rage', 'metal lourd', 'punk agressif'],
    },
    fear: {
      low:  ['musique sombre', 'mystere', 'tension'],
      mid:  ['peur', 'terreur', 'suspense'],
      high: ['horreur', 'cauchemar', 'panique'],
    },
    disgust: {
      low:  ['indie cynique', 'alternatif doux', 'musique bizarre'],
      mid:  ['alternatif', 'punk', 'rebelle'],
      high: ['metal sombre', 'bruit agressif', 'punk lourd'],
    },
    surprise: {
      low:  ['surprise', 'musique magique', 'indie etrange'],
      mid:  ['excitant', 'amusant', 'intense'],
      high: ['electro fou', 'danse explosive', 'edm intense'],
    },
    neutral: {
      low:  ['detendu', 'musique de fond', 'lofi'],
      mid:  ['populaire', 'chansons connues', 'succes'],
      high: ['top hits', 'les plus ecoutes', 'viral'],
    },
    calm: {
      low:  ['meditation', 'musique pour dormir', 'paix'],
      mid:  ['calme', 'acoustique', 'paisible'],
      high: ['doux', 'relaxation totale', 'chill out'],
    },
  },
};

export const getSearchQueries = (emotion, intensity = 5, language = 'English') => {
  const queryMap =
    language !== 'English' && LANGUAGE_EMOTION_QUERIES[language]
      ? LANGUAGE_EMOTION_QUERIES[language]
      : ENGLISH_QUERIES;

  const map = queryMap[emotion] || queryMap['neutral'];

  let tier;
  if (intensity <= 3) tier = 'low';
  else if (intensity <= 7) tier = 'mid';
  else tier = 'high';

  const primary = map[tier];
  const adjacentKey = tier === 'low' ? 'mid' : tier === 'high' ? 'mid' : 'low';
  const adjacent = map[adjacentKey].slice(0, 1);

  return [...primary, ...adjacent];
};

export const getSpotifyParams = (emotion, intensity = 5) => {
  return { emotion, intensity };
};

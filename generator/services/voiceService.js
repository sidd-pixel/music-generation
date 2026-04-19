import fs from "fs";
import path from "path";
import axios from "axios";
import { generateSilence } from "../utils/helpers.js";

export const generateVoice = async (text, options = {}) => {
  const { style = "spoken", raw = false, mock = false, duration = 2 } = options;

  // Mock mode: return a short silent audio for local testing
  if (mock) {
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const outPath = path.join(tmpDir, `voice_mock_${Date.now()}.mp3`);
    await generateSilence(outPath, duration);
    return fs.readFileSync(outPath);
  }

  let payloadText = text;
  if (!raw && style === "spoken") {
    payloadText = `Please read the following text in a natural, poetic spoken style (do not sing):\n\n${text}`;
  }

  // If no API key, return a silent placeholder
  if (!process.env.ELEVEN_API_KEY) {
    console.warn("No ELEVEN_API_KEY set; returning silent placeholder for voice.");
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const outPath = path.join(tmpDir, `voice_fallback_${Date.now()}.mp3`);
    await generateSilence(outPath, duration);
    return fs.readFileSync(outPath);
  }

  try {
    const res = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      { text: payloadText },
      {
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg, application/octet-stream",
        },
        responseType: "arraybuffer",
      }
    );

    return res.data; // audio buffer
  } catch (err) {
    console.warn("ElevenLabs TTS error, falling back to silent audio:", err.response?.status || err.message);
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const outPath = path.join(tmpDir, `voice_fallback_${Date.now()}.mp3`);
    await generateSilence(outPath, duration);
    return fs.readFileSync(outPath);
  }
};

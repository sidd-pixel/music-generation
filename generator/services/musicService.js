import axios from "axios";
import fs from "fs";
import path from "path";
import { generateSilence } from "../utils/helpers.js";

export const generateMusic = async (prompt, options = {}) => {
  const { mock = false, duration = 3 } = options;
  const modelId = process.env.HF_MODEL || "suno/bark";
  const hfKey = process.env.HF_API_KEY || process.env.MUSIC_API_KEY;

  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const outPath = path.join(tmpDir, `music_${Date.now()}.mp3`);

  // Mock mode: generate short silent track for local testing
  if (mock) {
    await generateSilence(outPath, duration);
    return fs.readFileSync(outPath);
  }

  if (!hfKey) {
    console.warn("No HF API key set; generating silent placeholder audio.");
    await generateSilence(outPath, duration);
    return fs.readFileSync(outPath);
  }

  // Preflight: check model availability
  try {
    const check = await axios.get(`https://api-inference.huggingface.co/models/${modelId}`, {
      headers: { Authorization: `Bearer ${hfKey}` },
      validateStatus: (s) => s < 500,
    });
    if (check.status === 404) {
      console.warn(`HF model ${modelId} not found (404). Using silent placeholder.`);
      await generateSilence(outPath, duration);
      return fs.readFileSync(outPath);
    }
  } catch (e) {
    console.warn("Model availability check failed:", e.message);
    // continue to inference attempt
  }

  try {
    const res = await axios.post(
      `https://api-inference.huggingface.co/models/${modelId}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
          Accept: "audio/mpeg, audio/wav, application/octet-stream",
        },
        responseType: "arraybuffer",
      }
    );

    if (res.status === 200) return res.data;

    console.warn(`Unexpected HF response status ${res.status}; returning placeholder audio.`);
    await generateSilence(outPath, duration);
    return fs.readFileSync(outPath);
  } catch (err) {
    console.error("HF MusicGen error:", err?.response?.status || err.message);
    if (err.response && err.response.status === 404) {
      await generateSilence(outPath, duration);
      return fs.readFileSync(outPath);
    }
    throw err;
  }
};

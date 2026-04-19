import fs from "fs";
import path from "path";
import express from "express";

import { generateLyrics } from "../services/lyricsService.js";
import { generateMusic } from "../services/musicService.js";
import { generateVoice } from "../services/voiceService.js";
import { mergeAudio } from "../services/mergeService.js";
import { validateInput } from "../utils/helpers.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { mood, genre } = req.body;
    const isMock = req.query?.mock === "true" || req.headers["x-mock"] === "1";

    if (!isMock) validateInput({ mood, genre });

    // Step 1: Lyrics
    const lyrics = isMock
      ? `Mock ${mood} ${genre} lyrics\nLine 1\nLine 2\nLine 3`
      : await generateLyrics({ mood, genre });

    // Step 2: Music
    const musicBuffer = await generateMusic(`${mood} ${genre} instrumental`, { mock: isMock });

    // Ensure tmp dir exists
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const musicPath = path.join(tmpDir, "music.mp3");
    const voicePath = path.join(tmpDir, "voice.mp3");
    const outputPath = path.join(tmpDir, "final.mp3");

    fs.writeFileSync(musicPath, Buffer.from(musicBuffer));

    // Step 3: Voice (spoken, poetic)
    const voiceBuffer = await generateVoice(lyrics, { style: "spoken", mock: isMock });
    fs.writeFileSync(voicePath, Buffer.from(voiceBuffer));

    // Step 4: Merge voice over music
    await mergeAudio(musicPath, voicePath, outputPath);

    res.json({
      success: true,
      lyrics,
      audioFile: outputPath,
      message: "Audio generated (see tmp/final.mp3)",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
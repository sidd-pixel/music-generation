import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export const validateInput = ({ mood, genre }) => {
  if (!mood || !genre) {
    throw new Error("Missing required fields: mood or genre");
  }
};

export const generateSilence = async (outputPath, duration = 3) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -q:a 9 -acodec libmp3lame "${outputPath}"`;
  try {
    await execAsync(cmd);
    return outputPath;
  } catch (e) {
    // fallback: write empty file
    fs.writeFileSync(outputPath, Buffer.alloc(0));
    return outputPath;
  }
};
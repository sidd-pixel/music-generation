import ffmpeg from "fluent-ffmpeg";

export const mergeAudio = (musicPath, voicePath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(musicPath)
      .input(voicePath)
      .complexFilter(["[0:a][1:a]amix=inputs=2:duration=longest"])
      .save(outputPath)
      .on("end", resolve)
      .on("error", reject);
  });
};
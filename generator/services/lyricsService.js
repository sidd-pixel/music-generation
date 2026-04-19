import axios from "axios";

export const generateLyrics = async ({ mood, genre }) => {
  const prompt = `
    Write a ${mood} ${genre} song.
    Keep it short (4-6 lines).
  `;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      }
    }
  );

  return res.data.choices[0].message.content;
};
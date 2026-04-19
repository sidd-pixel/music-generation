export const buildPrompt = ({ mood, genre, energy }) => {
  return `
    Create a ${mood} ${genre} music track.
    Energy level: ${energy}.
    Use rich instrumentation and cinematic feel.
    No lyrics unless specified.
  `;
};
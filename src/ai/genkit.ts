import {genkit} from 'genkit';
import {groq} from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq()],
  model: 'groq/gemma2-9b-it',
});

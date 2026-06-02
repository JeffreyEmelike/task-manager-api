import OpenAI from "openai";
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
// Take text, retuen an array of 1536 numbers
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!openai) {
    return Array(1536).fill(0); // fake embedding for tests
  }
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small", //cheapest, good quality
    input: text,
  });
  return response.data[0].embedding;
};

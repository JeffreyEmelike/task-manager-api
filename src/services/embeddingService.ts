import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });

// Take text, retuen an array of 1536 numbers
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small", //cheapest, good quality
    input: text,
  });
  return response.data[0].embedding;
};

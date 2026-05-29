import Anthropic from "@anthropic-ai/sdk";
import Task from "../models/Task";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const generateTags = async (taskId: string): Promise<string[]> => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Build the prompt
  const prompt = ` You are a project management assistant. 
  Read the task below and suggest 2-5 short category labels. 
  Respond ONLY with a JSON object. No explanation. No markdown. 
  Task title: ${task.title}
  Description: ${task.description ?? "No description provided"} \
  
  Respond with exactly this shape: 
  { "tags": ["tag1", "tag2", "tag3" ] }
   `;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 128,
    messages: [{ role: "user", content: prompt }],
  });

  // Extract the text from the response
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Parse and validate the response
  try {
    const parsed = JSON.parse(text) as { tags: string[] };
    if (!Array.isArray(parsed.tags)) throw new Error("Bad shape");
    return parsed.tags.slice(0, 5);
  } catch {
    return [];
  }
};

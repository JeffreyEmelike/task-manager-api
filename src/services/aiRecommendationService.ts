import Anthropic from "@anthropic-ai/sdk";
import Task from "../models/Task";

interface Recommendation {
  suggestedPriority: "low" | "medium" | "high" | "critical";
  suggestedAssigneeId?: string;
  reasoning: string;
}

export const recommendForTask = async (
  taskId: string,
): Promise<Recommendation> => {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const task = await Task.findById(taskId).populate("project");
  if (!task) throw new Error("Task not found");

  // Build a structured prompt for the AI
  const prompt = `
    You are a project management assistant. 
    Analyse this task and respond in JSON only. 
    Task title: ${task.title}
    Description: ${task.description ?? "none"}
    Current status: ${task.status}
    Current priority: ${task.priority}
    Due Date: ${task.dueDate?.toISOString() ?? "not set"}
    Respond with this exact JSON shape:
    {
    "suggestedPriority": "low|medium|high|critical",
    "reasoning": "one sentence explanation"
    }
    `;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return JSON.parse(text) as Recommendation;
};

import Task from "../models/Task";
import { generateEmbedding } from "./embeddingService";

export const semanticSearch = async (
  query: string,
  workspaceId: string,
  limit = 10,
): Promise<unknown[]> => {
  // 1. Turn the search query into a vector
  const queryVector = await generateEmbedding(query);

  // 2. MongoDB aggregation with $vectorSearch stage
  const results = await Task.aggregate([
    {
      $vectorSearch: {
        index: "tasks_vector_index",
        path: "embedding",
        queryVector,
        numCandidates: 100, // examine 100 candidates
        limit, // return top N
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        status: 1,
        priority: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
  return results;
};

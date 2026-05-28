import { Request, Response, NextFunction } from "express";
import { semanticSearch } from "../services/searchService";

// GET /api/search?q=your+search+query
export const search = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query?.trim()) {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;

    // semanticSearch expects a string for the limit parameter, so convert here
    const results = await semanticSearch(
      query,
      req.user!.workspaces[0]?.toString() ?? "",
      limit,
    );

    res.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

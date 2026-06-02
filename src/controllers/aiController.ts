import { Request, Response, NextFunction } from "express";
import Task from "../models/Task";
import { generateTags } from "../services/autoTagService";
import { recommendForTask } from "../services/aiRecommendationService";

// POST /api/tasks/:id/autotag
export const autoTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const tags = await generateTags(taskId);

    // save the tags to the task
    const task = await Task.findByIdAndUpdate(
      taskId,
      { aiTags: tags },
      { new: true },
    );
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json({ tags, task });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id/recommend
export const recommend = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    // check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // run the ai
    const recommendation = await recommendForTask(taskId);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
};

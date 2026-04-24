// In a task controller, emit after every change

import Task from "@/models/Task";
import { NextFunction, Request, Response } from "express";

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Emit to everyone in the workspace room
    const io = req.app.locals.io;
    io.to(task.project.toString()).emit("task:updated", task);

    res.json(task);
  } catch (error) {
    next(error);
  }
};

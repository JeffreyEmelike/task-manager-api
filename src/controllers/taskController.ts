// In a task controller, emit after every change

import { Types } from "mongoose";
import Task from "../models/Task";
import Activity from "../models/ActivityLog";
import { NextFunction, Request, Response } from "express";

// Get all tasks in a project
export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, priority, assignee } = req.query;
    // req.query reads optional filter params from the URL

    // Build a filter object dynamically — only add fields the client sent
    const filter: Record<string, unknown> = {
      project: req.params.pid, // always filter by project ID from the URL
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate("assignee", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// GET a single task
export const getTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "name email")
      .populate("comments.author", "name email");

    if (!task) {
      res.status(404).json({ message: "Task not found " });
      return;
    }
  } catch (error) {
    next(error);
  }
};

// CREATE a task
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const task = await Task.create({
      ...req.body,
      project: req.params.pid,
    });

    // Emit real-time event to all clients in this project's room
    const io = req.app.locals.io;
    if (io) {
      io.to(task.project.toString()).emit("task:created", task);
    }
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

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

    // Log the creation to the activity trail
    await logActivity({
      workspace: req.body.workspace, // client must send workspaceId in the body
      actor: req.user!._id,
      entity: "task",
      entityId: task._id.toString(),
      action: "created",
    });

    // Emit to everyone in the workspace room
    const io = req.app.locals.io;
    io.to(task.project.toString()).emit("task:updated", task);

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// DELETE a task
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    // findByIdAndDelete returns the deleted document or null

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Log the deletion before the task reference is gone
    await logActivity({
      workspace: req.body.workspace,
      actor: req.user!._id,
      entity: "task",
      entityId: task._id.toString(),
      action: "deleted",
    });

    // Emit real-time event
    const io = req.app.locals.io;
    if (io) {
      io.to(task.project.toString()).emit("task:deleted", { taskId: task._id });
      // Send only the ID — the client removes it from the UI by ID
    }

    res.status(204).send();
    // 204 No Content — success but nothing to return
    // Never send a body with 204
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:id/comments
export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { body } = req.body;
    if (!body?.trim()) {
      res.status(400).json({ message: "Comment body is required" });
      return;
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    task.comments.push({ author: req.user!._id, body, createdAt: new Date() });
    await task.save();

    // Populate the last comment's author before sending back
    await task.populate("comments.author", "name email");

    // Emit real time event
    const io = req.app.locals.io;
    io.to(task.project.toString()).emit("task:commented", {
      taskId: task._id,
      comment: task.comments[task.comments.length - 1],
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};
async function logActivity({
  workspace,
  actor,
  entity,
  entityId,
  action,
}: {
  workspace: any;
  actor: Types.ObjectId;
  entity: string;
  entityId: string;
  action: string;
}) {
  await Activity.create({ workspace, actor, entity, entityId, action });
}

import { Request, Response, NextFunction } from "express";
import Project from "../models/Project";

// GET api/workspaces/:wid/projects - get all projects
export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const projects = await Project.find({
      workspace: req.params.wid,
    }).populate("owner", "name email");
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// POST /api/workspaces/:wid/projects - create new project
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await Project.create({
      ...req.body,
      workspace: req.params.wid,
      owner: req.user!._id,
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/projects/:id
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const allowed = ["title", "description", "status", "tags", "dueDate"];
    const updates: Record<string, unknown> = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!project) {
      res.status(401).json({ message: "Not  found" });
      return;
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

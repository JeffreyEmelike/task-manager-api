import { Request, Response, NextFunction } from "express";
import Workspace from "../models/Workspace";
import User from "../models/User";

// POST /api/workspaces - create a new workspace
export const createWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name } = req.body;
    const workspace = await Workspace.create({
      name,
      owner: req.user!._id,
      members: [{ user: req.user!._id, role: "admin" }],
    });

    // Add this workspace to the user's workspace array
    await User.findByIdAndUpdate(req.user!._id, {
      $push: { workspaces: workspace!._id },
    });

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
};

// GET /api/workspaces - list all workspaces the user belongs to
export const getWorkspaces = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user!._id,
    }).populate("owner", "name email");
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
};

// GET /api/workspaces/:id - get a single workspace
export const getWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate(
      "members.user",
      "name email",
    );

    if (!workspace) {
      res.status(404).json({
        message: "Not found",
      });
      return;
    }
    res.json(workspace);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/workspaces/:id - update workspace name
export const updateWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true },
    );

    if (!workspace) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(workspace);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/workspaces/:id - delete a workspace
export const deleteWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await Workspace.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

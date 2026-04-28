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

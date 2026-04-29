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

// POST /api/workspaces/:id/invite - invite a member to a workspace
export const inviteMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, role = "member" } = req.body;

    // Find the user being invited
    const invitee = await User.findOne({ email });

    if (!invitee) {
      res.status(404).json({ message: "No user with this email" });
      return;
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    // Check if already a member
    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === invitee._id.toString(),
    );
    if (alreadyMember) {
      res.status(409).json({ message: "User is already a member" });
      return;
    }

    // Add the new member
    workspace.members.push({ user: invitee._id, role });
    await workspace.save();

    res.json({ message: `${invitee.name} added to workspace` });
  } catch (error) {
    next(error);
  }
};

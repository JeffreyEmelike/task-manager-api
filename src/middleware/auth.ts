import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import Workspace from "../models/Workspace";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// MIDDLEWARE 1 - verify the JWT in the Authorization header

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const user = await User.findById(payload.userId).select(
      "-passwordHash-refreshTokens",
    );
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    req.user = user; // attach to user request for controllers
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware 2 - enforce role restrictions
export const authorize =
  (...roles: IUser["role"][]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      // Get workspace ID from URL params — works for:
      // /api/workspaces/:id  and  /api/workspaces/:wid/projects
      const workspaceId = req.params.id || req.params.wid;

      if (!workspaceId) {
        // No workspace in the URL — fall back to global user role
        if (!roles.includes(req.user.role)) {
          res.status(403).json({ message: "Forbidden - insufficient role" });
          return;
        }
        next();
        return;
      }
      // Find the workspace and look up this user's membership role
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        res.status(404).json({ message: "Workspace not found" });
        return;
      }

      const membership = workspace.members.find(
        (m: { user: Types.ObjectId | string; role: IUser["role"] }) =>
          m.user.toString() === req.user!._id.toString(),
      );

      if (!membership || !roles.includes(membership.role)) {
        res.status(403).json({ message: "Forbidden - insufficient role" });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

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
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden - insufficient role" });
      return;
    }
    next();
  };

// Usage expample in a route file:
// router.delete('/:id', )

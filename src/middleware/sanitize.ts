import { Request, Response, NextFunction } from "express";

// Recursively strip keys that enable NoSQL operator injection
function scrub(obj: unknown): void {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete (obj as Record<string, unknown>)[key];
    } else {
      scrub((obj as Record<string, unknown>)[key]);
    }
  }
}

export const mongoSanitize = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  scrub(req.body);
  scrub(req.params);
  scrub(req.query); // mutates the object's keys, does NOT reassign req.query
  next();
};

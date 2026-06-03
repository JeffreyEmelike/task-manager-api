import { Request, Response, NextFunction } from "express";
import multer from "multer";
import Task from "../models/Task";
import { uploadToCloudinary } from "../services/uploadService";

// Multer config - store in memory, limit to 5MB
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/tasks/:id/attachments
export const attachFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const url = await uploadToCloudinary(
      req.file.buffer,
      `tasks/${req.params.id}`,
    );
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { attachments: url } },
      { returnDocument: "after" },
    );
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.json({ url, task });
  } catch (error) {
    next(error);
  }
};

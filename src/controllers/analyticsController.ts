import { Request, Response, NextFunction } from "express";
import Task from "../models/Task";
import { Types } from "mongoose";

// GET /api/workspaces/:id/analytics
// Returns task counts grouped by status for a workspace
export const getWorkspaceAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workspaceParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const workspaceId = new Types.ObjectId(workspaceParam);

    // Pipeline 1: task counts by status
    const byStatus = await Task.aggregate([
      {
        $match: {
          project: { $in: await getProjectIds(workspaceId) },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Pipeline 2: overdue tasks (past due date and not done)
    const overdue = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: "done" },
      project: { $in: await getProjectIds(workspaceId) },
    });

    // Pipeline 3: tasks grouped by assignee
    const byAssignee = await Task.aggregate([
      { $match: { project: { $in: await getProjectIds(workspaceId) } } },
      { $group: { _id: "$assignee", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: "$user.name",
          email: "$user.email",
          taskCount: "$count",
        },
      },
      { $sort: { taskCount: -1 } },
    ]);

    res.json({ byStatus, overdue, byAssignee });
  } catch (error) {
    next(error);
  }
};

// Helper: get all project IDs in a workspace
async function getProjectIds(workspaceId: Types.ObjectId) {
  const Project = (await import("../models/Project")).default;
  const projects = await Project.find({ workspace: workspaceId }, "_id");
  return projects.map((p) => p._id);
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

// Helper - generate short-lived access token (15 mins)
const signAccessToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });

//Helper - generate long-lived refresh token (7 days)
const signRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });

// POST /api/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    // passwordHash field triggers the pre-save bcrypt hook
    const user = await User.create({ name, email, passwordHash: password });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token on user document
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    next(error); // passes to global error handler
  }
};

// POST /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

//POST /api/auth/refresh
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ message: "No token" });
      return;
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as { userId: string };

    const user = await User.findById(payload.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      res.status(401).json({ message: "Token revoked" });
      return;
    }

    // Rotate - remove old token, issue new pair
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    const newAccess = signAccessToken(user.id);
    const newRefresh = signRefreshToken(user.id);
    user.refreshTokens.push(newRefresh);
    await user.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId; // Attach user ID to the request
    next(); // Proceed to the actual route handler
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
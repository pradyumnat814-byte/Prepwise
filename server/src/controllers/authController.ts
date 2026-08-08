import { Request, Response } from "express";
import { User } from "../models/User";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { AuthenticatedRequest } from "../middleware/auth";

// REGISTER NEW USER
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, githubUrl } = req.body;

    if (!email || !password || !githubUrl) {
      res.status(400).json({ error: "Email, password, and GitHub URL are required." });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: "User already exists with this email." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, passwordHash, githubUrl });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: user._id,
        email: user.email,
        githubUrl: user.githubUrl,
      },
    });
  } catch (error) {
    console.error("[Auth Controller Error]: Register failed", error);
    res.status(500).json({ error: "Internal server error during registration." });
  }
};

// LOGIN USER
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        githubUrl: user.githubUrl,
      },
    });
  } catch (error) {
    console.error("[Auth Controller Error]: Login failed", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
};

// GET CURRENT USER PROFILE (PROTECTED ROUTE)
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
};
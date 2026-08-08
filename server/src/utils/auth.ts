import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

const SALT_ROUNDS = 10;

// Hash password before saving to DB
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare plain-text password with stored hash
export const comparePassword = async (
  plainText: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(plainText, hash);
};

// Generate JWT token containing the user's Mongo ID
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

// Verify token signature and return payload
export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, ENV.JWT_SECRET) as { userId: string };
};
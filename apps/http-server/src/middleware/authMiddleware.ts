import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Please Add JWT_SECRET to your env");
}



function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.token as string | undefined;

  if (!token) {
    res.status(403).json({
      error: "Please Provide token",
    });
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: string };

    if (decoded?.userId) {
      (req as AuthenticatedRequest).userId = decoded.userId;
      next();
    } else {
      res.status(403).json({ error: "Please Login" });
      return;
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server error" });
    return;
  }
}

export default authMiddleware;

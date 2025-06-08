import { Request } from "express"
import z from 'zod';

export interface AuthenticatedRequest extends Request {
    userId?: string;
  }


export const UserAuth = z.object({
    email: z.string().email({ message: "Invalid Email" }),
    password: z.string().min(6, { message: "Too Short" }).max(100, { message: " Tooo Long" }).trim(),
})

export type User = z.infer<typeof UserAuth>
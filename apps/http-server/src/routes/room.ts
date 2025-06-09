import { Router, Response, RequestHandler } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { AuthenticatedRequest } from "../types/auth.js";
import { prisma } from "@repo/database";

const roomRouter = Router();
roomRouter.use(authMiddleware);

function generateRoomId(): number {
    return Math.floor(10000 + Math.random() * 90000);
}

roomRouter.post('/create', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const room = await prisma.room.create({
            data: {
                roomId: generateRoomId(),
                userId: req.userId!
            },
        });
        res.status(201).json({
            message: "Room Created Successfully",
            roomId: room.roomId,
        })
    } catch (e) {
        res.status(500).json({
            message: "Internal Server Error",
        })
    }

})

//TODO : ADD AN ENDPOINT FOR RETERIEVING ALL CHATS OF A ROOM
export default roomRouter
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

roomRouter.get('/chat/:roomId', async (req: AuthenticatedRequest, res: Response) => {
    const roomId = parseInt(req.params.roomId);
    if (isNaN(roomId)) {
        res.status(400).json({
            message: "Invalid room ID",
        });
        return 
    }
    try {
        const chats = await prisma.chat.findMany({
            where: {
                roomId: roomId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy:{
                id:'desc'
            },
            take:50
    });
        if (chats.length === 0) {
             res.status(404).json({
                message: "No chats found for this room",
            });
            return
        }
        res.status(200).json({
            message: "Chats retrieved successfully",
            chats: chats.map(chat => ({
                id: chat.id,
                message: chat.message,
                sender: {
                    id: chat.sender.id,
                    name: chat.sender.name,
                },
            })),
        });
        return;
    } catch (e) {
        console.error("Error retrieving chats:", e);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});

export default roomRouter
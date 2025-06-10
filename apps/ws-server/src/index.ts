import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { configDotenv } from 'dotenv';
import { AuthenticatedRequest, JWTPayload } from './types/auth';

configDotenv();

const JWT_SECRET: string = process.env.JWT_SECRET || 'hehehehehehe';

const wss = new WebSocketServer({
  port: 8080,
  verifyClient: (info: { req: IncomingMessage }) => {
    try {
      const headers = info.req.headers;
      const token = headers.token as string;
      if (!token) {
        console.log('No token header provided');
        return false;
      }
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      console.log('JWT verified successfully:', decoded);
      (info.req as AuthenticatedRequest).user = decoded;
      return true;
    } catch (error) {
      console.log('JWT verification failed:', (error as Error).message);
      return false;
    }
  },
});

interface Message {
  type: string;
  message?: string;
  roomId: number;
}

const userSocketMap = new Map<string, WebSocket>();
const roomUserMap = new Map<number, Set<string>>();

wss.on('connection', (ws: WebSocket, req: AuthenticatedRequest) => {
  const { userId } = req.user!;
  console.log('User connected:', userId);

  userSocketMap.set(userId, ws);

  ws.on('message', (message: WebSocket.Data) => {
    try {
      const parsedData: Message = JSON.parse(message.toString());

      if (parsedData.type === 'join_room') {
        if (!roomUserMap.has(parsedData.roomId)) {
          roomUserMap.set(parsedData.roomId, new Set());
        }
        roomUserMap.get(parsedData.roomId)!.add(userId);
        console.log(`${userId} joined room ${parsedData.roomId}`);
      }

      if (parsedData.type === 'leave_room') {
        roomUserMap.get(parsedData.roomId)?.delete(userId);
        console.log(`${userId} left room ${parsedData.roomId}`);
      }

      if (parsedData.type === 'chat') {
        const roomId = parsedData.roomId;
        const messageContent = parsedData.message || '';
        console.log(`User ${userId} sent message to room ${roomId}:`, messageContent);

        const recipients = roomUserMap.get(roomId);
        if (recipients) {
          recipients.forEach((uid) => {
            const socket = userSocketMap.get(uid);
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  type: 'message',
                  userId,
                  roomId,
                  message: messageContent,
                }),
              );
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing message:', (error as Error).message);
    }
  });

  ws.on('close', () => {
    console.log(`User ${userId} disconnected`);

    for (const [roomId, userSet] of roomUserMap) {
      userSet.delete(userId);
      if (userSet.size === 0) {
        roomUserMap.delete(roomId);
      }
    }

    userSocketMap.delete(userId);
  });
});

console.log('WebSocket server running on port 8080');

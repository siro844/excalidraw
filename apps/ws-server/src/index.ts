import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { configDotenv } from 'dotenv';
import { AuthenticatedRequest, JWTPayload } from './types/auth';
configDotenv()


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
  }
});
interface User {
  userId: String,
  rooms: Number[],
  ws: WebSocket
}

interface Message {
  type: String,
  message?: String,
  roomId: Number
}

const users: User[] = []


wss.on('connection', (ws: WebSocket, req: AuthenticatedRequest) => {
  const user = req.user!;
  console.log('User connected:', user);
  users.push({
    userId: user.userId,
    rooms: [],
    ws: ws
  })

  ws.on('message', (message: WebSocket.Data) => {
    const parsedData: Message = JSON.parse(message as unknown as string);
    try {
      if (parsedData.type === "join_room") {
        const user = users.find(x => x.ws === ws);
        if (!user) {
          return;
        }
        user?.rooms.push(parsedData.roomId);
      }

      if (parsedData.type === "leave_room") {
        const user = users.find(x => x.ws === ws);
        console.log()
        if (!user) {
          return;
        }
        user.rooms = user?.rooms.filter(x => x === parsedData.roomId);
      }

      if (parsedData.type === "chat") {
        const user = users.find(x => x.ws === ws);
        if (!user) {
          return;
        }
        console.log(users);
        const roomId = parsedData.roomId;
        const messageContent = parsedData.message || '';
        console.log(`User ${user.userId} sent message to room ${roomId}:`, messageContent);

        users.forEach(u => {
          if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
            u.ws.send(JSON.stringify({
              type: 'message',
              userId: user.userId,
              roomId: roomId,
              message: messageContent
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', (error as Error).message);
    }


  });

  ws.on('close', () => {
    console.log(`User ${user.userId} disconnected`);
  });
});

console.log('WebSocket server running on port 8080');
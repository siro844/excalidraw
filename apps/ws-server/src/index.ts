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

wss.on('connection', (ws: WebSocket, req: AuthenticatedRequest) => {
  const user = req.user!;
  console.log('User connected:', user);

  ws.on('message', (message: WebSocket.Data) => {
    console.log(`Message from user ${user.userId}:`, message.toString());
    ws.send('hehehehe')
  });

  ws.on('close', () => {
    console.log(`User ${user.userId} disconnected`);
  });
});

console.log('WebSocket server running on port 8080');
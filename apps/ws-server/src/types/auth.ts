import { IncomingMessage } from 'http';
export interface JWTPayload {
  userId: string;
}

export interface AuthenticatedRequest extends IncomingMessage {
  user?: JWTPayload;
}
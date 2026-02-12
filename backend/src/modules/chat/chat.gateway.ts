import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string[]>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      // Track online users
      const userSockets = this.onlineUsers.get(payload.sub) || [];
      userSockets.push(client.id);
      this.onlineUsers.set(payload.sub, userSockets);

      // Join user's personal room
      client.join(`user:${payload.sub}`);

      // Notify others that user is online
      this.server.emit('user:online', { userId: payload.sub });

      console.log(`User ${payload.sub} connected via WebSocket`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.onlineUsers.get(client.userId) || [];
      const remaining = userSockets.filter((id) => id !== client.id);

      if (remaining.length === 0) {
        this.onlineUsers.delete(client.userId);
        this.server.emit('user:offline', { userId: client.userId });
      } else {
        this.onlineUsers.set(client.userId, remaining);
      }

      console.log(`User ${client.userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    try {
      await this.chatService.getConversation(data.conversationId, client.userId);
      client.join(`conversation:${data.conversationId}`);
      return { success: true };
    } catch {
      return { success: false, error: 'Access denied' };
    }
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string; messageType?: string; attachments?: string[] },
  ) {
    if (!client.userId) return;

    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        client.userId,
        {
          content: data.content,
          messageType: data.messageType as any,
          attachments: data.attachments,
        },
      );

      // Broadcast to all participants
      this.server.to(`conversation:${data.conversationId}`).emit('message:new', message);

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    if (!client.userId) return;

    try {
      const message = await this.chatService.editMessage(data.messageId, client.userId, data.content);

      this.server.to(`conversation:${message.conversationId}`).emit('message:edited', message);

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    if (!client.userId) return;

    try {
      await this.chatService.deleteMessage(data.messageId, client.userId);

      this.server.to(`conversation:${data.conversationId}`).emit('message:deleted', {
        messageId: data.messageId,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    client.to(`conversation:${data.conversationId}`).emit('user:typing', {
      userId: client.userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    client.to(`conversation:${data.conversationId}`).emit('user:stopped_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
    });
  }

  // Utility method to send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}

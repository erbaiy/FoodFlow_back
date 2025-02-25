import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/socket',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SocketGateway.name);
  private clientMap: Map<string, string> = new Map(); // Store socketId -> clientId mapping

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientMap.delete(client.id); // Remove mapping on disconnect
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string, // Expecting the client ID as the room ID
  ) {
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
    this.clientMap.set(client.id, roomId); // Store the mapping socketId -> clientId
    client.emit('test', { message: 'Test message after joining room' });
    return { event: 'joinedRoom', data: roomId };
  }

  // Notify a specific deliverer
notifyDeliverer(delivererId: string, order: any) {
  this.logger.log(`Notifying deliverer ${delivererId} about order ${order._id}`);
  console.log(`Sending 'newOrder' to deliverer: ${delivererId}`); // Debugging log

  this.server.to(delivererId).emit('newOrder', {
      orderId: order._id,
      status: order.status,
  });
}
  // Notify a specific client
  notifyClient(clientId: string, order: any) {
    this.logger.log(`Notifying client ${clientId} about order ${order._id}`);
    for (const [socketId, storedClientId] of this.clientMap) {
      if (storedClientId === clientId) {
        this.server.to(socketId).emit('orderUpdate', order);
        return; // Found and notified
      }
    }
    this.logger.warn(`Client ${clientId} not found in clientMap.`);
  }
}

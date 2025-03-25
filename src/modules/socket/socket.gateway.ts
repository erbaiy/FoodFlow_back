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
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
    @MessageBody() roomId: string,
  ) {
    
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
    this.clientMap.set(client.id, roomId);
    client.emit('test', { message: 'Test message after joining room' });
    return { event: 'joinedRoom', data: roomId };
  }
  // Notify a specific deliverer
  notifyDeliverer(delivererId: string, order: any) {
    this.logger.log(
      `Notifying deliverer ${delivererId} about order ${order._id}`,
    );
    console.log(`Sending 'newCommand' to deliverer: ${delivererId}`); // Debugging log

    this.server.to(delivererId).emit('newCommand', {
      orderId: order._id,
      status: order.status,
      client: order.client,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      assignedTo: order.assignedTo,
      delivererId: delivererId,
      // Add any other relevant order details here
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
  //  Notify Restaurants Manager
  notifyRestaurantsManager(restoManager: string, order: any) {
    this.logger.log(
      `Notifying restaurant manager ${restoManager} about order ${order._id}`,
    );
    this.server.to(restoManager).emit('orderUpdate', {
      orderId: order._id,
      status: order.status,
    });

    // Notify when a new command is created
    if (order.status === 'created' || order.status === 'new') {
      this.server.to(restoManager).emit('newCommand', {
        orderId: order._id,
        status: order.status,
        createdAt: order.createdAt || new Date(),
      });
      this.logger.log(
        `New command notification sent to restaurant manager ${restoManager}`,
      );
    }
  }
  // notify Restaurants Manager that the order is delivered&
  notifyRestaurantsManagerDelivered(restoManagerId, order: any) {
    this.logger.log(
      `Notifying resto Manager ${restoManagerId} that the order whit id:  ${order._id}  is delevred `,
    );
    console.log(`Sending 'command is delevred  ' to rest manager: ${restoManagerId}`); // Debugging log

    this.server.to(restoManagerId).emit('change', {
      orderId: order._id,
      status: order.status,
      client: order.client,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      assignedTo: order.assignedTo,
      restoManagerId: restoManagerId,
    });
  }

}

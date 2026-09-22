import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const notificationController = new NotificationController();

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', {
    schema: {
      summary: 'Listar minhas notificações',
    } as any,
  }, notificationController.listMine.bind(notificationController));

  app.post('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Criar notificação/aviso',
    } as any,
  }, notificationController.create.bind(notificationController));

  app.patch('/:id/read', {
    schema: {
      summary: 'Marcar notificação como lida',
    } as any,
  }, notificationController.markAsRead.bind(notificationController));

  app.post('/read-all', {
    schema: {
      summary: 'Marcar todas como lidas',
    } as any,
  }, notificationController.markAllAsRead.bind(notificationController));

  app.delete('/:id', {
    schema: {
      summary: 'Excluir notificação',
    } as any,
  }, notificationController.delete.bind(notificationController));
}

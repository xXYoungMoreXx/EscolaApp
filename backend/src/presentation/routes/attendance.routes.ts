import { FastifyInstance } from 'fastify';
import { AttendanceController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const attendanceController = new AttendanceController();

export async function attendanceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Registrar presença',
    } as any,
  }, attendanceController.create.bind(attendanceController));

  app.post('/bulk', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Registrar presenças em lote',
    } as any,
  }, attendanceController.bulkCreate.bind(attendanceController));

  app.get('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Listar todas as presenças',
    } as any,
  }, attendanceController.getAll.bind(attendanceController));

  app.get('/class/:classId', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Buscar presenças por turma e data',
    } as any,
  }, attendanceController.getByClass.bind(attendanceController));

  app.delete('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Remover registro de presença',
    } as any,
  }, attendanceController.delete.bind(attendanceController));
}

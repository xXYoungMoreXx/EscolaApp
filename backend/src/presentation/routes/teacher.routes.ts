import { FastifyInstance } from 'fastify';
import { TeacherController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const teacherController = new TeacherController();

export async function teacherRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Cadastrar novo professor',
    } as any,
  }, teacherController.create.bind(teacherController));

  app.get('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Listar todos os professores',
    } as any,
  }, teacherController.getAll.bind(teacherController));

  app.get('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Buscar professor por ID',
    } as any,
  }, teacherController.getById.bind(teacherController));

  app.put('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Atualizar professor',
    } as any,
  }, teacherController.update.bind(teacherController));

  app.delete('/:id', {
    preHandler: [authorize('ADMIN')],
    schema: {
      summary: 'Remover professor',
    } as any,
  }, teacherController.delete.bind(teacherController));
}

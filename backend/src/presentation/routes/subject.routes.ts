import { FastifyInstance } from 'fastify';
import { SubjectController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const subjectController = new SubjectController();

export async function subjectRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Cadastrar nova matéria',
    } as any,
  }, subjectController.create.bind(subjectController));

  app.get('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Listar todas as matérias',
    } as any,
  }, subjectController.getAll.bind(subjectController));

  app.get('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Buscar matéria por ID',
    } as any,
  }, subjectController.getById.bind(subjectController));

  app.put('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Atualizar matéria',
    } as any,
  }, subjectController.update.bind(subjectController));

  app.delete('/:id', {
    preHandler: [authorize('ADMIN')],
    schema: {
      summary: 'Remover matéria',
    } as any,
  }, subjectController.delete.bind(subjectController));
}

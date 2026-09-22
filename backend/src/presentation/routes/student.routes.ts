import { FastifyInstance } from 'fastify';
import { StudentController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const studentController = new StudentController();

export async function studentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Cadastrar novo aluno',
    } as any,
  }, studentController.create.bind(studentController));

  app.get('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Listar todos os alunos',
    } as any,
  }, studentController.getAll.bind(studentController));

  app.get('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Buscar aluno por ID',
    } as any,
  }, studentController.getById.bind(studentController));

  app.put('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Atualizar aluno',
    } as any,
  }, studentController.update.bind(studentController));

  app.delete('/:id', {
    preHandler: [authorize('ADMIN')],
    schema: {
      summary: 'Remover aluno',
    } as any,
  }, studentController.delete.bind(studentController));
}

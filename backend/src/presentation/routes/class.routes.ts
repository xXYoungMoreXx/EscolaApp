import { FastifyInstance } from 'fastify';
import { ClassController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const classController = new ClassController();

export async function classRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Cadastrar nova turma',
    } as any,
  }, classController.create.bind(classController));

  app.get('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Listar todas as turmas',
    } as any,
  }, classController.getAll.bind(classController));

  app.get('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Buscar turma por ID',
    } as any,
  }, classController.getById.bind(classController));

  app.put('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Atualizar turma',
    } as any,
  }, classController.update.bind(classController));

  app.delete('/:id', {
    preHandler: [authorize('ADMIN')],
    schema: {
      summary: 'Remover turma',
    } as any,
  }, classController.delete.bind(classController));

  app.post('/:id/enroll', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Matricular aluno na turma',
    } as any,
  }, classController.enrollStudent.bind(classController));

  app.delete('/:id/students/:studentId', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Remover aluno da turma',
    } as any,
  }, classController.removeStudent.bind(classController));
}

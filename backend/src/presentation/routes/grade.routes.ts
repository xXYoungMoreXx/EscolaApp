import { FastifyInstance } from 'fastify';
import { GradeController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const gradeController = new GradeController();

export async function gradeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Cadastrar nota',
    } as any,
  }, gradeController.create.bind(gradeController));

  app.get('/', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Listar todas as notas',
    } as any,
  }, gradeController.getAll.bind(gradeController));

  app.get('/student/:studentId', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT')],
    schema: {
      summary: 'Buscar notas por aluno',
    } as any,
  }, gradeController.getByStudent.bind(gradeController));

  app.put('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR', 'TEACHER')],
    schema: {
      summary: 'Atualizar nota',
    } as any,
  }, gradeController.update.bind(gradeController));

  app.delete('/:id', {
    preHandler: [authorize('ADMIN', 'COORDINATOR')],
    schema: {
      summary: 'Remover nota',
    } as any,
  }, gradeController.delete.bind(gradeController));
}

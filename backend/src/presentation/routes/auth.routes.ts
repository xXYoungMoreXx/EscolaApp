import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', {
    schema: {
      summary: 'Login do usuário',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    } as any,
  }, authController.login.bind(authController));

  app.get('/me', {
    preHandler: [authenticate],
    schema: {
      summary: 'Dados do usuário autenticado',
    } as any,
  }, authController.me.bind(authController));

  app.get('/profile', {
    preHandler: [authenticate],
    schema: {
      summary: 'Perfil completo do usuário autenticado',
    } as any,
  }, authController.profile.bind(authController));

  app.post('/change-password', {
    preHandler: [authenticate],
    schema: {
      summary: 'Trocar a própria senha',
    } as any,
  }, authController.changePassword.bind(authController));

  app.get('/users', {
    preHandler: [authenticate, authorize('ADMIN')],
    schema: {
      summary: 'Listar usuários (admin)',
    } as any,
  }, authController.listUsers.bind(authController));

  app.patch('/users/:id/active', {
    preHandler: [authenticate, authorize('ADMIN')],
    schema: {
      summary: 'Ativar/desativar usuário (admin)',
    } as any,
  }, authController.setActive.bind(authController));
}

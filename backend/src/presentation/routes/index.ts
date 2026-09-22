import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { studentRoutes } from './student.routes';
import { teacherRoutes } from './teacher.routes';
import { subjectRoutes } from './subject.routes';
import { classRoutes } from './class.routes';
import { gradeRoutes } from './grade.routes';
import { attendanceRoutes } from './attendance.routes';
import { notificationRoutes } from './notification.routes';

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(studentRoutes, { prefix: '/api/students' });
  app.register(teacherRoutes, { prefix: '/api/teachers' });
  app.register(subjectRoutes, { prefix: '/api/subjects' });
  app.register(classRoutes, { prefix: '/api/classes' });
  app.register(gradeRoutes, { prefix: '/api/grades' });
  app.register(attendanceRoutes, { prefix: '/api/attendance' });
  app.register(notificationRoutes, { prefix: '/api/notifications' });
}

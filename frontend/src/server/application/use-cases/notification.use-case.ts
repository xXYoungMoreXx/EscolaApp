import { NotificationRepository } from '../../domain/repositories';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateNotificationUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(data: {
    userId?: string | null;
    targetRole?: string | null;
    schoolId?: string | null;
    title: string;
    message: string;
    type?: string;
  }) {
    const notification = await this.notificationRepository.create(data);
    logger.info(
      { notificationId: notification.id, userId: data.userId, targetRole: data.targetRole, schoolId: data.schoolId },
      'Notification created',
    );
    return notification;
  }
}

export class ListMyNotificationsUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(userId: string, role: string, onlyUnread = false, schoolId?: string) {
    const [items, unread] = await Promise.all([
      this.notificationRepository.findForUser(userId, role, onlyUnread, schoolId),
      this.notificationRepository.countUnread(userId, role, schoolId),
    ]);
    return { items, unread };
  }
}

export class MarkNotificationAsReadUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notificação', id);
    }
    const result = await this.notificationRepository.markAsRead(id, userId);
    if (!result) {
      throw new ForbiddenError('Você não pode marcar esta notificação como lida');
    }
    return result;
  }
}

export class MarkAllNotificationsAsReadUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(userId: string) {
    const count = await this.notificationRepository.markAllAsRead(userId);
    logger.info({ userId, count }, 'All notifications marked as read');
    return { count };
  }
}

export class DeleteNotificationUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(id: string, userId: string, role: string, schoolId?: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notificação', id);
    }
    // Gestor com escola só gerencia broadcasts da própria escola.
    if (schoolId && notification.schoolId && notification.schoolId !== schoolId) {
      throw new NotFoundError('Notificação', id);
    }
    const isOwner = notification.userId === userId;
    const isManager = role === 'ADMIN' || role === 'COORDINATOR';
    if (!isOwner && !isManager) {
      throw new ForbiddenError('Você não pode excluir esta notificação');
    }
    await this.notificationRepository.delete(id);
    logger.info({ notificationId: id }, 'Notification deleted');
  }
}

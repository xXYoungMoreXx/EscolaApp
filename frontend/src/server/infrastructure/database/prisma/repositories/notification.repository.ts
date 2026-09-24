import { PrismaClient } from '@prisma/client';
import { NotificationRepository } from '../../../../domain/repositories';
import { getPrisma } from '../client';

export class PrismaNotificationRepository implements NotificationRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  private markerKey(n: { title: string; message: string }) {
    return `${n.title}||${n.message}`;
  }

  async findForUser(userId: string, role: string, onlyUnread = false) {
    const [directs, broadcasts, markers] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, ...(onlyUnread ? { read: false } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.findMany({
        where: { userId: null, OR: [{ targetRole: role }, { targetRole: null }] },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.findMany({
        where: { userId, read: true },
        select: { title: true, message: true },
      }),
    ]);

    // Broadcasts já marcados como lidos (cópia-marcador) somem da lista
    const dismissed = new Set(markers.map((m) => this.markerKey(m)));
    const visibleBroadcasts = broadcasts
      .filter((b) => !dismissed.has(this.markerKey(b)))
      .map((b) => ({ ...b, read: false }));
    if (onlyUnread) {
      return [...directs, ...visibleBroadcasts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }
    return [...directs, ...visibleBroadcasts].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async countUnread(userId: string, role: string) {
    const [directUnread, broadcasts, markers] = await Promise.all([
      this.prisma.notification.count({ where: { userId, read: false } }),
      this.prisma.notification.findMany({
        where: { userId: null, OR: [{ targetRole: role }, { targetRole: null }] },
        select: { title: true, message: true },
      }),
      this.prisma.notification.findMany({
        where: { userId, read: true },
        select: { title: true, message: true },
      }),
    ]);
    const dismissed = new Set(markers.map((m) => this.markerKey(m)));
    const unreadBroadcasts = broadcasts.filter((b) => !dismissed.has(this.markerKey(b))).length;
    return directUnread + unreadBroadcasts;
  }

  async create(data: {
    userId?: string | null;
    targetRole?: string | null;
    title: string;
    message: string;
    type?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId ?? null,
        targetRole: data.targetRole ?? null,
        title: data.title,
        message: data.message,
        type: data.type ?? 'info',
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) return null;
    if (notification.userId && notification.userId !== userId) return null;
    if (notification.userId === null) {
      // Broadcast: cria cópia-marcador lida só para este usuário
      return this.prisma.notification.create({
        data: {
          userId,
          targetRole: null,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: true,
        },
      });
    }
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllAsRead(userId: string) {
    const [directs, broadcasts, markers] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId, read: false } }),
      this.prisma.notification.findMany({
        where: { userId: null },
        select: { title: true, message: true, type: true },
      }),
      this.prisma.notification.findMany({
        where: { userId, read: true },
        select: { title: true, message: true },
      }),
    ]);
    const dismissed = new Set(markers.map((m) => this.markerKey(m)));
    const pendingBroadcasts = broadcasts.filter((b) => !dismissed.has(this.markerKey(b)));

    const [directResult] = await Promise.all([
      this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } }),
      pendingBroadcasts.length > 0
        ? this.prisma.notification.createMany({
            data: pendingBroadcasts.slice(0, 50).map((b) => ({
              userId,
              targetRole: null,
              title: b.title,
              message: b.message,
              type: b.type,
              read: true,
            })),
          })
        : Promise.resolve({ count: 0 }),
    ]);
    return directResult.count + pendingBroadcasts.length;
  }

  async delete(id: string) {
    await this.prisma.notification.delete({ where: { id } });
  }
}

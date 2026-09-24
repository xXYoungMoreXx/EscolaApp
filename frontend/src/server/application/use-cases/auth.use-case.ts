import { UserRepository } from '../../domain/repositories';
import { hashPassword, comparePasswords, generateTokens } from '../../infrastructure/auth/jwt';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class LoginUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    if (!user.active) {
      throw new UnauthorizedError('Conta desativada');
    }

    const isValid = await comparePasswords(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id, role: user.role }, 'User logged in');

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }
}

export class ChangePasswordUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário', userId);
    }

    const isValid = await comparePasswords(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Senha atual incorreta');
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });

    logger.info({ userId }, 'Password changed');
    return { success: true };
  }
}

export class ListUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(params: { page: number; limit: number; search?: string }) {
    return this.userRepository.findAll(params);
  }
}

export class SetUserActiveUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string, active: boolean) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário', id);
    }

    const updated = await this.userRepository.update(id, { active });

    logger.info({ userId: id, active }, 'User active flag changed');

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: { email: string; password: string; role: string }) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email já cadastrado');
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    logger.info({ userId: user.id, role: user.role }, 'User created');

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

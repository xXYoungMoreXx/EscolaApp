import { SubjectRepository } from '../../domain/repositories';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { logger } from '../../shared/logger';

export class CreateSubjectUseCase {
  constructor(private subjectRepository: SubjectRepository) {}

  async execute(data: { name: string; code: string; description?: string; workload: number }) {
    const existing = await this.subjectRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError('Código da matéria já existe');
    }

    const subject = await this.subjectRepository.create(data);
    logger.info({ subjectId: subject.id, code: data.code }, 'Subject created');
    return subject;
  }
}

export class GetAllSubjectsUseCase {
  constructor(private subjectRepository: SubjectRepository) {}

  async execute(params: { page: number; limit: number; search?: string }) {
    return this.subjectRepository.findAll(params);
  }
}

export class GetSubjectByIdUseCase {
  constructor(private subjectRepository: SubjectRepository) {}

  async execute(id: string) {
    const subject = await this.subjectRepository.findById(id);
    if (!subject) {
      throw new NotFoundError('Matéria', id);
    }
    return subject;
  }
}

export class UpdateSubjectUseCase {
  constructor(private subjectRepository: SubjectRepository) {}

  async execute(id: string, data: any) {
    const subject = await this.subjectRepository.findById(id);
    if (!subject) {
      throw new NotFoundError('Matéria', id);
    }

    const updated = await this.subjectRepository.update(id, data);
    logger.info({ subjectId: id }, 'Subject updated');
    return updated;
  }
}

export class DeleteSubjectUseCase {
  constructor(private subjectRepository: SubjectRepository) {}

  async execute(id: string) {
    const subject = await this.subjectRepository.findById(id);
    if (!subject) {
      throw new NotFoundError('Matéria', id);
    }

    await this.subjectRepository.delete(id);
    logger.info({ subjectId: id }, 'Subject deleted');
  }
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
  /** Tenant: preenchido para usuários com escola; undefined = admin global/sem filtro. */
  schoolId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findByEmail(email: string): Promise<any | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
}

export interface NotificationRepository {
  findById(id: string): Promise<any | null>;
  findForUser(userId: string, role: string, onlyUnread?: boolean, schoolId?: string): Promise<any[]>;
  countUnread(userId: string, role: string, schoolId?: string): Promise<number>;
  create(data: {
    userId?: string | null;
    targetRole?: string | null;
    schoolId?: string | null;
    title: string;
    message: string;
    type?: string;
  }): Promise<any>;
  markAsRead(id: string, userId: string): Promise<any>;
  markAllAsRead(userId: string): Promise<number>;
  delete(id: string): Promise<void>;
}

export interface StudentRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findByRegistration(registration: string): Promise<any | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  count(schoolId?: string): Promise<number>;
}

export interface TeacherRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

export interface SubjectRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findByCode(code: string): Promise<any | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

export interface ClassRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

export interface GradeRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findByStudentAndClass(studentId: string, classId: string): Promise<any[]>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

export interface AttendanceRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findByClassAndDate(classId: string, date: Date): Promise<any[]>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  create(data: any): Promise<any>;
  upsert(data: any): Promise<any>;
  upsertMany(data: any[]): Promise<number>;
  delete(id: string): Promise<void>;
}

export interface GuardianRepository {
  findById(id: string, schoolId?: string): Promise<any | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<any>>;
  findByStudentId(studentId: string): Promise<any[]>;
  create(data: any): Promise<any>;
  linkStudents(guardianId: string, studentIds: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}

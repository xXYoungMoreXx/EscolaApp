import { z } from 'zod';

export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/[^\d]/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

export const emailSchema = z.string().email('Email inválido').max(255);
export const cpfSchema = z.string().refine(validateCPF, 'CPF inválido');
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Senha deve conter letras e números');
export const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255);

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'COORDINATOR']),
});

export const createPersonSchema = z.object({
  name: nameSchema,
  cpf: cpfSchema,
  rg: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const createStudentSchema = z.object({
  user: createUserSchema.extend({ role: z.literal('STUDENT') }),
  person: createPersonSchema,
});

export const createTeacherSchema = z.object({
  user: createUserSchema.extend({ role: z.literal('TEACHER') }),
  person: createPersonSchema,
  admission: z.string().datetime().optional(),
  salary: z.number().positive().optional(),
});

export const createSubjectSchema = z.object({
  name: nameSchema,
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  workload: z.number().int().positive().max(500),
});

export const createClassSchema = z.object({
  name: z.string().min(1).max(50),
  year: z.number().int().min(2020).max(2030),
  shift: z.enum(['morning', 'afternoon', 'night']),
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
});

export const createGradeSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  value: z.number().min(0).max(10),
  period: z.enum(['1trimestre', '2trimestre', '3trimestre', 'final']),
});

export const createAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  date: z.string().datetime(),
  status: z.enum(['PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE']),
  notes: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: passwordSchema,
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  targetRole: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'COORDINATOR']).optional().nullable(),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  type: z.enum(['info', 'success', 'warning', 'grade', 'enrollment', 'announcement']).default('info'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

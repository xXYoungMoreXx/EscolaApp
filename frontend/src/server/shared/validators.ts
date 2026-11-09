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
  schoolId: z.string().uuid().optional(), // alvo de escrita; só aceito de admin global (targetSchoolId)
});

export const createTeacherSchema = z.object({
  user: createUserSchema.extend({ role: z.literal('TEACHER') }),
  person: createPersonSchema,
  admission: z.string().datetime().optional(),
  salary: z.number().positive().optional(),
  schoolId: z.string().uuid().optional(),
});

export const createSubjectSchema = z.object({
  name: nameSchema,
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  workload: z.number().int().positive().max(500),
  schoolId: z.string().uuid().optional(),
});

export const createClassSchema = z.object({
  name: z.string().min(1).max(50),
  year: z.number().int().min(2020).max(2030),
  shift: z.enum(['morning', 'afternoon', 'night']),
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  schoolId: z.string().uuid().optional(),
});

export const createGradeSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  value: z.number().min(0).max(10),
  period: z.enum(['1trimestre', '2trimestre', '3trimestre', 'final']),
});

export const updateGradeSchema = z.object({
  value: z.number().min(0).max(10).optional(),
  period: z.enum(['1trimestre', '2trimestre', '3trimestre', 'final']).optional(),
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

export const createGuardianSchema = z.object({
  user: createUserSchema.extend({ role: z.literal('GUARDIAN') }),
  person: createPersonSchema,
  relationship: z.enum(['PAI', 'MAE', 'RESPONSAVEL']).optional(),
  studentIds: z.array(z.string().uuid()).min(1).max(20),
  schoolId: z.string().uuid().optional(),
});

export const createSchoolSchema = z.object({
  name: z.string().min(2, 'Nome da escola é obrigatório').max(80),
  code: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9-]{2,19}$/, 'Código: 3-20 caracteres de A-Z, 0-9 ou hífen')),
});

export const timetableSlotSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM'),
  room: z.string().max(30).optional(),
});

export const createTimetableSlotSchema = timetableSlotSchema.extend({ classId: z.string().uuid() });

export const updateTimetableSlotSchema = timetableSlotSchema.partial();

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

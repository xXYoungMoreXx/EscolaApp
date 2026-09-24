export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'COORDINATOR';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED';
export type Frequency = 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';

export interface UserProps {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private props: UserProps) {}

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get role(): UserRole { return this.props.role; }
  get active(): boolean { return this.props.active; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): Omit<UserProps, 'password'> {
    const { password, ...rest } = this.props;
    return rest;
  }
}

export interface PersonProps {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate?: Date;
  gender?: Gender;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Person {
  constructor(private props: PersonProps) {}

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get cpf(): string { return this.props.cpf; }

  toJSON(): PersonProps {
    return { ...this.props };
  }
}

export interface StudentProps {
  id: string;
  userId: string;
  personId: string;
  registration: string;
  status: EnrollmentStatus;
  enrollmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Student {
  constructor(private props: StudentProps) {}

  get id(): string { return this.props.id; }
  get registration(): string { return this.props.registration; }
  get status(): EnrollmentStatus { return this.props.status; }

  toJSON(): StudentProps {
    return { ...this.props };
  }
}

export interface TeacherProps {
  id: string;
  userId: string;
  personId: string;
  admission?: Date;
  salary?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Teacher {
  constructor(private props: TeacherProps) {}

  get id(): string { return this.props.id; }

  toJSON(): TeacherProps {
    return { ...this.props };
  }
}

export interface SubjectProps {
  id: string;
  name: string;
  code: string;
  description?: string;
  workload: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Subject {
  constructor(private props: SubjectProps) {}

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }

  toJSON(): SubjectProps {
    return { ...this.props };
  }
}

export interface ClassProps {
  id: string;
  name: string;
  year: number;
  shift: string;
  teacherId: string;
  subjectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SchoolClass {
  constructor(private props: ClassProps) {}

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get year(): number { return this.props.year; }

  toJSON(): ClassProps {
    return { ...this.props };
  }
}

export interface GradeProps {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  subjectId: string;
  value: number;
  period: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Grade {
  constructor(private props: GradeProps) {}

  get id(): string { return this.props.id; }
  get value(): number { return this.props.value; }
  get period(): string { return this.props.period; }

  toJSON(): GradeProps {
    return { ...this.props };
  }
}

export interface AttendanceProps {
  id: string;
  studentId: string;
  classId: string;
  date: Date;
  status: Frequency;
  notes?: string;
  createdAt: Date;
}

export class Attendance {
  constructor(private props: AttendanceProps) {}

  get id(): string { return this.props.id; }
  get status(): Frequency { return this.props.status; }

  toJSON(): AttendanceProps {
    return { ...this.props };
  }
}

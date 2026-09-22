import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'COORDINATOR';
}

export interface Person {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Student {
  id: string;
  userId: string;
  personId: string;
  registration: string;
  status: string;
  enrollmentDate: string;
  user: User;
  person: Person;
}

export interface Teacher {
  id: string;
  userId: string;
  personId: string;
  admission?: string;
  salary?: number;
  user: User;
  person: Person;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  workload: number;
}

export interface SchoolClass {
  id: string;
  name: string;
  year: number;
  shift: string;
  teacherId: string;
  subjectId: string;
  teacher: Teacher;
  subject: Subject;
  _count?: { classStudents: number };
  classStudents?: Array<{ student: Student }>;
}

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  subjectId: string;
  value: number;
  period: string;
  student: Student;
  subject: Subject;
  class: SchoolClass;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';
  notes?: string;
  student: Student;
  class: SchoolClass;
}

export interface AppNotification {
  id: string;
  userId: string | null;
  targetRole: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'grade' | 'enrollment' | 'announcement';
  read: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

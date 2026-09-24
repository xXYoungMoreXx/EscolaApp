import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@escola.com' },
    update: {},
    create: {
      email: 'admin@escola.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create coordinator user
  const coordPassword = await bcrypt.hash('coord123', 12);
  const coordPerson = await prisma.person.create({
    data: {
      name: 'Maria Coordenadora',
      cpf: '111.222.333-44',
      phone: '(11) 99999-9999',
    },
  });
  const coordUser = await prisma.user.upsert({
    where: { email: 'coordenador@escola.com' },
    update: {},
    create: {
      email: 'coordenador@escola.com',
      password: coordPassword,
      role: 'COORDINATOR',
    },
  });
  await prisma.teacher.upsert({
    where: { userId: coordUser.id },
    update: {},
    create: {
      userId: coordUser.id,
      personId: coordPerson.id,
    },
  });

  // Create teacher
  const teacherPassword = await bcrypt.hash('teacher123', 12);
  const teacherPerson = await prisma.person.create({
    data: {
      name: 'João Professor',
      cpf: '555.666.777-88',
      phone: '(11) 88888-8888',
    },
  });
  const teacherUser = await prisma.user.upsert({
    where: { email: 'professor@escola.com' },
    update: {},
    create: {
      email: 'professor@escola.com',
      password: teacherPassword,
      role: 'TEACHER',
    },
  });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      personId: teacherPerson.id,
      admission: new Date('2020-01-15'),
      salary: 5000,
    },
  });

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { code: 'MAT' },
      update: {},
      create: { name: 'Matemática', code: 'MAT', workload: 80 },
    }),
    prisma.subject.upsert({
      where: { code: 'POR' },
      update: {},
      create: { name: 'Português', code: 'POR', workload: 80 },
    }),
    prisma.subject.upsert({
      where: { code: 'HIS' },
      update: {},
      create: { name: 'História', code: 'HIS', workload: 60 },
    }),
    prisma.subject.upsert({
      where: { code: 'GEO' },
      update: {},
      create: { name: 'Geografia', code: 'GEO', workload: 60 },
    }),
    prisma.subject.upsert({
      where: { code: 'CIU' },
      update: {},
      create: { name: 'Ciências', code: 'CIU', workload: 60 },
    }),
    prisma.subject.upsert({
      where: { code: 'ING' },
      update: {},
      create: { name: 'Inglês', code: 'ING', workload: 40 },
    }),
  ]);

  // Create classes
  const classes = await Promise.all([
    prisma.class.upsert({
      where: { name_year_subjectId: { name: '3° Ano A', year: 2026, subjectId: subjects[0].id } },
      update: {},
      create: {
        name: '3° Ano A',
        year: 2026,
        shift: 'morning',
        teacherId: teacher.id,
        subjectId: subjects[0].id,
      },
    }),
    prisma.class.upsert({
      where: { name_year_subjectId: { name: '3° Ano B', year: 2026, subjectId: subjects[1].id } },
      update: {},
      create: {
        name: '3° Ano B',
        year: 2026,
        shift: 'morning',
        teacherId: teacher.id,
        subjectId: subjects[1].id,
      },
    }),
    prisma.class.upsert({
      where: { name_year_subjectId: { name: '2° Ano A', year: 2026, subjectId: subjects[0].id } },
      update: {},
      create: {
        name: '2° Ano A',
        year: 2026,
        shift: 'afternoon',
        teacherId: teacher.id,
        subjectId: subjects[0].id,
      },
    }),
  ]);

  // Create students
  const studentPassword = await bcrypt.hash('student123', 12);
  const students = [];

  for (let i = 1; i <= 5; i++) {
    const person = await prisma.person.create({
      data: {
        name: `Aluno ${i}`,
        cpf: `${String(i).padStart(3, '0')}.111.222-${String(i + 10).padStart(2, '0')}`,
        birthDate: new Date(2008, 0, i * 10),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        phone: `(11) ${String(900000000 + i).substring(0, 5)}-${String(9000 + i).padStart(4, '0')}`,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `aluno${i}@escola.com`,
        password: studentPassword,
        role: 'STUDENT',
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        personId: person.id,
        registration: `ALU2026${String(i).padStart(4, '0')}`,
        status: 'ACTIVE',
      },
    });

    students.push(student);
  }

  // Enroll students in classes
  for (const student of students) {
    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    await prisma.classStudent.upsert({
      where: { classId_studentId: { classId: randomClass.id, studentId: student.id } },
      update: {},
      create: {
        classId: randomClass.id,
        studentId: student.id,
      },
    });
  }

  // Create grades
  const periods = ['1trimestre', '2trimestre', '3trimestre'];
  for (const student of students) {
    for (const period of periods) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const schoolClass = classes.find(c => c.subjectId === subject.id);
      if (schoolClass) {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            classId: schoolClass.id,
            teacherId: teacher.id,
            subjectId: subject.id,
            value: Math.floor(Math.random() * 40 + 60) / 10, // 6.0 to 10.0
            period,
          },
        });
      }
    }
  }

  // Create attendance records
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);

    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    for (const student of students) {
      const schoolClass = classes[Math.floor(Math.random() * classes.length)];
      const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'];
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: schoolClass.id,
          date,
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log('---');
  console.log('Default credentials:');
  console.log('  Admin: admin@escola.com / admin123');
  console.log('  Coordinator: coordenador@escola.com / coord123');
  console.log('  Teacher: professor@escola.com / teacher123');
  console.log('  Student: aluno1@escola.com / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

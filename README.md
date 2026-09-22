# Sistema de Gestão Escolar

Sistema completo para cadastro e gestão de alunos, professores, matérias, turmas, notas e presenças.

## Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Fastify 5
- **ORM**: Prisma 5
- **Banco**: PostgreSQL 16
- **Cache**: Redis 7
- **Auth**: JWT + bcrypt
- **Validação**: Zod
- **Logger**: Pino

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui style
- **Charts**: Recharts
- **Forms**: React Hook Form
- **HTTP**: Axios

### Infra
- **Containerização**: Docker + Docker Compose
- **Arquitetura**: Clean Architecture + DDD
- **Padrões**: SOLID, TDD

## Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- PostgreSQL 16+ (ou usar Docker)

## Início Rápido

### Com Docker (Recomendado)

```bash
# Clonar o repositório
git clone <repo-url>
cd escola-system

# Iniciar todos os serviços
docker-compose up -d

# Executar migrações e seed
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma db seed

# Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:3333
# API Docs: http://localhost:3333/documentation
```

### Desenvolvimento Local

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Configure as variáveis
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (outra terminal)
cd frontend
npm install
npm run dev
```

## Credenciais de Teste

| Função | Email | Senha |
|--------|-------|-------|
| Admin | admin@escola.com | admin123 |
| Coordenador | coordenador@escola.com | coord123 |
| Professor | professor@escola.com | teacher123 |
| Aluno | aluno1@escola.com | student123 |

## Funcionalidades

### Gestão de Alunos
- Cadastro completo (dados pessoais, matrícula)
- Listagem com paginação e busca
- Edição e exclusão
- Status: Ativo, Inativo, Transferido, Formado

### Gestão de Professores
- Cadastro com dados profissionais
- Vinculação a matérias
- Controle de admissão e salário

### Matérias
- Cadastro com código único
- Carga horária
- Descrição

### Turmas
- Vinculação professor-matéria
- Turnos (manhã, tarde, noite)
- Matrícula de alunos na turma

### Notas
- Lançamento por aluno, turma e matéria
- Trimestres e nota final
- Visualização com cores (aprovado/reprovado)

### Presença
- Registro individual e em lote
- Status: Presente, Ausente, Justificado, Atrasado
- Filtro por turma e data

## Arquitetura

```
escola-system/
├── backend/
│   ├── src/
│   │   ├── domain/          # Entidades e repositórios
│   │   ├── application/     # Casos de uso
│   │   ├── infrastructure/  # Prisma, Auth, Cache
│   │   ├── presentation/    # Controllers, Routes, Middlewares
│   │   └── shared/          # Utils, Errors, Logger
│   ├── prisma/              # Schema e migrations
│   └── tests/               # Testes unitários
├── frontend/
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # UI Components
│   │   ├── lib/             # API, Auth, Utils
│   │   └── types/           # TypeScript types
│   └── public/
├── docker-compose.yml
└── README.md
```

## Segurança

- JWT com expiração
- Senhas com bcrypt (12 rounds)
- Rate limiting (100 req/min)
- Helmet headers
- CORS configurado
- Validação de entrada com Zod
- Autenticação e autorização por roles

## Testes

```bash
# Backend
cd backend
npm run test
npm run test:coverage
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário

### Students
- `GET /api/students` - Listar
- `POST /api/students` - Cadastrar
- `GET /api/students/:id` - Buscar
- `PUT /api/students/:id` - Atualizar
- `DELETE /api/students/:id` - Excluir

### Teachers
- `GET /api/teachers` - Listar
- `POST /api/teachers` - Cadastrar
- `GET /api/teachers/:id` - Buscar
- `PUT /api/teachers/:id` - Atualizar
- `DELETE /api/teachers/:id` - Excluir

### Subjects
- `GET /api/subjects` - Listar
- `POST /api/subjects` - Cadastrar
- `GET /api/subjects/:id` - Buscar
- `PUT /api/subjects/:id` - Atualizar
- `DELETE /api/subjects/:id` - Excluir

### Classes
- `GET /api/classes` - Listar
- `POST /api/classes` - Criar
- `GET /api/classes/:id` - Buscar
- `PUT /api/classes/:id` - Atualizar
- `DELETE /api/classes/:id` - Excluir
- `POST /api/classes/:id/enroll` - Matricular aluno
- `DELETE /api/classes/:id/students/:studentId` - Remover aluno

### Grades
- `GET /api/grades` - Listar
- `POST /api/grades` - Lançar
- `GET /api/grades/student/:studentId` - Notas do aluno
- `PUT /api/grades/:id` - Atualizar
- `DELETE /api/grades/:id` - Excluir

### Attendance
- `GET /api/attendance` - Listar
- `POST /api/attendance` - Registrar
- `POST /api/attendance/bulk` - Registrar em lote
- `GET /api/attendance/class/:classId` - Por turma
- `DELETE /api/attendance/:id` - Excluir

## Licença

MIT

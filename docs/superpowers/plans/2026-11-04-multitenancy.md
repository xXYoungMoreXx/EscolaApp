# Multi-tenancy por coluna — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Isolamento por escola: `School` + `schoolId` nas raízes do schema, `schoolId` no JWT, scoping em listagens/criações, admin global (schoolId null), cadastro público por código da escola, CRUD mínimo de escolas, E2E de isolamento.

**Architecture:** Coluna `schoolId` (nullable) em User/Student/Teacher/Guardian/Subject/Class + Notification; derivadas herdam por join. Helper `schoolWhere(server/shared/tenancy.ts)` centraliza o filtro; admin global (`schoolId == null`) recebe filtro vazio e pode escolher escola de destino no corpo de criações.

**Spec:** `docs/superpowers/specs/2026-11-04-multitenancy-design.md`

## Global Constraints
- Toda leitura de escopo vem do **token**; `schoolId` do corpo só é aceito de ADMIN global.
- Existência cruzada (entidade de outra escola) responde 404/400 — nunca 200.
- iUserRole unchanged; `requireRole` intacto.
- Suítes finais: e2e-auth e e2e-core verdes com novas seções de isolamento.

---

### Task 1: Schema + migration + backfill
- [ ] `School { id, name, code @unique, active Boolean @default(true) }`; relations `users/students/teachers/guardians/subjects/classes`.
- [ ] `schoolId String?` em User, Student, Teacher, Guardian, Subject, Class (+ relation `school`). `Notification.schoolId String?`.
- [ ] `npx prisma migrate dev --name multi-tenancy` (comandos no SQL da migration para backfill: INSERT escola `Escola Demo`/`ESCOLA-001`; UPDATE das 6 tabelas SET schoolId = escola existente). `prisma generate`.

### Task 2: Seed
- [ ] `seed.ts`: upsert da Escola Demo por code; coord/teacher/subjects/classes/students/guardian criados com `schoolId: demoSchool.id`; admin global sem schoolId (se já existe com vínculo, deixa); rodar `npx tsx prisma/seed.ts` e validar DB.

### Task 3: Tenancy util + JWT
- [ ] `src/server/shared/tenancy.ts`: `tenantOf(user: TokenPayload): string | null` (schoolId ou null p/ global), `tenantFilter(user)` → `{ schoolId }` | `{}`, `assertTenantMatch(a,b)` para pares? (nome melhor: `sameSchool()`).
- [ ] `TokenPayload.schoolId?: string`; `generateTokens` recebe; login/refresh/change-password passam `user.schoolId ?? undefined`.

### Task 4: Schools CRUD
- [ ] Validators `createSchoolSchema { name, code(3-20, uppercase-ish) }`; `School.use-case.ts` (Create, List) com regra: só token SEM schoolId (admin global) executa; REST `GET/POST /api/schools`.
- [ ] UI `/escolas` (list + create; sem update/delete); Sidebar: item "Escolas" só `role==='ADMIN' && !user.schoolId`; `PAGE_TITLES`.

### Task 5: Register por código
- [ ] `bodySchema` ganha `schoolCode: z.string().min(3)`; valida `School` por code+active (404/400 se inválida); `CreateStudentUseCase` recebe schoolId e seta em User+Student (Person fica global); UI de `/register`: campo "Código da escola".

### Task 6: Scoping nas use-cases existentes
Ordem por risco (todas: filtro de listagem + guard de escrita + schoolId de token):
- [ ] `subject.use-case.ts` (list filter, create com schoolId check cross em teacher)
- [ ] `class.use-case.ts` (list/detail/update/delete scoping; create com teacher/subject da mesma escola; enroll com aluno da mesma escola)
- [ ] `student.use-case.ts` (list/create/detail/update/delete; guard no `my-report`/grades list)
- [ ] `teacher.use-case.ts` (list/create/detail/update/delete)
- [ ] `guardian.use-case.ts` (create valida studentIds da escola; list scoping)
- [ ] `grade.use-case.ts` + `attendance.use-case.ts` (escopo pelo Class/Student; nota não cruza escolas)
- [ ] `timetable.use-case.ts` (classe fora da escola do ator → 404/403)
- [ ] `auth.use-case.ts` (GetAllUsers scoping; SetUserActive guard: alvo na mesma escola OU ator global)
- [ ] notifications: create com `schoolId` do ator (global admin → null = todos), list inclui da escola (school scope) ou global (global admin)
- [ ] Rota a rota: garantir que `schoolId` de corpo só é lido em rotas de admin global (criação de dados de escola alvo no Task 8 E2E)

### Task 7: Front types
- [ ] `api.ts`: `User.schoolId?: string | null`; registrar campos em telas que criam usuários (schools page; register form).

### Task 8: E2E + verificação
- [ ] Seção nova `9) ISOLAMENTO (multi-tenancy)` no `e2e-core.mjs`: cria Escola 2 (admin global), matéria/turma/aluno nela (schoolId no corpo), ativa; aluno2escola2 tenta grade/notas/timetable de escola 1 → 403/404; aluno1 consolidada não contém slots da escola 2; GET /api/schools como teacher → 403.
- [ ] `node tests/e2e-auth.mjs` e `node tests/e2e-core.mjs` verdes; tsc; build; smoke no navegador (criar escola, registro com código errado e certo); commit feat + push.

## Self-review
- Spec coberta: Tasks 1-5 = schema+seed+JWT+School+register; Task 6 = scoping; Task 8 = aceitação E2E/smoke; UI no 4/5.
- Sem placeholders; helpers de tenancy centralizam o filtro (sem deixar string mágica em cada query).

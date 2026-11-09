# Multi-tenancy por coluna (School + schoolId) — design

Data: 2026-11-04 (atualizado 2026-11-09) · Status: aprovado pelo usuário (admin global cria escolas; cadastro público por código da escola)

## Problema
Todas as listagens são globais: alunos, turmas, professores e notas de qualquer escola existente aparecem para todos os usuários. Não existe a noção de escola no schema.

## Decisões de produto (aprovadas)
- **Admin global**: usuário `ADMIN` com `schoolId = null` vê e opera todas as escolas, e é o único que cria novas escolas (`POST /api/schools`). Usuários com escola ficam presos a ela.
- **Cadastro público**: o formulário de registro pede o **código da escola** (`schoolCode`); a lista de escolas não é pública. Código inativo/desconhecido → cadastro recusado.
- **Identidade global**: e-mail e CPF continuam únicos globais (uma pessoa não se cadastra em duas escolas nesta fase). `Person` fica fora do scoping (camada de identidade civil).
- **Única escola por usuário**: `User.schoolId` único destino; não há movimentação entre escolas.

## Schema
- Novo model `School` (id, name, code @unique, active default true).
- `schoolId` (nullable) em: `User`, `Student`, `Teacher`, `Guardian`, `Subject`, `Class`.
- `Notification` ganha `schoolId` nullable (broadcast por papel passa a ser por escola; null = todas).
- `Grade`, `Attendance`, `ClassStudent`, `TimetableSlot`, `StudentGuardian`, `PasswordResetRequest` **não** ganham coluna: herdam isolamento pelo join com `Class`/`Student`/`User` (nota só nasce entre aluno e turma da mesma escola).
- Migration única: cria tabela + colunas + backfill (todo dado existente → escola seed `Escola Demo`, code `ESCOLA-001`).
- Seed: admin global (sem escola), todos os demais vínculos (coordenador, professor, matérias, turmas, alunos, responsável) na Escola Demo.

## Transport
- `TokenPayload.schoolId?: string` — embutido em login, refresh e change-password (re-emissão). `requireAuth` devolve o token com `schoolId`; nenhuma leitura confia em `schoolId` do corpo — **só do token**.
- Exceção: ADMIN global escolhe a escola de destino em criações via `schoolId` no corpo (validado como escola existente/ativa); usuários com escola que enviam `schoolId` divergente → 403.

## Scoping (camada de use-case)
- Helper `schoolWhere(user)` → `schoolId = user.schoolId` (ou sem filtro para admin global); toda listagem entra no `where`.
- Detalhe/PUT/DELETE: entidade deve pertencer à escola do ator (senão 404, sem vazar existência) — grade/attendance via checagem do `Class` da nota.
- Criações: escrevem `schoolId` do token (ou da escola validada no corpo para admin global).
- Cross-school em criação (turma com professor de outra escola, matrícula de aluno de outra escola, nota fora da escola da turma) → 400/404 de validação.
- `/api/auth/users` e `SetUserActive`: admin com escola só enxerga/altera usuários da própria escola.

## Rotas novas
- `GET /api/schools` (admin global) · `POST /api/schools` (admin global; nome + código único).
- Editar/desativar escola: fora do escopo (corte consciente — próximo ciclo).

## Front
- `User` type ganha `schoolId?: string | null`.
- Página `/escolas` (menu só para admin global): listar + criar.
- Registro: campo obrigatório "Código da escola".

## E2E (isolation)
- Admin global cria Escola 2 via API → cria matéria/turma/aluno nela (com `schoolId` no corpo) → aluno de lá ativa.
- Asserts: aluno de fora não lê turma/aluno/notas da outra escola (403); grade consolidada de um aluno não contém slots da outra escola; listagens de usuários/escolas respeitam o papel; cadastro público exige código válido.

## Aceitação
tsc limpo · build OK · e2e-auth e e2e-core 100% (novas seções 9) ISOLAMENTO) · smoke no navegador (admin global cria escola; aluno A não vê nada da B; registro com código).

## Não-metas
DB/esquema por tenant; pessoa em duas escolas; transferência de usuário entre escolas; CRUD completo de escola (update/delete); custom domain.

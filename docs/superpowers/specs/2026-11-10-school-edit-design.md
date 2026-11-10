# Design: Editar / Desativar Escolas

Data: 2026-11-10
Status: Aprovado

## Objetivo

Admin global edita nome e status (Ativa/Inativa) de uma escola. Fechura do
escopo deixado pelo item multi-tenancy (que entregou apenas criar/listar).

## Decisões (aprovadas em conversa)

1. **Código imutável**: o código da escola é identificador permanente usado
   no cadastro público; nunca pode ser alterado via API.
2. **Desativar só bloqueia novos cadastros**: usuários e dados existentes
   continuam funcionando normalmente. O registro público já busca
   `code + active`, então escola inativa → 404 no cadastro, sem cascade.

## Backend

### Rota

Novo `PUT /api/schools/[id]` (`frontend/src/app/api/schools/[id]/route.ts`),
mesmo padrão de `subjects/[id]`:

```
assertGlobalAdmin (requireAuth → requireRole('ADMIN') + schoolId nulo)
rate limit clientKey(req, 'write')
updateSchoolSchema.parse(await req.json())
UpdateSchoolUseCase(id, body)
ok(result)
```

- Usuário com escola (ou papel errado) → 403 `ForbiddenError`.
- Sem auth → 401.
- Payload inválido → 422 (padrão `fail`).
- Escola inexistente → 404.

`assertGlobalAdmin` atualmente é função local em `route.ts`. Move-se para
`school.use-case.ts` e exporta (usada por ambas as rotas; direktor único).

### Use-case

`UpdateSchoolUseCase` em `frontend/src/server/application/use-cases/school.use-case.ts`:

- `execute(id: string, data: { name?: string; active?: boolean })`
- Pelo menos um campo obrigatório → senão `ValidationError`.
- `name` (se presente): 2–80 chars (Zod) — reusa padrao de `createSchoolSchema`.
- **`code`, `id`, `createdAt` etc. no corpo → rejeitados** por allowlist do
  Zod (`.strict()`), evitando mutação acidental do código.
- Busca por `prisma.school.findUnique({ id })` → 404 `NotFoundError('Escola', id)` se ausente.
- Update só com os campos presentes; retorna escola atualizada.
- `logger.info({ schoolId }, 'School updated')`.

### Validators

`updateSchoolSchema` em `validators.ts`, junto do `createSchoolSchema`:

```ts
z.object({
  name: z.string().min(2).max(80).optional(),
  active: z.boolean().optional(),
}).strict()
```

## Frontend (`/escolas`)

- Coluna extra na tabela: botão "Editar" por linha.
- Modal em modo edição reusa o form existente: nome editável, código
  desabilitado (cinza) com nota "código é permanente", checkbox Ativa.
- Submit → `api.put('/api/schools/[id]', { name, active })`; toast de
  sucesso/erro; refresh da tabela.
- `backend schoolCode` no cadastro público não muda (busca já filtra active).

## Testes

e2e-core seção 9 (ISOLAMENTO), novos asserts após criação da Escola 2:

1. PUT nome da Escola 2 (global admin) → 200 e nome alterado na resposta.
2. PUT com `code` no corpo → 422 (código imutável).
3. PUT por coordenador da Escola 1 → 403 (não global).
4. PUT escola inexistente → 404.
5. PUT desativando uma escola de teste → cadastro público com o código dela → 404;
   reativar → cadastro volta a 201/409 consistente. (Usar escola E2E
   dedicada para não quebrar registro dos casos demais — ver plano.)

## Fora de escopo

- Cascade de desativação (bloqueio de login, arquivamento de registros).
- DELETE de escola; mudança de código; hierarquia de escolas.

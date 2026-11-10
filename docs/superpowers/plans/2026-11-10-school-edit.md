# Editar / Desativar Escolas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin global edita nome e status (Ativa/Inativa) de uma escola via `PUT /api/schools/[id]` e pela página `/escolas`; código é imutável e desativar só bloqueia novos cadastros.

**Architecture:** Segue o padrão de rota `subjects/[id]` (requireAuth → gate → rate limit → Zod → use-case). O gate de admin global (`assertGlobalAdmin`) mora no `school.use-case.ts` (donos único, compartilhado por GET/POST/PUT) e não importa a camada HTTP — verifica `role`/`schoolId` direto no `TokenPayload`. Sem migration: nenhuma coluna nova.

**Tech Stack:** Next.js App Router (route handlers), Prisma, Zod, e2e próprios em `tests/e2e-core.mjs`, UI React em `src/app/escolas/page.tsx`.

## Global Constraints

- Código da escola é **imutável**: qualquer prop `code` no corpo do PUT → 422 (Zod `.strict()` não conhece a chave).
- Desativar escola **não** bloqueia logins/usuários existentes — apenas o cadastro público (que já busca `code + active`; escola inativa → 404 no registro).
- Gate: apenas ADMIN com `schoolId` nulo gerencia escolas (403 caso contrário).
- Zod com `.refine` exige ao menos um campo (`name`/`active`).
- Suíte e2e simula IP próprio (`x-forwarded-for: 203.0.113.10` no `call()` do e2e-core — já existe); **não adicionar logins novos** (teto 10/min).
- Resposta de sucesso do PUT: `ok(result)` → 200 com corpo `{ success, data: School }`.
- Rate limit de escrita: `allow(clientKey(req, 'write'))` antes do parse.

---

### Task 1: Backend — validador, use-case e rota PUT

**Files:**
- Modify: `frontend/src/server/shared/validators.ts` (após `createSchoolSchema`, linha ~127)
- Modify: `frontend/src/server/application/use-cases/school.use-case.ts` (arquivo inteiro, substituído)
- Modify: `frontend/src/server/application/use-cases/index.ts:11`
- Modify: `frontend/src/app/api/schools/route.ts` (remover helper local, importar `assertGlobalAdmin`)
- Create: `frontend/src/app/api/schools/[id]/route.ts`

**Interfaces:**
- Consumes: `requireAuth`, `ok`, `okCreated`, `fail` de `@/server/http`; `allow`/`clientKey`/`rateLimited` de `@/server/rate-limit`; `getPrisma()`; `TokenPayload`.
- Produces: `updateSchoolSchema` (Zod → `{ name?, active? }`), `assertGlobalAdmin(actor: TokenPayload)` (throws `ForbiddenError`), `UpdateSchoolUseCase.execute(id, data)` → `Promise<School>` (lança `NotFoundError('Escola', id)`).

- [ ] **Step 1: Adicionar `updateSchoolSchema` em `validators.ts`**

Logo após o bloco de `createSchoolSchema` (linha 127, após a chave de fechamento):

```ts
export const updateSchoolSchema = z
  .object({
    name: z.string().min(2, 'Nome da escola é obrigatório').max(80).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((d) => d.name !== undefined || d.active !== undefined, {
    message: 'Informe nome ou status (Ativa/Inativa) para atualizar',
  });
```

- [ ] **Step 2: Substituir `school.use-case.ts` inteiro**

```ts
import { getPrisma } from '../../infrastructure/database/prisma/client';
import type { TokenPayload } from '../../infrastructure/auth/jwt';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../shared/logger';

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,19}$/;

// Gate compartilhado pelas rotas de escola: apenas ADMIN sem escola.
// Vive no use-case (não na rota) para não duplicar e não importar a camada HTTP.
export function assertGlobalAdmin(actor: TokenPayload) {
  if (actor.role !== 'ADMIN') throw new ForbiddenError('Acesso negado');
  if (actor.schoolId) throw new ForbiddenError('Apenas administrador global gerencia escolas');
}

export class CreateSchoolUseCase {
  async execute(data: { name: string; code: string }) {
    if (!CODE_RE.test(data.code)) {
      throw new ValidationError('Código deve ter 3-20 caracteres de A-Z, 0-9 ou hífen (começando por letra/número)');
    }
    const prisma = getPrisma();
    const exists = await prisma.school.findUnique({ where: { code: data.code }, select: { id: true } });
    if (exists) throw new ConflictError('Código de escola já cadastrado');

    const school = await prisma.school.create({ data: { name: data.name, code: data.code } });
    logger.info({ schoolId: school.id, code: school.code }, 'School created');
    return school;
  }
}

export class ListSchoolsUseCase {
  async execute(actor: TokenPayload) {
    assertGlobalAdmin(actor);
    return getPrisma().school.findMany({ orderBy: { createdAt: 'desc' } });
  }
}

export class UpdateSchoolUseCase {
  async execute(id: string, data: { name?: string; active?: boolean }) {
    const prisma = getPrisma();
    const exists = await prisma.school.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Escola', id);

    const patch: { name?: string; active?: boolean } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.active !== undefined) patch.active = data.active;

    const school = await prisma.school.update({ where: { id }, data: patch });
    logger.info({ schoolId: id, active: school.active }, 'School updated');
    return school;
  }
}
```

- [ ] **Step 3: Exportar em `use-cases/index.ts`**

Trocar a linha 11 por:

```ts
export { CreateSchoolUseCase, ListSchoolsUseCase, UpdateSchoolUseCase, assertGlobalAdmin } from './school.use-case';
```

- [ ] **Step 4: Atualizar `frontend/src/app/api/schools/route.ts`**

Remover a função local `assertGlobalAdmin` (linhas 11–16) e o import de `ForbiddenError` (linha 6), e importar o helper do use-case:

```ts
import { CreateSchoolUseCase, ListSchoolsUseCase, assertGlobalAdmin } from '@/server/application/use-cases';
```

GET e POST mantêm `requireAuth(req)` + `assertGlobalAdmin(user)` (sem `requireRole`).

- [ ] **Step 5: Criar `frontend/src/app/api/schools/[id]/route.ts`**

Usar o mesmo padrão de `Ctx` de `subjects/[id]/route.ts` (síncrono, `params.id`):

```ts
import { NextRequest } from 'next/server';
import { ok, fail, requireAuth } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { UpdateSchoolUseCase, assertGlobalAdmin } from '@/server/application/use-cases';
import { updateSchoolSchema } from '@/server/shared/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(req);
    assertGlobalAdmin(user);
    if (!(await allow(clientKey(req, 'write')))) return rateLimited();
    const body = updateSchoolSchema.parse(await req.json());
    return ok(await new UpdateSchoolUseCase().execute(params.id, body));
  } catch (error) {
    return fail(error);
  }
}
```

Editar se outros arquivos `[id]/route.ts` do projeto usarem forma diferente de `Ctx` (conferir `subjects/[id]/route.ts` linhas 1–20 e copiar o padrão deles, inclusive `noContent`/`ok` de onde vier).

- [ ] **Step 6: Provar por HTTP (dev server)**

Subir dev server (`npx next dev -p 3000` em background em `frontend/`), aguardar `/api/health` e rodar PowerShell:

```powershell
$jar = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body (@{ email='admin@escola.com'; password='admin123' } | ConvertTo-Json) -ContentType 'application/json' -WebSession $jar
$schools = Invoke-RestMethod -Uri http://localhost:3000/api/schools -WebSession $jar
$target = $schools.data[0].id
Invoke-RestMethod -Uri "http://localhost:3000/api/schools/$target" -Method PUT -WebSession $jar -Body (@{ name='Escola Demo' } | ConvertTo-Json) -ContentType 'application/json' | ConvertTo-Json -Depth 3
```

Esperado: 200, `success=true`, `data.active=true`.

- [ ] **Step 7: Checar tipos**

Run: `npx tsc --noEmit` (em `frontend/`)
Expected: `TSC:0`

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/server/shared/validators.ts frontend/src/server/application/use-cases/ frontend/src/app/api/schools/
git commit -m "feat: PUT /api/schools/[id] — editar nome e status da escola (codigo imutavel)"
```

---

### Task 2: UI — edição e toggle de status em `/escolas`

**Files:**
- Modify: `frontend/src/app/escolas/page.tsx` (editar modal + coluna de ações)

**Interfaces:**
- Consumes: `api.put('/api/schools/{id}', { name, active })` (axios wrapper `src/lib/api.ts`); `School` local já tem `active`.
- Produces: modal de edição com nome editável, código bloqueado, checkbox Ativa.

- [ ] **Step 1: Estender estado do componente**

Adicionar junto aos estados existentes (linhas 21–24):

```tsx
const [editing, setEditing] = useState<School | null>(null);
```

- [ ] **Step 2: Reusar o modal em modo edição**

O form existente passa a servir a dois modos:
- `handleSubmit` — se `editing`, chamar `api.put(\`/api/schools/${editing.id}\`, { 'name': formData.name, 'active': !!editing.active_toggle })`; senão POST como hoje.
- Abrir edição: botão por linha `onClick={() => { setEditing(s); setFormData({ name: s.name, code: s.code }); setShowModal(true); }}` (controlado por um `editActive` state boolean inicializado com `s.active`).

Estrutura de estado recomendada:

```tsx
const [editing, setEditing] = useState<School | null>(null);
const [editActive, setEditActive] = useState(true);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (editing) {
      await api.put(`/api/schools/${editing.id}`, { name: formData.name, active: editActive });
      toast.success('Escola atualizada!');
    } else {
      await api.post('/api/schools', { ...formData, code: formData.code.toUpperCase() });
      toast.success('Escola cadastrada!');
    }
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', code: '' });
    fetchData();
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || 'Erro ao salvar');
  }
};
```

Botão fechar modal deve limpar `setEditing(null)`.

No modal: título `editing ? 'Editar Escola' : 'Nova Escola'`; campo código com `disabled={!!editing}` e, em modo edição, hint `Código é permanente (usado no cadastro público)`; no modo edição renderizar checkbox:

```tsx
{editing && (
  <div>
    <label className="label flex items-center gap-2">
      <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
      Escola ativa (bloqueia apenas novos cadastros quando inativa)
    </label>
  </div>
)}
```

- [ ] **Step 3: Botão Editar na tabela**

Trocar a `Status` cell por célula com badge + botão:

```tsx
<td className="table-cell">
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
    {s.active ? 'Ativa' : 'Inativa'}
  </span>
</td>
<td className="table-cell">
  <button
    onClick={() => { setEditing(s); setFormData({ name: s.name, code: s.code }); setEditActive(s.active); setShowModal(true); }}
    className="text-sm text-primary-600 hover:underline"
  >
    Editar
  </button>
</td>
```

Atualizar `colSpan` do estado vazio de 3 para 4 e adicionar `<th>Ações</th>` no thead.

- [ ] **Step 4: Checar comportamento (build + smoke)**

Run: `npx tsc --noEmit && npm run build` — expected sem erros.

Smoke via browser (dev server): logar `admin@escola.com/admin123`, ir em `/escolas`, clicar Editar na linha da Escola Demo, alterar o nome para outro valor, Cadastrar, confirmar toast + linha atualizada; voltar o nome para `Escola Demo`. Alternativa se o browser travar: espelhar o PUT via chamada HTTP PowerShell igual ao Step 6 da Task 1 (o modal usa exatamente esse endpoint).

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/app/escolas/page.tsx
git commit -m "feat: UI de editar/desativar escola em /escolas (codigo bloqueado em modo edicao)"
```

---

### Task 3: e2e — asserts de edição/desativação e verificação final

**Files:**
- Modify: `frontend/tests/e2e-core.mjs` (seção `9) ISOLAMENTO`, após o assert `'admin global cria Escola 2'` e novo bloco `9c)`)

**Interfaces:**
- Consumes: helpers `call`, `newJar`, `ok`, `validCpf`, `STAMP`, sessões `JA` (admin global), `JC` (coordenador, já logado no bloco de professores), `schoolsRows`.
- Produces: nenhum (asserts).

- [ ] **Step 1: Asserts de PUT (inserir após o assert de escola duplicada, linha ~297)**

```js
// Edição: nome altera, código é imutável, só admin global.
r9 = await call('PUT', `/api/schools/${school2Id}`, { jar: JA, body: { name: `Escola E2E Dois Alt ${STAMP}` } });
ok(r9.status === 200 && r9.json?.data?.name === `Escola E2E Dois Alt ${STAMP}`, 'PUT renomeia escola (200)', JSON.stringify(r9.json)?.slice(0, 120));
r9 = await call('PUT', `/api/schools/${school2Id}`, { jar: JA, body: { name: 'Tentativa', code: 'HACK-CODE-1' } });
ok(r9.status === 422, 'PUT com código no corpo é recusado (422, código imutável)', JSON.stringify(r9.json)?.slice(0, 120));
r9 = await call('PUT', `/api/schools/00000000-0000-0000-0000-000000000000`, { jar: JA, body: { active: true } });
ok(r9.status === 404, 'PUT de escola inexistente → 404');
```

Nota: `school2Id` é definido na linha 294; artigo os asserts antes do cadastro de professor da Escola 2 para manter a leitura top-down.

- [ ] **Step 2: 9c) DESATIVAÇÃO (novo bloco após a limpeza 9b)**

```js
console.log('9c) DESATIVAÇÃO DE ESCOLA');
const SCHOOL3_CODE = `E2E-S3-${STAMP}`;
r9 = await call('POST', '/api/schools', { jar: JA, body: { name: 'Escola E2E Tres', code: SCHOOL3_CODE } });
ok(r9.status === 201, 'admin global cria Escola 3');
const school3Id = r9.json?.data?.id;

// Cadastro público funciona com a escola ATIVA.
r9 = await call('POST', '/api/auth/register', {
  body: {
    user: { email: `aluno-s3-${STAMP}@escola.com`, password: 'student123' },
    person: { name: 'Aluno Escola 3', cpf: validCpf(STAMP + 503) },
    schoolCode: SCHOOL3_CODE,
  },
});
ok(r9.status === 201, 'cadastro público com escola ativa (201)');
r9 = await call('GET', `/api/auth/users?search=aluno-s3-${STAMP}@escola.com&limit=1`, { jar: JA });
const s3UserId = (r9.json?.data?.data ?? r9.json?.data ?? [])[0]?.id;
ok(!!s3UserId, 'usuário da Escola 3 existe para o teste de desativação');

// Desativa → cadastro público com o código passa a 404; conta existente segue ativável.
r9 = await call('PUT', `/api/schools/${school3Id}`, { jar: JA, body: { active: false } });
ok(r9.status === 200 && r9.json?.data?.active === false, 'PUT desativa escola (200, active=false)');
r9 = await call('POST', '/api/auth/register', {
  body: {
    user: { email: `aluno-s3b-${STAMP}@escola.com`, password: 'student123' },
    person: { name: 'Aluno Escola 3 Bloqueado', cpf: validCpf(STAMP + 504) },
    schoolCode: SCHOOL3_CODE,
  },
});
ok(r9.status === 404, 'cadastro público com escola inativa → 404', JSON.stringify(r9.json)?.slice(0, 120));
r9 = await call('PATCH', `/api/auth/users/${s3UserId}/active`, { jar: JA, body: { active: true } });
ok(r9.status === 200, 'conta já existente da escola inativa é ativável (sem bloqueio de escola)');

// Reativa.
r9 = await call('PUT', `/api/schools/${school3Id}`, { jar: JA, body: { active: true } });
ok(r9.status === 200 && r9.json?.data?.active === true, 'PUT reativa escola (200, active=true)');
```

- [ ] **Step 3: Rodar as suítes**

Run (em `frontend/`):

```powershell
node tests/e2e-auth.mjs; node tests/e2e-core.mjs
```

- e2e-auth pode rodar antes ou depois — usa IP simulado próprio (`203.0.113.11`).
- Expected: **e2e-core 107+/0 falhas** (101 anteriores + 6 novos asserts), **e2e-auth 40/40**.
- Se falhar por rate limit de login (429): conferir que nenhum `call('POST','/api/auth/login')` novo foi adicionado (a seção 9c não loga).

- [ ] **Step 4: Verificação de produção**

Run (em `frontend/`): `npx tsc --noEmit; npm run build`
Expected: `TSC:0`, `BUILD:0` (com `/escolas` presente).

- [ ] **Step 5: Commit + push**

```powershell
git add frontend/tests/e2e-core.mjs
git commit -m "test: asserts e2e de editar/desativar escolas (PUT nome, codigo imutavel, cadastro bloqueado)"
git push
```

- [ ] **Step 6: Smoke de UI final (se Task 2 Step 4 não rodou o smoke)**

Repetir o smoke do Task 2 Step 4 contra o dev server — com atenção ao limitador: editar escola não consome login.

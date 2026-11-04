# Sessão httpOnly (cookies) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover access/refresh tokens do corpo+`localStorage` para cookies `httpOnly` (`es_at`/`es_rt`), matando a superfície de roubo por XSS.

**Architecture:** Helper único de cookies na camada de infra de auth; `getAuth` troca Bearer por cookie `es_at`; login/refresh/change-password emitem `Set-Cookie` e corpo só com `user`; never-norm de invalidação (claim `pwd`) intacto. Front passa a confiar no cookie (`/me` no mount); E2E recebe jar de cookies.

**Tech Stack:** Next.js 14 route handlers (NextResponse.cookies), jwt, nodemailer-fora-de-escopo, E2E em node nativo.

## Global Constraints
- Cookies: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `path: '/'`.
- Access ≈ 15 min; refresh 7 d; nomes `es_at`/`es_rt` fixos.
- Corpo de login/refresh/change-password NÃO contém tokens (assert de regressão novo).
- Invalidação server-side existente (`pwd` claim = `user.updatedAt`, `active: false`) sem mudança semântica.
- Suítes finais: e2e-auth e e2e-core 100% verdes, mesmo conjunto de invariantes (49 + 34 asserts).

---

### Task 1: Helper de cookies de sessão

**Files:**
- Create: `frontend/src/server/infrastructure/auth/session.ts`

**Interfaces:**
- Produces: `setAuthCookies(res: NextResponse, tokens: TokenPair): void` · `clearAuthCookies(res: NextResponse): void` · `getAccessTokenCookie(req: NextRequest): string | null` · `getRefreshTokenCookie(req: NextRequest): string | null`

- [ ] **Step 1: Implementar** (max-age do access derivado de `JWT_EXPIRES_IN` para não divergir do JWT):

```ts
import { NextResponse, NextRequest } from 'next/server';
import type { TokenPair } from './jwt';

const ACCESS_COOKIE = 'es_at';
const REFRESH_COOKIE = 'es_rt';
const ACCESS_MAX_AGE = 60 * 15;    // 15 min — coerente com JWT_EXPIRES_IN default
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function setAuthCookies(res: NextResponse, tokens: TokenPair) {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOpts(ACCESS_MAX_AGE));
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOpts(REFRESH_MAX_AGE));
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...cookieOpts(0), maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...cookieOpts(0), maxAge: 0 });
}

export function getAccessTokenCookie(req: NextRequest): string | null {
  return req.cookies.get(ACCESS_COOKIE)?.value ?? null;
}

export function getRefreshTokenCookie(req: NextRequest): string | null {
  return req.cookies.get(REFRESH_COOKIE)?.value ?? null;
}
```

- [ ] **Step 2: Verificar** — `npx tsc --noEmit` não apresenta erro no arquivo novo.

### Task 2: `getAuth` lê cookie

**Files:**
- Modify: `frontend/src/server/http.ts`

- [ ] **Step 1:** substituir o corpo de `getAuth` (remove Bearer):

```ts
import { getAccessTokenCookie } from './infrastructure/auth/session';

export function getAuth(req: NextRequest): TokenPayload | null {
  const token = getAccessTokenCookie(req);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2:** `npx tsc --noEmit`.

### Task 3: login emite cookies

**Files:**
- Modify: `frontend/src/app/api/auth/login/route.ts`

- [ ] **Step 1:**

```ts
import { setAuthCookies } from '@/server/infrastructure/auth/session';
// ...
    const result = await useCase.execute(body.email, body.password);
    const res = ok({ user: result.user });
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return res;
```

### Task 4: refresh por cookie

**Files:**
- Modify: `frontend/src/app/api/auth/refresh/route.ts`
- Modify: `frontend/src/server/shared/validators.ts` (remover `refreshSchema` — único uso era aqui)

- [ ] **Step 1:**

```ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { allow, clientKey, rateLimited } from '@/server/rate-limit';
import { verifyRefreshToken, generateTokens } from '@/server/infrastructure/auth/jwt';
import { getRefreshTokenCookie, setAuthCookies } from '@/server/infrastructure/auth/session';
import { PrismaUserRepository } from '@/server/infrastructure/database/prisma/repositories';
import { UnauthorizedError } from '@/server/shared/errors';

// doc comment mantém as regras de revogação
export async function POST(req: NextRequest) {
  try {
    if (!(await allow(clientKey(req, 'refresh'), 30))) return rateLimited();
    const rt = getRefreshTokenCookie(req);
    if (!rt) throw new UnauthorizedError('Refresh token não fornecido');

    const decoded = verifyRefreshToken(rt);
    const user = await new PrismaUserRepository().findById(decoded.userId);
    if (!user || !user.active) throw new UnauthorizedError('Refresh token inválido');
    const currentPwd = user.updatedAt.toISOString();
    if (!decoded.pwd || decoded.pwd !== currentPwd) throw new UnauthorizedError('Refresh token inválido');

    const tokens = generateTokens({
      userId: user.id, email: user.email, role: user.role,
      mustChangePassword: user.mustChangePassword, pwd: currentPwd,
    });
    const res = ok({ user: { id: user.id, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword } });
    setAuthCookies(res, tokens);
    return res;
  } catch (error) {
    return fail(error);
  }
}
```

### Task 5: logout

**Files:**
- Create: `frontend/src/app/api/auth/logout/route.ts`

- [ ] **Step 1:**

```ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/server/http';
import { clearAuthCookies } from '@/server/infrastructure/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const res = ok({ message: 'Sessão encerrada' });
    clearAuthCookies(res);
    return res;
  } catch (error) {
    return fail(error);
  }
}
```

### Task 6: change-password re-seta cookies

**Files:**
- Modify: `frontend/src/app/api/auth/change-password/route.ts`

- [ ] **Step 1:** após `useCase.execute(...)`: `const res = ok({ user: result.user }); setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }); return res;`

### Task 7: front — api/auth-context/página de troca

**Files:**
- Modify: `frontend/src/lib/api.ts` (clearSession, refreshSession, interceptor)
- Modify: `frontend/src/lib/auth-context.tsx` (mount valida por /me; login sem tokens; logout via rota)
- Modify: `frontend/src/app/change-password/page.tsx` (sem touch em tokens)

- [ ] **Step 1: api.ts**

```ts
export function clearSession() {
  localStorage.removeItem('user');
}

async function refreshSession(): Promise<boolean> {
  try {
    await axios.post(`${authBaseUrl}/api/auth/refresh`, undefined, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}
```

Interceptor: 401 em não-auth e sem _retry → `refreshSession()`; se ok re-tenta `api(original)` (sem header Authorization); senão `clearSession()` + redirect `/login`. Request interceptor do Authorization/userHeader: remover (axios leva cookie sozinho, same-origin).

- [ ] **Step 2: auth-context.tsx** — mount:

```ts
useEffect(() => {
  let canceled = false;
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
  }
  api.get('/api/auth/me')
    .then((me) => { if (!canceled) { setUser(me.data.data); localStorage.setItem('user', JSON.stringify(me.data.data)); } })
    .catch(() => { if (!canceled) { localStorage.removeItem('user'); setUser(null); } })
    .finally(() => { if (!canceled) setIsLoading(false); });
  return () => { canceled = true; };
}, []);
```

login: `const userData = response.data.data.user;` (sem tokens no corpo, assert E2E); logout: `try { await api.post('/api/auth/logout'); } catch {}` antes do push.

- [ ] **Step 3: change-password/page.tsx** — `const { user: updatedUser } = response.data.data; localStorage.setItem('user', JSON.stringify(updatedUser));`

### Task 8: E2E — jar de cookies

**Files:**
- Modify: `frontend/tests/e2e-core.mjs` (helper + troca de token por jar)
- Modify: `frontend/tests/e2e-auth.mjs` (pontos de token)

- [ ] **Step 1: helpers comuns**

```js
function newJar() { return { m: new Map() }; }
function harvest(res, jar) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1);
    if (value === '') jar.m.delete(name); else jar.m.set(name, value);
  }
}
function cookieHeader(jar) { return [...jar.m].map(([k, v]) => `${k}=${v}`).join('; '); }
```

`call()` recebe `{ body, jar, rawCookie }`: `Cookie: rawCookie ?? cookieHeader(jar)`; após fetch, `if (jar) harvest(res, jar)`.

- [ ] **Step 2: e2e-core** — todos os `{ token: X }` → `{ jar: JX }`; logins criam jar e exportam `rawAtPrincipal` quando o teste residual precisar.

- [ ] **Step 3: e2e-auth reescrita nos pontos de token:** login (sem token no corpo — novo assert), refresh por cookie (cookies mudam), token residual (raw `es_at` capturado antes da desativação), pwd-claim (RT bruto pré-troca rejeitado pós-troca), logout limpa cookies (novo assert).

### Task 9: verificação final

- [ ] `npx tsc --noEmit` · dev server · `node tests/e2e-core.mjs` e `node tests/e2e-auth.mjs` · smoke navegador (login → DevTools cookie HttpOnly → F5 mantém → logout 401) · `npm run build` · commit (`feat:`) + push.

## Self-review
- Spec coberta: transport (Tasks 1-6), front (7), invalidação inalterada (Task 4), CSRF Lax (cookieOpts), E2E (8), aceitação (9).
- Sem placeholders: todos os blocos têm código real.
- Tipos consistentes: `TokenPair` do jwt.ts; jar API única nas duas suítes.

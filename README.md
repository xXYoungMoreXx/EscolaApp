# Sistema de Gestão Escolar — 100% Vercel

Alunos, professores, matérias, turmas, notas, presenças e notificações em um único app
Next.js 14 (App Router + Route Handlers), deploy serverless na Vercel.

## Arquitetura

```
EscolaApp/
├── frontend/
│   ├── src/app/            # Páginas (estáticas) + API em src/app/api/** (28 functions)
│   ├── src/server/         # Regras de negócio (use-cases), Prisma, auth JWT, rate-limit
│   ├── src/components/     # UI
│   ├── src/lib/            # API client (same-origin), auth context
│   ├── prisma/             # Schema PostgreSQL + migrations + seed
│   └── .env.example
└── vercel.json             # Build do monorepo (região gru1)
```

- **Frontend**: páginas pré-renderizadas (estáticas) — CDN global.
- **API**: Route Handlers Node (`runtime = 'nodejs'`, `force-dynamic`) — escala a zero por rota.
- **Banco**: PostgreSQL serverless (Neon/Supabase) via Prisma com singleton por invocação quente.
- **Rate limit**: Upstash Redis quando configurado, fallback em memória para dev.
- **Auth**: JWT Bearer + roles (ADMIN, COORDINATOR, TEACHER, STUDENT), validação Zod em todas as entradas.

## Deploy na Vercel (100% tiers gratuitos)

1. Banco Postgres grátis — escolha uma:
   - **Neon pelo Marketplace da Vercel (recomendado)**: Vercel → seu projeto → aba
     *Storage* → *Neon Postgres* → provisiona sem sair da Vercel, tier gratuito,
     já injeta `DATABASE_URL` (pooled). Sem conta separada, sem cartão.
   - **Supabase gratuito**: [supabase.com](https://supabase.com) → New Project (free)
     → *Connect* → copie a **pooled URL** (porta 6543) para `DATABASE_URL` em produção
     e use a **direct URL** (porta 5432) só para rodar `db:migrate`. Ressalva: projeto
     free pausa após inatividade — primeiro acesso acorda em ~1 min.
2. Importe o repo na Vercel (Root Directory `./` — o `vercel.json` já aponta para `frontend/`).
3. Variáveis de ambiente:
   - `DATABASE_URL` — pooled URL (Neon injeta sozinho via Marketplace)
   - `JWT_SECRET` — segredo longo e aleatório (**obrigatório**)
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — opcional e grátis via
     Marketplace (*Upstash Redis*); sem isso o rate-limit usa fallback em memória
4. Deploy. Depois, migration + seed contra o banco de produção:

```bash
cd frontend
DATABASE_URL="<pooled-url>" npm run db:migrate
DATABASE_URL="<pooled-url>" npm run db:seed
```

Pronto: `https://<projeto>.vercel.app` (frontend + `/api/*` na mesma origem, sem CORS).

## Desenvolvimento local

```bash
cd frontend
cp .env.example .env   # aponte DATABASE_URL para um Postgres local ou Neon dev
npm install
npm run db:migrate
npm run db:seed
npm run dev            # http://localhost:3000
```

## Credenciais de teste (seed)

| Função      | Email                  | Senha      |
| ----------- | ---------------------- | ---------- |
| Admin       | admin@escola.com       | admin123   |
| Coordenador | coordenador@escola.com | coord123   |
| Professor   | professor@escola.com   | teacher123 |
| Aluno       | aluno1@escola.com      | student123 |

## Segurança

- JWT obrigatório em todas as rotas (exceto login e health); roles por endpoint.
- `JWT_SECRET` com fail-fast em produção; senhas bcrypt (12 rounds).
- Headers: HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Rate limit: 10 req/min no login, 100 req/min nas escritas (429 + `RATE_LIMITED`).
- Prisma parametriza todas as queries; erros de banco mapeados (409/404) sem vazar detalhes.

## API

Base same-origin `/api`. Envelope `{ success, data }` / `{ success: false, error: { message, code } }`.

- Auth: `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/profile`,
  `POST /api/auth/change-password`, `GET /api/auth/users`, `PATCH /api/auth/users/:id/active`
- Alunos/professores/matérias: `GET+POST /api/{students,teachers,subjects}`, `GET+PUT+DELETE /api/{...}/:id`
- Turmas: CRUD em `/api/classes/:id` + `POST /api/classes/:id/enroll` + `DELETE /api/classes/:id/students/:studentId`
- Notas: `GET+POST /api/grades`, `PUT+DELETE /api/grades/:id`, `GET /api/grades/student/:studentId`
- Presenças: `GET+POST /api/attendance`, `POST /api/attendance/bulk`, `DELETE /api/attendance/:id`,
  `GET /api/attendance/class/:classId?date=...`
- Notificações: `GET+POST /api/notifications`, `PATCH /api/notifications/:id/read`,
  `POST /api/notifications/read-all`, `DELETE /api/notifications/:id`
- `GET /api/health`

## Licença

MIT

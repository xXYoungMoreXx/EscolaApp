# Sessão httpOnly (cookie-based auth) — design

Data: 2026-11-04 · Status: aprovado pelo usuário (contrato "cookies only")

## Problema
Login/devolvem `accessToken`/`refreshToken` no corpo; front guarda em `localStorage` e injeta `Authorization: Bearer`. Qualquer XSS lê os dois tokens de uma vez e a sessão tem vida de 7 dias.

## Decisão
Tokens existem apenas como cookies `httpOnly`:
- `es_at` — access JWT, ~15 min (cohlete expiração do access de hoje).
- `es_rt` — refresh JWT, 7 d.
- Flags: `httpOnly` · `SameSite=Lax` · `Secure` fora de dev · `Path=/`.

## Contrato por rota
| Rota | Mudança |
| --- | --- |
| `POST /api/auth/login` | corpo devolve `{ user }` só (id/email/role/mustChangePassword); tokens em `Set-Cookie` |
| `POST /api/auth/refresh` | lê `es_rt` do cookie (sem corpo); rotaciona e re-seta os dois cookies; devolve `{ user }` |
| `POST /api/auth/logout` | **novo** — limpa os dois cookies (`Max-Age=0`) |
| `POST /api/auth/change-password` | re-emissão mantida; agora re-seta cookies |
| `GET /api/auth/me` e todo o resto | `requireAuth` lê token do cookie `es_at`; Bearer sai de cena |

## Invalidação (sem mudança semântica)
Continua sem revogação a estado: `pwd` claim = `user.updatedAt` já cai refresh pós-troca de senha e usuário desativado é negado. O transport muda; a política não.

## CSRF
`SameSite=Lax` bloqueia cookies em `fetch` cross-site. Camada única documentada (sem duplo-submit) — API é same-origin, padrão atual do produto.

## Front
- `localStorage` de token/refreshToken morre. `user` não-sensível continua em `localStorage` como cache de primeiro paint.
- Verdade de sessão: no mount, `GET /api/auth/me` confirma o cookie; 401 → sessão limpa.
- `refreshSession()` = `POST /api/auth/refresh` sem corpo; interceptor re-tenta a request original.

## E2E
- `call()` ganha jar de cookies por sessão (captura `Set-Cookie`, reflete em `Cookie`; limpeza via cookie vazio).
- `e2e-auth`: pontos de "tokens no corpo" reescritos (novo assert de ausência de token no corpo); teste de token residual lê o valor bruto capturado antes; rotação vira "cookies mudam"; logout novo.
- `e2e-core`: troca Bearer por jar, mesma contagem de asserts.

## Aceitação
`tsc --noEmit` limpo · `npm run build` OK · e2e-auth 34 e e2e-core 49 verdes · smoke no navegador: login → cookie `httpOnly` no DevTools → F5 mantém sessão → logout esvazia.

## Não-metas
Tabela de sessões para revogação de RT; CSRF duplo-submit; Bearer/clients móveis.

## Fila do lote (ciclos seguintes)
2. SMTP configurável por env (Nodemailer: transport real se SMTP_* presente; fallback mock — sem credenciais reais o envio produtivo segue pendente).
3. Timetable (grade horária por turma) — schema → API → UI, vertical nova.
4. Multi-tenancy (School + scoping) — maior; entra por último. Upstash/Redis segue bloqueado sem conta externa.

/* E2E auth flow — EscolaApp (run: node tests/e2e-auth.mjs) */
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
let pass = 0;
let fail = 0;
const failures = [];

function ok(cond, label, extra) {
  if (cond) {
    pass++;
    console.log('  ✓ ' + label);
  } else {
    fail++;
    failures.push(label + (extra ? ` — ${extra}` : ''));
    console.log('  ✗ ' + label + (extra ? ` — ${extra}` : ''));
  }
}

async function call(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-json */ }
  return { status: res.status, json };
}

const STAMP = Date.now();
const STUDENT_EMAIL = `teste-e2e-${STAMP}@escola.com`;
const USER_PASS = 'Senha123';
const NEW_PASS = 'NovaSenha1';

/** CPF válido com dígitos verificadores calculados (unique por execução). */
function genCpf(seed) {
  const base = String(seed % 1000000000).padStart(9, '0');
  const digit = (withDigits) => {
    let sum = 0;
    let weight = withDigits.length + 1;
    for (const d of withDigits) sum += Number(d) * (weight--);
    const rest = (sum * 10) % 11;
    return rest === 10 ? '0' : String(rest);
  };
  const d1 = digit(base);
  const d2 = digit(base + d1);
  return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6)}-${d1}${d2}`;
}
const CPF = genCpf(STAMP);

console.log('1) CADASTRO');
let r = await call('POST', '/api/auth/register', {
  body: {
    user: { email: STUDENT_EMAIL, password: USER_PASS },
    person: { name: 'Aluno Teste E2E', cpf: CPF },
  },
});
ok(r.status === 201, 'cadastro retorna 201 e mensagem de aguardo', JSON.stringify(r.json));
ok(r.json?.success === true, 'resposta com success=true');

r = await call('POST', '/api/auth/login', { body: { email: STUDENT_EMAIL, password: USER_PASS } });
ok(r.status === 401 && r.json?.error?.message === 'Conta desativada', 'login de conta recém-cadastrada bloqueado (401 Conta desativada)', JSON.stringify(r.json));

const dupEmail = `dup-email-${STAMP}@escola.com`;
r = await call('POST', '/api/auth/register', {
  body: {
    user: { email: dupEmail, password: USER_PASS },
    person: { name: 'CPF Duplicado', cpf: CPF },
  },
});
ok(r.status === 409, 'CPF duplicado é recusado (409)', JSON.stringify(r.json));
r = await call('POST', '/api/auth/login', { body: { email: dupEmail, password: USER_PASS } });
ok(r.status === 401 && r.json?.error?.message === 'Credenciais inválidas', 'REGRESSÃO órfão: conflito de CPF não deixa usuário criado', JSON.stringify(r.json));

r = await call('POST', '/api/auth/register', {
  body: {
    user: { email: STUDENT_EMAIL, password: USER_PASS },
    person: { name: 'Email Duplicado', cpf: genCpf(STAMP + 1) },
  },
});
ok(r.status === 409, 'email duplicado é recusado (409)', JSON.stringify(r.json));

console.log('2) ADMIN + ATIVAÇÃO');
const admin = await call('POST', '/api/auth/login', { body: { email: 'admin@escola.com', password: 'admin123' } });
ok(admin.status === 200 && admin.json?.data?.accessToken, 'admin faz login e recebe tokens');
const adminToken = admin.json?.data?.accessToken;

r = await call('GET', `/api/auth/users?search=${STUDENT_EMAIL}`, { token: adminToken });
const testUser = r.json?.data?.[0];
ok(!!testUser && testUser.active === false, 'admin encontra usuário recém-cadastrado inativo', JSON.stringify(r.json));

r = await call('PATCH', `/api/auth/users/${testUser.id}/active`, { token: adminToken, body: { active: true } });
ok(r.status === 200 && r.json?.data?.active === true, 'admin ativa o usuário', JSON.stringify(r.json));

console.log('3) LOGIN + ENDPOINTS + REFRESH');
const userLogin = await call('POST', '/api/auth/login', { body: { email: STUDENT_EMAIL, password: USER_PASS } });
ok(userLogin.status === 200 && userLogin.json?.data?.accessToken, 'usuário ativado faz login');
const userToken = userLogin.json?.data?.accessToken;
const oldRefreshToken = userLogin.json?.data?.refreshToken;
ok(userLogin.json?.data?.user?.mustChangePassword === false, 'login retorna mustChangePassword=false');
ok(!!oldRefreshToken, 'login retorna refreshToken (antes morto, agora vivo)');

r = await call('GET', '/api/auth/me', { token: userToken });
ok(r.status === 200 && r.json?.data?.user?.userId === testUser.id, 'usuário acessa /api/auth/me com token válido');
r = await call('GET', '/api/students', { token: userToken });
ok(r.status === 403, 'role STUDENT recebe 403 em /api/students (gate de cargo intacto)', JSON.stringify(r.json));
r = await call('GET', '/api/students', { token: adminToken });
ok(r.status === 200, 'admin acessa /api/students');
r = await call('POST', '/api/auth/refresh', { body: { refreshToken: oldRefreshToken } });
ok(r.status === 200 && r.json?.data?.accessToken && r.json?.data?.refreshToken, '/api/auth/refresh rotaciona o par de tokens');
const rotatedRefresh = r.json?.data?.refreshToken;

console.log('4) BLOQUEIO (desativação)');
r = await call('PATCH', `/api/auth/users/${testUser.id}/active`, { token: adminToken, body: { active: false } });
ok(r.status === 200 && r.json?.data?.active === false, 'admin desativa o usuário');
r = await call('POST', '/api/auth/refresh', { body: { refreshToken: rotatedRefresh } });
ok(r.status === 401, 'refresh de usuário bloqueado é recusado (401)', JSON.stringify(r.json));
r = await call('GET', '/api/auth/me', { token: userLogin.json?.data?.accessToken });
ok(r.status === 200, 'access token residual ainda vale até expirar (≤15m, revogação com limite)', r.status);
r = await call('POST', '/api/auth/login', { body: { email: STUDENT_EMAIL, password: USER_PASS } });
ok(r.status === 401 && r.json?.error?.message === 'Conta desativada', 'novo login de conta bloqueada é recusado');

console.log('5) RECUPERAÇÃO (esqueci senha → admin aprova → troca obrigatória)');
// reativação antes da recuperação: forgot-password só registra pedido de conta ativa
r = await call('PATCH', `/api/auth/users/${testUser.id}/active`, { token: adminToken, body: { active: true } });
ok(r.status === 200, 'admin reativa o usuário');

r = await call('POST', '/api/auth/forgot-password', { body: { email: STUDENT_EMAIL } });
ok(r.status === 200 && r.json?.success === true, 'forgot-password aceita pedido com mensagem genérica');

r = await call('GET', '/api/auth/reset-requests', { token: adminToken });
const pending = r.json?.data?.find?.((q) => q.userId === testUser.id && q.status === 'PENDING');
ok(!!pending, 'admin vê pedido de reset pendente', JSON.stringify(r.json));

r = await call('POST', `/api/auth/reset-requests/${pending.id}/approve`, { token: adminToken });
const tempPass = r.json?.data?.tempPassword;
ok(r.status === 200 && typeof tempPass === 'string' && tempPass.length > 8, 'admin aprova e recebe senha temporária', JSON.stringify(r.json));

const tempLogin = await call('POST', '/api/auth/login', { body: { email: STUDENT_EMAIL, password: tempPass } });
ok(tempLogin.status === 200, 'login com senha temporária funciona (conta reativada pelo approve)');
ok(tempLogin.json?.data?.user?.mustChangePassword === true, 'login marca mustChangePassword=true');
const tempToken = tempLogin.json?.data?.accessToken;
r = await call('GET', '/api/students', { token: tempToken });
ok(r.status === 403 && /Troca de senha|senha/.test(r.json?.error?.message ?? ''), 'BLOQUEIO SERVER-SIDE: usuário forçado recebe 403 em endpoint comum', JSON.stringify(r.json));
r = await call('GET', '/api/auth/me', { token: tempToken });
ok(r.status === 200, 'usuário forçado ainda consegue /api/auth/me (permitido por design)');

console.log('6) TROCA OBRIGATÓRIA + ROTAÇÃO');
const wrong = await call('POST', '/api/auth/change-password', { token: tempToken, body: { currentPassword: 'errada1', newPassword: NEW_PASS } });
ok(wrong.status === 401, 'troca com senha atual errada é recusada (401)');

r = await call('POST', '/api/auth/change-password', { token: tempToken, body: { currentPassword: tempPass, newPassword: NEW_PASS } });
ok(r.status === 200 && r.json?.data?.accessToken && r.json?.data?.user?.mustChangePassword === false, 'troca de senha reemite tokens com mustChangePassword=false', JSON.stringify(r.json));
const newToken = r.json?.data?.accessToken;
const newRefresh = r.json?.data?.refreshToken;

r = await call('POST', '/api/auth/refresh', { body: { refreshToken: oldRefreshToken } });
ok(r.status === 401, 'refresh token pré-troca de senha é invalidado (revogação via claim pwd)', JSON.stringify(r.json));
r = await call('POST', '/api/auth/refresh', { body: { refreshToken: newRefresh } });
ok(r.status === 200, 'refresh token pós-troca funciona');
r = await call('GET', '/api/students', { token: newToken });
ok(r.status === 403, 'bloqueio de cargo segue valendo pós-troca (STUDENT em /students)');
r = await call('GET', '/api/auth/me', { token: newToken });
ok(r.status === 200, 'endpoint permitido volta a responder após trocar a senha');

console.log('');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) {
  console.log('FALHAS:');
  failures.forEach((f) => console.log(' - ' + f));
  process.exit(1);
}

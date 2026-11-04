/* E2E das rotinas do sistema (não-auth) — EscolaApp (run: node tests/e2e-core.mjs) */
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
  try { json = await res.json(); } catch { /* no-json (204 etc.) */ }
  return { status: res.status, json };
}

const STAMP = Date.now();
const CODE = `E2E-${STAMP}`;

function validCpf(seed) {
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

const adminRes = await call('POST', '/api/auth/login', { body: { email: 'admin@escola.com', password: 'admin123' } });
ok(adminRes.status === 200, 'admin autentica');
const A = adminRes.json?.data?.accessToken;

let sr = await call('GET', '/api/students?limit=100', { token: A });
const student = sr.json?.data?.find?.((s) => s.user?.email === 'aluno1@escola.com');
ok(!!student && !!student.userId, 'aluno do seed localizado pelo email (com userId)');

console.log('1) MATÉRIA + TURMA');
let r = await call('POST', '/api/subjects', { token: A, body: { name: `Disciplina E2E ${STAMP}`, code: CODE, workload: 40 } });
ok(r.status === 201, 'cria matéria', JSON.stringify(r.json));
const subjectId = r.json?.data?.id;

r = await call('GET', '/api/classes?limit=100', { token: A });
const seededClass = r.json?.data?.[0];
ok(!!seededClass && !!seededClass.subject, 'lista turmas paginada com matéria', JSON.stringify(r.json)?.slice(0, 120));

r = await call('POST', '/api/classes', { token: A, body: { name: `Turma E2E ${STAMP}`, year: 2026, shift: 'morning', teacherId: seededClass.teacherId, subjectId } });
ok(r.status === 201, 'cria turma amarrada a matéria/professor', JSON.stringify(r.json));
const classId = r.json?.data?.id;

r = await call('GET', `/api/classes/${classId}`, { token: A });
ok(r.status === 200 && r.json?.data?.id === classId, 'detalhe da turma retorna');

console.log('2) PROFESSOR');
const email = `prof-core-${STAMP}@escola.com`;
r = await call('POST', '/api/teachers', { token: A, body: { user: { email, password: 'Professor1', role: 'TEACHER' }, person: { name: 'Prof E2E', cpf: validCpf(STAMP) }, salary: 1000 } });
ok(r.status === 201, 'cria professor (user+person+teacher transacional)', JSON.stringify(r.json));
const teacherId = r.json?.data?.id;

r = await call('GET', `/api/teachers/${teacherId}`, { token: A });
ok(r.status === 200 && r.json?.data?.user?.email === email, 'detalhe do professor carrega user');

r = await call('PUT', `/api/teachers/${teacherId}`, { token: A, body: { salary: 1200 } });
ok(r.status === 200 && r.json?.data?.salary === 1200, 'atualiza professor (PUT)', JSON.stringify(r.json));

r = await call('POST', '/api/auth/login', { body: { email, password: 'Professor1' } });
ok(r.status === 200 && r.json?.data?.accessToken, 'professor criado faz login');
const T = r.json?.data?.accessToken;

r = await call('GET', '/api/auth/users?limit=1', { token: T });
ok(r.status === 403, 'professor não gerencia usuários (403)', JSON.stringify(r.json));

r = await call('POST', '/api/grades', { token: T, body: { studentId: student.id, classId, subjectId, value: 9, period: '2trimestre' } });
ok(r.status === 201, 'professor lança nota sem informar teacherId (resolvido por cargo)', JSON.stringify(r.json));

r = await call('POST', '/api/teachers', { token: A, body: { user: { email, password: 'Professor1', role: 'TEACHER' }, person: { name: 'Duplicado', cpf: validCpf(STAMP + 1) } } });
ok(r.status === 409, 'email de professor duplicado recusado (409)');

r = await call('DELETE', `/api/teachers/${teacherId}`, { token: A });
ok(r.status === 204, 'exclui professor');

r = await call('POST', '/api/auth/login', { body: { email, password: 'Professor1' } });
ok(r.status === 401, 'REGRESSÃO órfão: login do professor excluído não existe mais', JSON.stringify(r.json));

console.log('3) MATRÍCULA + NOTAS + PRESENÇA' );
r = await call('POST', `/api/classes/${classId}/enroll`, { token: A, body: { studentId: student.id } });
ok(r.status === 201, 'matricula aluno na turma (/enroll)', JSON.stringify(r.json));

r = await call('POST', '/api/grades', { token: A, body: { studentId: student.id, classId, subjectId, teacherId: seededClass.teacherId, value: 8.5, period: '1trimestre' } });
ok(r.status === 201, 'admin lança nota com teacherId explícito', JSON.stringify(r.json));
const gradeId = r.json?.data?.id;

r = await call('POST', '/api/grades', { token: A, body: { studentId: student.id, classId, subjectId, teacherId: seededClass.teacherId, value: 11, period: '1trimestre' } });
ok(r.status === 400 || r.status === 422, 'REGRESSÃO 500: nota fora da faixa devolve erro de validação (4xx)', JSON.stringify(r.json));

r = await call('GET', `/api/grades/student/${student.id}`, { token: A });
ok(r.status === 200, 'notas do aluno consultáveis');

r = await call('PUT', `/api/grades/${gradeId}`, { token: A, body: { value: 9.2 } });
ok(r.status === 200 && r.json?.data?.value === 9.2, 'atualiza nota (PUT)', JSON.stringify(r.json));

r = await call('POST', '/api/attendance/bulk', { token: A, body: { records: [
  { studentId: student.id, classId, date: new Date().toISOString(), status: 'PRESENT' },
  { studentId: student.id, classId, date: new Date(Date.now() - 86400000).toISOString(), status: 'ABSENT' },
] } });
ok(r.status === 201, 'presença em lote (datas ISO)', JSON.stringify(r.json));

r = await call('GET', `/api/attendance/class/${classId}?date=${new Date().toISOString().slice(0, 10)}`, { token: A });
ok(r.status === 200, 'chamada da turma por data');

console.log('4) AVISOS (dono: aluno)');
r = await call('POST', '/api/notifications', { token: A, body: { userId: student.userId, title: `Aviso E2E ${STAMP}`, message: 'teste', type: 'info' } });
ok(r.status === 201, 'admin cria aviso para o aluno', JSON.stringify(r.json));
const notifId = r.json?.data?.id;

const studentRes = await call('POST', '/api/auth/login', { body: { email: student.user?.email ?? 'aluno1@escola.com', password: 'student123' } });
ok(studentRes.status === 200, 'aluno do seed autentica', JSON.stringify(studentRes.json));
const S = studentRes.json?.data?.accessToken;

r = await call('PATCH', `/api/notifications/${notifId}/read`, { token: S });
ok(r.status === 200, 'aluno marca o próprio aviso como lido (PATCH)', JSON.stringify(r.json));

r = await call('PATCH', `/api/notifications/${notifId}/read`, { token: A });
ok(r.status === 403, 'admin não marca aviso de outro usuário (escopo de dono, 403)', JSON.stringify(r.json));

r = await call('POST', '/api/notifications/read-all', { token: S });
ok([200, 201, 204].includes(r.status), 'aluno marca todos como lidos');

r = await call('DELETE', `/api/notifications/${notifId}`, { token: S });
ok(r.status === 204, 'aluno exclui o próprio aviso', JSON.stringify(r.json));

console.log('5) PERMISSÕES E SAÚDE');
r = await call('GET', '/api/health');
ok(r.status === 200 && r.json?.status === 'ok', 'health público');

r = await call('GET', '/api/students');
ok(r.status === 401, 'endpoint sem token é 401');

console.log('6) LIMPEZA');
r = await call('DELETE', `/api/grades/${gradeId}`, { token: A });
ok(r.status === 204, 'exclui nota');

r = await call('DELETE', `/api/classes/${classId}`, { token: A });
ok(r.status === 204, 'exclui turma (matrícula/preença morrem em cascata)');

r = await call('DELETE', `/api/subjects/${subjectId}`, { token: A });
ok(r.status === 204, 'exclui matéria');

console.log('');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) {
  console.log('FALHAS:');
  failures.forEach((f) => console.log(' - ' + f));
  process.exit(1);
}

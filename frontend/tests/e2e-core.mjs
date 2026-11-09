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

const STAMP = Date.now();
const CODE = `E2E-${STAMP}`;

// Sessões por cookie: login Set-Cookie → jar → Cookie nas chamadas seguintes.
function newJar() { return { m: new Map() }; }
function harvest(res, jar) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1);
    if (value === '') jar.m.delete(name); else jar.m.set(name, value);
  }
}
function cookieHeader(jar) { return [...jar.m].map(([k, v]) => `${k}=${v}`).join('; '); }
function rawJar(name, value) { const j = newJar(); j.m.set(name, value); return j; }

async function call(method, path, { body, jar, rawCookie } = {}) {
  // IP simulado próprio da suíte: o rate limit de rota (login/register) é chaveado
// por x-forwarded-for; sem isso, suítes diferentes dividiriam o mesmo balde 10/min.
const headers = { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' };
  const cookieValue = rawCookie ?? (jar ? cookieHeader(jar) : null);
  if (cookieValue) headers.Cookie = cookieValue;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (jar) harvest(res, jar);
  let json = null;
  try { json = await res.json(); } catch { /* no-json (204 etc.) */ }
  return { status: res.status, json };
}

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

const JA = newJar();
const adminRes = await call('POST', '/api/auth/login', { body: { email: 'admin@escola.com', password: 'admin123' }, jar: JA });
ok(adminRes.status === 200, 'admin autentica');
ok(adminRes.json?.data?.accessToken === undefined, 'login não entrega token no corpo (cookie httpOnly)', JSON.stringify(adminRes.json));

let sr = await call('GET', '/api/students?limit=100', { jar: JA });
const student = sr.json?.data?.find?.((s) => s.user?.email === 'aluno1@escola.com');
ok(!!student && !!student.userId, 'aluno do seed localizado pelo email (com userId)');

console.log('1) MATÉRIA + TURMA');
let r = await call('POST', '/api/subjects', { jar: JA, body: { name: `Disciplina E2E ${STAMP}`, code: CODE, workload: 40 } });
ok(r.status === 201, 'cria matéria', JSON.stringify(r.json));
const subjectId = r.json?.data?.id;

r = await call('GET', '/api/classes?limit=100', { jar: JA });
const seededClass = r.json?.data?.[0];
ok(!!seededClass && !!seededClass.subject, 'lista turmas paginada com matéria', JSON.stringify(r.json)?.slice(0, 120));

r = await call('POST', '/api/classes', { jar: JA, body: { name: `Turma E2E ${STAMP}`, year: 2026, shift: 'morning', teacherId: seededClass.teacherId, subjectId } });
ok(r.status === 201, 'cria turma amarrada a matéria/professor', JSON.stringify(r.json));
const classId = r.json?.data?.id;

r = await call('GET', `/api/classes/${classId}`, { jar: JA });
ok(r.status === 200 && r.json?.data?.id === classId, 'detalhe da turma retorna');

console.log('2) PROFESSOR');
const JT = newJar();
const email = `prof-core-${STAMP}@escola.com`;
r = await call('POST', '/api/teachers', { jar: JA, body: { user: { email, password: 'Professor1', role: 'TEACHER' }, person: { name: 'Prof E2E', cpf: validCpf(STAMP) }, salary: 1000 } });
ok(r.status === 201, 'cria professor (user+person+teacher transacional)', JSON.stringify(r.json));
const teacherId = r.json?.data?.id;

r = await call('GET', `/api/teachers/${teacherId}`, { jar: JA });
ok(r.status === 200 && r.json?.data?.user?.email === email, 'detalhe do professor carrega user');

r = await call('PUT', `/api/teachers/${teacherId}`, { jar: JA, body: { salary: 1200 } });
ok(r.status === 200 && r.json?.data?.salary === 1200, 'atualiza professor (PUT)', JSON.stringify(r.json));

r = await call('POST', '/api/auth/login', { body: { email, password: 'Professor1' }, jar: JT });
ok(r.status === 200 && r.json?.data?.accessToken === undefined && !!r.json?.data?.user, 'professor criado faz login (user no corpo, cookie httpOnly)');
const T = JT;

r = await call('GET', '/api/auth/users?limit=1', { jar: JT });
ok(r.status === 403, 'professor não gerencia usuários (403)', JSON.stringify(r.json));

r = await call('POST', '/api/grades', { jar: JT, body: { studentId: student.id, classId, subjectId, value: 9, period: '2trimestre' } });
ok(r.status === 201, 'professor lança nota sem informar teacherId (resolvido por cargo)', JSON.stringify(r.json));

r = await call('POST', '/api/teachers', { jar: JA, body: { user: { email, password: 'Professor1', role: 'TEACHER' }, person: { name: 'Duplicado', cpf: validCpf(STAMP + 1) } } });
ok(r.status === 409, 'email de professor duplicado recusado (409)');

r = await call('DELETE', `/api/teachers/${teacherId}`, { jar: JA });
ok(r.status === 204, 'exclui professor');

r = await call('POST', '/api/auth/login', { body: { email, password: 'Professor1' } });
ok(r.status === 401, 'REGRESSÃO órfão: login do professor excluído não existe mais', JSON.stringify(r.json));

console.log('3) MATRÍCULA + NOTAS + PRESENÇA' );
r = await call('POST', `/api/classes/${classId}/enroll`, { jar: JA, body: { studentId: student.id } });
ok(r.status === 201, 'matricula aluno na turma (/enroll)', JSON.stringify(r.json));

r = await call('POST', '/api/grades', { jar: JA, body: { studentId: student.id, classId, subjectId, teacherId: seededClass.teacherId, value: 8.5, period: '1trimestre' } });
ok(r.status === 201, 'admin lança nota com teacherId explícito', JSON.stringify(r.json));
const gradeId = r.json?.data?.id;

r = await call('POST', '/api/grades', { jar: JA, body: { studentId: student.id, classId, subjectId, teacherId: seededClass.teacherId, value: 7, period: '1trimestre' } });
ok(r.status === 409, 'REGRESSÃO: segunda nota no mesmo aluno/turma/matéria/período é recusada (409)', JSON.stringify(r.json));

r = await call('POST', '/api/grades', { jar: JA, body: { studentId: student.id, classId, subjectId, teacherId: seededClass.teacherId, value: 11, period: '1trimestre' } });
ok(r.status === 400 || r.status === 422, 'REGRESSÃO 500: nota fora da faixa devolve erro de validação (4xx)', JSON.stringify(r.json));

r = await call('GET', `/api/grades/student/${student.id}`, { jar: JA });
ok(r.status === 200, 'notas do aluno consultáveis');

r = await call('PUT', `/api/grades/${gradeId}`, { jar: JA, body: { value: 9.2 } });
ok(r.status === 200 && r.json?.data?.value === 9.2, 'atualiza nota (PUT)', JSON.stringify(r.json));

r = await call('POST', '/api/attendance/bulk', { jar: JA, body: { records: [
  { studentId: student.id, classId, date: new Date().toISOString(), status: 'PRESENT' },
  { studentId: student.id, classId, date: new Date(Date.now() - 86400000).toISOString(), status: 'ABSENT' },
] } });
ok(r.status === 201, 'presença em lote (datas ISO)', JSON.stringify(r.json));

// Re-chamada no mesmo dia: upsert (atualiza, não duplica nem explode)
r = await call('POST', '/api/attendance/bulk', { jar: JA, body: { records: [
  { studentId: student.id, classId, date: new Date().toISOString(), status: 'PRESENT' },
] } });
ok(r.status === 201, 'REGRESSÃO: re-chamada no mesmo dia atualiza em vez de 500', JSON.stringify(r.json));

r = await call('GET', `/api/attendance/class/${classId}?date=${new Date().toISOString().slice(0, 10)}`, { jar: JA });
const todayRecords = (r.json?.data ?? []).filter((a) => a.studentId === student.id);
ok(todayRecords.length === 1 && todayRecords[0].status === 'PRESENT', 'REGRESSÃO: uma marca única por aluno/dia (status atualizado)', JSON.stringify(r.json));

r = await call('GET', `/api/attendance/class/${classId}?date=${new Date().toISOString().slice(0, 10)}`, { jar: JA });
ok(r.status === 200, 'chamada da turma por data');

console.log('4) AVISOS (dono: aluno)');
r = await call('POST', '/api/notifications', { jar: JA, body: { userId: student.userId, title: `Aviso E2E ${STAMP}`, message: 'teste', type: 'info' } });
ok(r.status === 201, 'admin cria aviso para o aluno', JSON.stringify(r.json));
const notifId = r.json?.data?.id;

const JS = newJar();
const studentRes = await call('POST', '/api/auth/login', { body: { email: student.user?.email ?? 'aluno1@escola.com', password: 'student123' }, jar: JS });
ok(studentRes.status === 200, 'aluno do seed autentica', JSON.stringify(studentRes.json));
const S = JS;

r = await call('PATCH', `/api/notifications/${notifId}/read`, { jar: JS });
ok(r.status === 200, 'aluno marca o próprio aviso como lido (PATCH)', JSON.stringify(r.json));

r = await call('PATCH', `/api/notifications/${notifId}/read`, { jar: JA });
ok(r.status === 403, 'admin não marca aviso de outro usuário (escopo de dono, 403)', JSON.stringify(r.json));

r = await call('POST', '/api/notifications/read-all', { jar: JS });
ok([200, 201, 204].includes(r.status), 'aluno marca todos como lidos');

r = await call('DELETE', `/api/notifications/${notifId}`, { jar: JS });
ok(r.status === 204, 'aluno exclui o próprio aviso', JSON.stringify(r.json));

console.log('5) PERMISSÕES E SAÚDE');
r = await call('GET', '/api/health');
ok(r.status === 200 && r.json?.status === 'ok', 'health público');

r = await call('GET', '/api/students');
ok(r.status === 401, 'endpoint sem token é 401');

console.log('6) BOLETIM + RESPONSÁVEL');
r = await call('GET', '/api/grades/my-report', { jar: JS });
const e2eItem = r.json?.data?.[0]?.items?.find?.((i) => i.subject.includes('E2E'));
ok(r.status === 200 && r.json?.data?.length === 1, 'aluno vê o próprio boletim', JSON.stringify(r.json).slice(0, 200));
ok(e2eItem && e2eItem.average === 9.2, 'boletim reflete média da matéria E2E (9.2)', JSON.stringify(e2eItem));
ok(e2eItem && e2eItem.frequency === 50, 'boletim reflete frequência do aluno (1/2 → 50%)', JSON.stringify(e2eItem));

r = await call('GET', `/api/grades/student/${student.id}`, { jar: JS });
ok(r.status === 200, 'aluno consulta as próprias notas direto por rota');

r = await call('GET', `/api/grades/student/${student.id}`, { jar: JA });
ok(r.status === 200, 'staff consulta notas de aluno');

const JSTRANGER = newJar();
const stranger = await call('POST', '/api/auth/login', { body: { email: 'aluno2@escola.com', password: 'student123' }, jar: JSTRANGER });
r = await call('GET', `/api/grades/student/${student.id}`, { jar: JSTRANGER });
ok(r.status === 403, 'REGRESSÃO furo: colega não consulta notas de outro aluno', JSON.stringify(r.json));

const guardianEmail = `resp-e2e-${STAMP}@escola.com`;
r = await call('POST', '/api/guardians', { jar: JA, body: {
  user: { email: guardianEmail, password: 'Guardian123', role: 'GUARDIAN' },
  person: { name: 'Resp E2E', cpf: validCpf(STAMP + 7) },
  relationship: 'PAI',
  studentIds: [student.id],
} });
ok(r.status === 201, 'cria responsável vinculado ao aluno (201)', JSON.stringify(r.json));
const guardianId = r.json?.data?.id;

const JG = newJar();
r = await call('POST', '/api/auth/login', { body: { email: guardianEmail, password: 'Guardian123' }, jar: JG });
ok(r.status === 200 && r.json?.data?.user?.role === 'GUARDIAN', 'responsável criado faz login');
const G = JG;

r = await call('GET', '/api/grades/my-report', { jar: JG });
ok(r.status === 200 && r.json?.data?.[0]?.student?.id === student.id, 'responsável vê boletim do aluno vinculado', JSON.stringify(r.json).slice(0, 200));

r = await call('GET', `/api/grades/student/${student.id}`, { jar: JG });
ok(r.status === 200, 'responsável consulta notas do vínculo por rota');

r = await call('GET', '/api/students', { jar: JG });
ok(r.status === 403, 'responsável não lista alunos (gate padrão)', JSON.stringify(r.json));

r = await call('DELETE', `/api/guardians/${guardianId}`, { jar: JA });
ok(r.status === 204, 'exclui responsável');

r = await call('POST', '/api/auth/login', { body: { email: guardianEmail, password: 'Guardian123' } });
ok(r.status === 401, 'REGRESSÃO órfão: login do responsável excluído não existe mais');

console.log('7) HORÁRIO (grade semanal)');
r = await call('GET', `/api/timetable?classId=${classId}`, { jar: JA });
ok(r.status === 200 && r.json?.data?.length === 0, 'grade da turma nova está vazia', JSON.stringify(r.json));

r = await call('POST', '/api/timetable', { jar: JA, body: { classId, dayOfWeek: 1, startTime: '08:00', endTime: '08:50', room: '101' } });
ok(r.status === 201 && r.json?.data?.dayOfWeek === 1 && r.json?.data?.class?.name, 'cria slot de horário (com turma incluída)', JSON.stringify(r.json));
const slotId = r.json?.data?.id;

r = await call('POST', '/api/timetable', { jar: JA, body: { classId, dayOfWeek: 1, startTime: '08:30', endTime: '09:20' } });
ok(r.status === 409, 'REGRESSÃO: sobreposição de horário no mesmo dia é recusada (409)', JSON.stringify(r.json));

r = await call('POST', '/api/timetable', { jar: JS, body: { classId, dayOfWeek: 3, startTime: '10:00', endTime: '10:50' } });
ok(r.status === 403, 'student não escreve no horário (403)', JSON.stringify(r.json));

r = await call('GET', '/api/timetable', { jar: JA });
ok(r.status === 400 || r.status === 422, 'staff sem classId recebe validação (4xx)', r.status);

r = await call('GET', `/api/timetable?classId=${classId}`, { jar: JS });
ok(r.status === 200 && r.json?.data?.length === 1, 'aluno matriculado lê a grade da turma (classId é o dele)', JSON.stringify(r.json)?.slice(0, 150));

r = await call('GET', '/api/timetable', { jar: JS });
ok(r.status === 200 && (r.json?.data ?? []).some((s) => s.id === slotId), 'grade consolidada do aluno inclui o slot', JSON.stringify(r.json)?.slice(0, 150));

r = await call('GET', `/api/timetable?classId=${classId}`, { jar: JSTRANGER });
ok(r.status === 403, 'REGRESSÃO furo: aluno de fora não lê a grade de outra turma (403)', JSON.stringify(r.json));

r = await call('PUT', `/api/timetable/${slotId}`, { jar: JA, body: { startTime: '09:00', endTime: '09:50' } });
ok(r.status === 200 && r.json?.data?.startTime === '09:00', 'atualiza slot (PUT)', JSON.stringify(r.json));

r = await call('DELETE', `/api/timetable/${slotId}`, { jar: JA });
ok(r.status === 204, 'exclui slot');

r = await call('POST', '/api/timetable', { jar: JA, body: { classId, dayOfWeek: 2, startTime: '10:00', endTime: '10:50' } });
ok(r.status === 201, 'slot restante para provar cascade na limpeza', JSON.stringify(r.json)?.slice(0, 120));

console.log('8) LIMPEZA');
r = await call('DELETE', `/api/grades/${gradeId}`, { jar: JA });
ok(r.status === 204, 'exclui nota');

r = await call('DELETE', `/api/classes/${classId}`, { jar: JA });
ok(r.status === 204, 'exclui turma (matrícula/preença morrem em cascata)');

r = await call('GET', `/api/timetable?classId=${classId}`, { jar: JA });
ok(r.status === 200 && r.json?.data?.length === 0, 'REGRESSÃO: excluir turma remove slots de horário em cascata');

r = await call('DELETE', `/api/subjects/${subjectId}`, { jar: JA });
ok(r.status === 204, 'exclui matéria');

console.log('9) ISOLAMENTO (multi-tenancy)');
const SCHOOL2_CODE = `E2E-S2-${STAMP}`;

let r9 = await call('GET', '/api/schools', { jar: JA });
ok(r9.status === 200 && Array.isArray(r9.json?.data), 'admin global lista escolas', JSON.stringify(r9.json)?.slice(0, 150));
const schoolsRows = r9.json?.data ?? [];
const school1Id = schoolsRows.find((s) => s.code === 'ESCOLA-001')?.id;

r9 = await call('POST', '/api/schools', { jar: JA, body: { name: 'Escola E2E Dois', code: SCHOOL2_CODE } });
ok(r9.status === 201 && r9.json?.data?.id, 'admin global cria Escola 2', JSON.stringify(r9.json)?.slice(0, 150));
const school2Id = r9.json?.data?.id;

r9 = await call('POST', '/api/schools', { jar: JA, body: { name: 'Duplicada E2E', code: SCHOOL2_CODE } });
ok(r9.status === 409, 'código de escola duplicado é recusado (409)');

// Staff da Escola 2: professor + matéria + turma + aluno criados com schoolId no corpo.
const t2Email = `prof-s2-${STAMP}@escola.com`;
r9 = await call('POST', '/api/teachers', {
  jar: JA,
  body: {
    user: { email: t2Email, password: 'teacher123', role: 'TEACHER' },
    person: { name: 'Professor Escola 2', cpf: validCpf(STAMP + 501) },
    schoolId: school2Id,
  },
});
ok(r9.status === 201, 'admin global cria professor na Escola 2 (schoolId no corpo)', JSON.stringify(r9.json)?.slice(0, 150));
const teacher2Id = r9.json?.data?.teacher?.id ?? r9.json?.data?.id;

// Professor de referência da Escola 1 (o professor E2E da seção 2 já foi excluído
// na limpeza dela; a turma de referência precisa de um docente vivo e residente).
r9 = await call('POST', '/api/teachers', {
  jar: JA,
  body: {
    user: { email: `prof-s1ref-${STAMP}@escola.com`, password: 'teacher123', role: 'TEACHER' },
    person: { name: 'Professor Escola 1 Ref', cpf: validCpf(STAMP + 500) },
    schoolId: school1Id,
  },
});
ok(r9.status === 201, 'admin global cria professor de referência na Escola 1', JSON.stringify(r9.json)?.slice(0, 150));
const teacher1RefId = r9.json?.data?.teacher?.id ?? r9.json?.data?.id;

const subject2Code = `E2E-S2-${STAMP}`;
r9 = await call('POST', '/api/subjects', { jar: JA, body: { name: 'Matéria Escola 2', code: subject2Code, workload: 40, schoolId: school2Id } });
ok(r9.status === 201, 'admin global cria matéria na Escola 2', JSON.stringify(r9.json)?.slice(0, 150));
const subject2Id = r9.json?.data?.id;

r9 = await call('POST', '/api/classes', {
  jar: JA,
  body: { name: `Turma S2 ${STAMP}`, year: new Date().getFullYear(), shift: 'morning', teacherId: teacher2Id, subjectId: subject2Id, schoolId: school2Id },
});
ok(r9.status === 201, 'admin global cria turma na Escola 2', JSON.stringify(r9.json)?.slice(0, 150));
const class2Id = r9.json?.data?.id;

// Turma de referência na Escola 1 (admin global sem schoolId → Escola Demo, a primeira ativa).
const subject1RefCode = `E2E-S1-${STAMP}`;
r9 = await call('POST', '/api/subjects', { jar: JA, body: { name: 'Matéria Escola 1 Ref', code: subject1RefCode, workload: 40 } });
ok(r9.status === 201, 'admin global cria matéria sem alvo explícito (herda a primeira escola ativa)');
const subject1RefId = r9.json?.data?.id;
r9 = await call('POST', '/api/classes', {
  jar: JA,
  body: { name: `Turma S1 ${STAMP}`, year: new Date().getFullYear(), shift: 'morning', teacherId: teacher2Id, subjectId: subject1RefId },
});
ok(r9.status === 404, 'turma apontando professor de outra escola é recusada (404)');
r9 = await call('POST', '/api/classes', {
  jar: JA,
  body: { name: `Turma S1 ${STAMP}`, year: new Date().getFullYear(), shift: 'morning', teacherId: teacher1RefId, subjectId: subject1RefId },
});
ok(r9.status === 201, 'turma da Escola 1 criada com professor dela');
const class1RefId = r9.json?.data?.id;

// Aluno registrado publicamente na Escola 2 (pelo código).
const s2Email = `aluno-s2-${STAMP}@escola.com`;
r9 = await call('POST', '/api/auth/register', {
  body: {
    user: { email: s2Email, password: 'student123' },
    person: { name: 'Aluno Escola 2', cpf: validCpf(STAMP + 502) },
    schoolCode: SCHOOL2_CODE,
  },
});
ok(r9.status === 201, 'cadastro público com código da Escola 2 (201)');
r9 = await call('GET', `/api/auth/users?search=${s2Email}&limit=1`, { jar: JA });
const s2UserRow = (r9.json?.data?.data ?? r9.json?.data ?? [])[0];
const s2UserId = s2UserRow?.id;
ok(!!s2UserId && s2UserRow.schoolId === school2Id, 'usuário da Escola 2 nasce com schoolId dela');
r9 = await call('PATCH', `/api/auth/users/${s2UserId}/active`, { jar: JA, body: { active: true } });
ok(r9.status === 200, 'admin global ativa conta da Escola 2');

const JS2 = newJar();
r9 = await call('POST', '/api/auth/login', { body: { email: s2Email, password: 'student123' }, jar: JS2 });
ok(r9.status === 200, 'aluno da Escola 2 autentica');
ok(r9.json?.data?.user?.schoolId === school2Id, 'perfil/login carrega schoolId da escola');

// Matricula o aluno na turma da Escola 2 e cria um slot nela.
r9 = await call('GET', '/api/students?limit=100', { jar: JA });
const s2StudentId = (r9.json?.data?.data ?? r9.json?.data ?? []).filter((s) => s.user?.email === s2Email)[0]?.id;
ok(!!s2StudentId, 'aluno da Escola 2 está listado (admin global vê todas as escolas)');
r9 = await call('POST', `/api/classes/${class2Id}/enroll`, { jar: JA, body: { studentId: s2StudentId } });
ok(r9.status === 201, 'matricula aluno da Escola 2 na turma dela');
r9 = await call('POST', '/api/timetable', { jar: JA, body: { classId: class2Id, dayOfWeek: 1, startTime: '08:00', endTime: '08:50' } });
ok(r9.status === 201, 'slot de horário na turma da Escola 2');
const slot2Id = r9.json?.data?.id;
r9 = await call('POST', '/api/timetable', { jar: JA, body: { classId: class1RefId, dayOfWeek: 1, startTime: '09:00', endTime: '09:50' } });
ok(r9.status === 201, 'slot de horário na turma da Escola 1', JSON.stringify(r9.json)?.slice(0, 120));
const slot1Id = r9.json?.data?.id;

// Furos de leitura: cada escola só enxerga o que é dela. A rota /api/classes é
// staff-only, então o aluno prova o isolamento pelo horário (403 sem vínculo) e
// o professor da Escola 2 prova a leitura direta de turma de outra escola (404).
const JS1 = JS; // mesmo aluno do seed: a sessão da seção 3 continua válida (evita 11º login/min)
r9 = await call('GET', '/api/auth/me', { jar: JS1 });
ok(r9.status === 200 && r9.json?.data?.user?.email === 'aluno1@escola.com', 'aluno da Escola 1 (sessão da seção 3) autêntico');
r9 = await call('GET', `/api/timetable?classId=${class2Id}`, { jar: JS1 });
ok(r9.status === 403, 'aluno da Escola 1 pede horário de turma da Escola 2 → 403', JSON.stringify(r9.json)?.slice(0, 120));
r9 = await call('GET', `/api/timetable?classId=${class1RefId}`, { jar: JS2 });
ok(r9.status === 403, 'aluno da Escola 2 pede horário de turma da Escola 1 → 403', JSON.stringify(r9.json)?.slice(0, 120));
r9 = await call('GET', '/api/timetable', { jar: JS2 });
const consolidated2 = r9.json?.data ?? [];
ok(r9.status === 200 && consolidated2.every((s) => s.class?.id === class2Id), 'grade consolidada do aluno da Escola 2 só contém slots da Escola 2', JSON.stringify(consolidated2).slice(0, 120));

// Professor da Escola 2 não vê dados da Escola 1.
const JT2 = newJar();
r9 = await call('POST', '/api/auth/login', { body: { email: t2Email, password: 'teacher123' }, jar: JT2 });
ok(r9.status === 200, 'professor da Escola 2 autentica');
r9 = await call('GET', '/api/schools', { jar: JT2 });
ok(r9.status === 403, 'usuário com escola não lista escolas (403)');
r9 = await call('GET', `/api/classes/${class1RefId}`, { jar: JT2 });
ok(r9.status === 404, 'professor da Escola 2 lê turma da Escola 1 → 404 (sem vazar existência)', JSON.stringify(r9.json)?.slice(0, 120));
r9 = await call('GET', '/api/classes?limit=100', { jar: JT2 });
ok(r9.status === 200 && (r9.json?.data?.data ?? r9.json?.data ?? []).every((c) => c.id !== class1RefId), 'professor da Escola 2 não vê turma da Escola 1 na listagem');
r9 = await call('GET', `/api/subjects?limit=100`, { jar: JT2 });
ok(r9.status === 200 && (r9.json?.data?.data ?? r9.json?.data ?? []).every((s) => s.id !== subject1RefId) && (r9.json?.data?.data ?? r9.json?.data ?? []).some((s) => s.id === subject2Id), 'professor da Escola 2 só lista matérias da sua escola');
r9 = await call('GET', '/api/teachers?limit=100', { jar: JT2 });
ok(r9.status === 403, 'professor não lista professores (gate de papel, 403)', JSON.stringify(r9.json)?.slice(0, 120));

// Coordenador da Escola 1 (papel que lista professores): vê o da sua escola, não vê o da Escola 2.
const JC = newJar();
r9 = await call('POST', '/api/auth/login', { body: { email: 'coordenador@escola.com', password: 'coord123' }, jar: JC });
ok(r9.status === 200, 'coordenador da Escola 1 autentica');
r9 = await call('GET', '/api/teachers?limit=100', { jar: JC });
const tRows = (r9.json?.data?.data ?? r9.json?.data ?? []);
ok(r9.status === 200 && tRows.some((t) => t.id === teacher1RefId) && !tRows.some((t) => t.id === teacher2Id), 'coordenador da Escola 1 vê professores só da sua escola (sem o da Escola 2)', JSON.stringify(tRows.map((t) => t.id)).slice(0, 120));

console.log('9b) LIMPEZA DO ISOLAMENTO');
r9 = await call('DELETE', `/api/timetable/${slot2Id}`, { jar: JA });
ok(r9.status === 204, 'exclui slot da Escola 2');
r9 = await call('DELETE', `/api/timetable/${slot1Id}`, { jar: JA });
ok(r9.status === 204, 'exclui slot da Escola 1');
r9 = await call('DELETE', `/api/classes/${class2Id}`, { jar: JA });
ok(r9.status === 204, 'exclui turma da Escola 2');
r9 = await call('DELETE', `/api/classes/${class1RefId}`, { jar: JA });
ok(r9.status === 204, 'exclui turma de referência da Escola 1');
r9 = await call('DELETE', `/api/subjects/${subject2Id}`, { jar: JA });
ok(r9.status === 204, 'exclui matéria da Escola 2');
r9 = await call('DELETE', `/api/subjects/${subject1RefId}`, { jar: JA });
ok(r9.status === 204, 'exclui matéria de referência da Escola 1');
r9 = await call('DELETE', `/api/teachers/${teacher2Id}`, { jar: JA });
ok(r9.status === 204, 'exclui professor da Escola 2');
r9 = await call('DELETE', `/api/teachers/${teacher1RefId}`, { jar: JA });
ok(r9.status === 204, 'exclui professor de referência da Escola 1');

console.log('');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) {
  console.log('FALHAS:');
  failures.forEach((f) => console.log(' - ' + f));
  process.exit(1);
}

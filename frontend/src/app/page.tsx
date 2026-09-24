'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const stats = [
  { value: '8', label: 'módulos integrados' },
  { value: '100%', label: 'na nuvem, sem instalar nada' },
  { value: '4', label: 'perfis de acesso' },
  { value: '0', label: 'planilhas paralelas' },
];

const personas = [
  {
    icon: HiOutlineChartBar,
    role: 'Direção e coordenação',
    pain: 'Dados espalhados em planilhas e cadernos.',
    gain: 'Matrículas, turmas e desempenho em um painel só.',
  },
  {
    icon: HiOutlineClipboardList,
    role: 'Professores',
    pain: 'Chamada e notas tomam o fim da aula.',
    gain: 'Presença em lote e notas lançadas em segundos.',
  },
  {
    icon: HiOutlineUserGroup,
    role: 'Secretaria',
    pain: 'Cadastro refeito a cada semestre.',
    gain: 'Aluno cadastrado uma vez, matrícula automática com avisos.',
  },
];

const steps = [
  { n: '1', title: 'Cadastre a escola', text: 'Matérias, professores e turmas em minutos.' },
  { n: '2', title: 'Matricule os alunos', text: 'Cada matrícula avisa o aluno sozinho.' },
  { n: '3', title: 'Acompanhe tudo', text: 'Notas, presença e avisos fluem no dia a dia.' },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push('/dashboard');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'EscolaApp',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web',
            inLanguage: 'pt-BR',
            description:
              'Sistema de gestão escolar: alunos, professores, turmas, notas, presença e avisos em um só lugar.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
          }),
        }}
      />
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <HiOutlineAcademicCap className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold text-gray-900">EscolaApp</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/changelog" className="text-gray-600 hover:text-gray-900">
              Novidades
            </Link>
            <Link href="/login" className="btn-primary">
              Entrar
              <HiOutlineArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pt-12 pb-12 lg:pt-16 grid gap-10 lg:grid-cols-5 items-center">
          <div className="lg:col-span-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <HiOutlineSparkles className="h-4 w-4" />
              Gestão escolar completa no navegador
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              A escola inteira, <span className="text-primary-600">sem a papelada</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-600">
              Alunos, professores, turmas, notas, presença e avisos em um só lugar.
              Menos planilha, mais aula.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="btn-primary px-6 py-3 text-base">
                Acessar a plataforma
                <HiOutlineArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/changelog" className="btn-secondary px-6 py-3 text-base">
                Ver novidades
              </Link>
            </div>
            <dl className="mt-10 grid max-w-2xl grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="text-3xl font-bold text-gray-900">{s.value}</dd>
                  <dt className="mt-1 text-sm text-gray-500">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <aside className="lg:col-span-2 card !p-8">
            <h2 className="text-lg font-bold text-gray-900">O que você resolve hoje</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              {[
                'Matricular alunos com aviso automático',
                'Lançar notas e presença em segundos',
                'Acompanhar turmas e desempenho no painel',
                'Avisar alunos, pais e equipe na hora',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn-primary mt-6 w-full px-6 py-3 text-base">
              Começar agora
              <HiOutlineArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-3 text-center text-xs text-gray-500">
              Sem instalação. Funciona no computador e no celular.
            </p>
          </aside>
        </section>

        <section className="bg-gray-50 border-y border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <h2 className="text-2xl font-bold text-gray-900">
              Feito para cada papel da escola
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {personas.map((p) => (
                <article key={p.role} className="card">
                  <p.icon className="h-8 w-8 text-primary-600" />
                  <h3 className="mt-3 font-semibold text-gray-900">{p.role}</h3>
                  <p className="mt-1 text-sm text-gray-500">Dor: {p.pain}</p>
                  <p className="mt-2 text-sm font-medium text-gray-700">Ganho: {p.gain}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-bold text-gray-900">Comece em 3 passos</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="card flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-xl bg-gray-900 p-8 text-center">
            <HiOutlineShieldCheck className="mx-auto h-10 w-10 text-green-400" />
            <h2 className="mt-3 text-2xl font-bold text-white">
              Seguro por padrão, rápido por arquitetura
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-gray-300">
              Login com papéis de acesso, senhas protegidas, bloqueio contra acessos
              abusivos e infraestrutura de nuvem escalável.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium">
              {['Alunos', 'Professores', 'Matérias', 'Turmas', 'Notas', 'Presença', 'Avisos', 'Relatórios'].map(
                (m) => (
                  <span key={m} className="rounded-full bg-gray-800 px-3 py-1 text-gray-200">
                    {m}
                  </span>
                ),
              )}
            </div>
            <Link href="/login" className="btn-primary mt-6 px-6 py-3 text-base">
              Entrar agora
              <HiOutlineArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>EscolaApp — gestão escolar sem papelada.</p>
          <div className="flex items-center gap-4">
            <Link href="/changelog" className="hover:text-gray-900">
              Novidades
            </Link>
            <Link href="/login" className="hover:text-gray-900">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

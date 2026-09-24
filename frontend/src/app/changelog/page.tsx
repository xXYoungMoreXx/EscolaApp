import Link from 'next/link';
import { HiOutlineAcademicCap, HiOutlineArrowLeft, HiOutlineSparkles } from 'react-icons/hi';

type Tag = 'Novo' | 'Melhoria' | 'Correção' | 'Segurança';

interface Entry {
  version: string;
  date: string;
  title: string;
  intro: string;
  items: { tag: Tag; text: string }[];
}

const tagStyles: Record<Tag, string> = {
  Novo: 'bg-green-100 text-green-800',
  Melhoria: 'bg-blue-100 text-blue-800',
  'Correção': 'bg-yellow-100 text-yellow-800',
  'Segurança': 'bg-red-100 text-red-800',
};

const editions: Entry[] = [
  {
    version: 'v1.2',
    date: 'setembro de 2026',
    title: 'Banco na nuvem, do jeito gratuito',
    intro:
      'O EscolaApp agora roda com banco serverless gratuito e com os scripts de banco à prova de ambiente.',
    items: [
      { tag: 'Novo', text: 'Deploy documentado 100% em planos gratuitos de banco na nuvem.' },
      { tag: 'Melhoria', text: 'Comando de seed carrega o .env sozinho — sem export manual de variáveis.' },
      { tag: 'Correção', text: 'Ajuste no script inicial do banco que impedia a primeira instalação.' },
    ],
  },
  {
    version: 'v1.1',
    date: 'setembro de 2026',
    title: 'Adeus servidor próprio: 100% serverless',
    intro:
      'O backend dedicado foi portado para funções serverless dentro do próprio app. Mesma API, zero servidor para cuidar.',
    items: [
      { tag: 'Novo', text: 'API completa (auth, alunos, professores, matérias, turmas, notas, presença, avisos).' },
      { tag: 'Novo', text: 'Páginas estáticas na CDN global e API sob demanda por rota.' },
      { tag: 'Melhoria', text: 'Matrículas sequenciais geradas pelo banco — sem risco de duplicar.' },
      { tag: 'Segurança', text: 'Proteções de acesso, bloqueio contra abuso e segredos obrigatórios em produção.' },
    ],
  },
  {
    version: 'v1.0',
    date: 'setembro de 2026',
    title: 'Lançamento: gestão escolar completa',
    intro:
      'A primeira versão pública: cadastro e gestão de alunos, professores, matérias, turmas, notas e presenças.',
    items: [
      { tag: 'Novo', text: 'CRUD completo com paginação, busca e controle por papéis (admin, coordenação, professor, aluno).' },
      { tag: 'Novo', text: 'Presença individual e em lote, notas por trimestre, avisos automáticos.' },
      { tag: 'Novo', text: 'Dashboard com gráficos, tema escuro e notificações.' },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <HiOutlineSparkles className="h-4 w-4" />
              Newsletter de produto
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
              Novidades do EscolaApp
            </h1>
            <p className="mt-3 max-w-xl text-gray-600">
              Cada versão, contada como ela é: o que mudou, o que melhorou e o que foi corrigido.
              Sem jargão, sem enrolação.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm">
              <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
                Apresentação
              </Link>
              <Link href="/login" className="btn-primary">
                Entrar na plataforma
              </Link>
            </div>
          </div>
          <aside className="card h-fit lg:sticky lg:top-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Nesta página</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {editions.map((e) => (
                <li key={e.version}>
                  <a href={`#${e.version}`} className="text-gray-700 hover:text-primary-600">
                    <span className="font-bold">{e.version}</span>
                    {' — '}
                    {e.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <ol className="relative space-y-10 border-l-2 border-gray-200 pl-8">
          {editions.map((e) => (
            <li key={e.version} className="relative">
              <span className="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white">
                <HiOutlineAcademicCap className="h-5 w-5" />
              </span>
              <article id={e.version} className="card scroll-mt-6">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="rounded-md bg-gray-900 px-2 py-0.5 text-sm font-bold text-white">
                    {e.version}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{e.title}</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">{e.date}</p>
                <p className="mt-3 text-gray-700">{e.intro}</p>
                <ul className="mt-4 space-y-2">
                  {e.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className={`badge mt-0.5 shrink-0 ${tagStyles[item.tag]}`}>
                        {item.tag}
                      </span>
                      <span className="text-gray-700">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>

        <footer className="mt-12 rounded-xl bg-gray-900 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Gostou do ritmo?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-300">
            Volte sempre: esta página é atualizada a cada versão enviada para produção.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/login" className="btn-primary">
              Usar o EscolaApp
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
            >
              Apresentação
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

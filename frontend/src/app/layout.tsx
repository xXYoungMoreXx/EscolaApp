import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Shell from './shell';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://escola-app.vercel.app'),
  title: {
    default: 'EscolaApp — Gestão escolar sem papelada',
    template: '%s | EscolaApp',
  },
  description:
    'Alunos, professores, turmas, notas, presença e avisos em um só lugar. Sistema de gestão escolar 100% na nuvem.',
  keywords: ['gestão escolar', 'sistema escolar', 'alunos', 'professores', 'notas', 'presença', 'secretaria escolar'],
  authors: [{ name: 'EscolaApp' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'EscolaApp',
    title: 'EscolaApp — Gestão escolar sem papelada',
    description: 'Alunos, professores, turmas, notas, presença e avisos em um só lugar.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EscolaApp — Gestão escolar sem papelada',
    description: 'Alunos, professores, turmas, notas, presença e avisos em um só lugar.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}

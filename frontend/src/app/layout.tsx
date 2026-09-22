import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Shell from './shell';

export const metadata: Metadata = {
  title: 'Sistema de Gestão Escolar',
  description: 'Sistema completo de gestão escolar para cadastro e acompanhamento de alunos, professores e turmas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}

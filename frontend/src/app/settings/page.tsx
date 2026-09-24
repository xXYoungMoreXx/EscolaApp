'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTheme, Theme } from '@/lib/theme-context';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineSun,
  HiOutlineBell,
  HiOutlineSpeakerphone,
  HiOutlineUsers,
  HiOutlineMoon,
  HiOutlineDesktopComputer,
  HiOutlineKey,
} from 'react-icons/hi';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
};

interface Profile {
  id: string;
  email: string;
  role: string;
  active: boolean;
  student?: { registration: string; status: string; person: { name: string } } | null;
  teacher?: { person: { name: string } } | null;
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: any;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-1">
        <Icon className="h-6 w-6 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">{desc}</p>
      {children}
    </div>
  );
}

function ProfileSection() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    api
      .get('/api/auth/profile')
      .then((res) => setProfile(res.data.data))
      .catch(() => toast.error('Erro ao carregar perfil'));
  }, []);

  if (!profile) {
    return (
      <Section icon={HiOutlineUser} title="Perfil" desc="Seus dados cadastrais.">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </Section>
    );
  }

  const name =
    profile.student?.person?.name || profile.teacher?.person?.name || profile.email;

  return (
    <Section icon={HiOutlineUser} title="Perfil" desc="Seus dados cadastrais.">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Nome</dt>
          <dd className="font-medium text-gray-900">{name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium text-gray-900">{profile.email}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Papel</dt>
          <dd className="font-medium text-gray-900">{roleLabels[profile.role]}</dd>
        </div>
        {profile.student && (
          <>
            <div>
              <dt className="text-gray-500">Matrícula</dt>
              <dd className="font-medium text-gray-900">{profile.student.registration}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Situação</dt>
              <dd className="font-medium text-gray-900">{profile.student.status}</dd>
            </div>
          </>
        )}
        <div>
          <dt className="text-gray-500">Conta</dt>
          <dd>
            <span className={`badge ${profile.active ? 'badge-success' : 'badge-danger'}`}>
              {profile.active ? 'Ativa' : 'Desativada'}
            </span>
          </dd>
        </div>
      </dl>
    </Section>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('A confirmação não confere com a nova senha');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section icon={HiOutlineLockClosed} title="Segurança" desc="Troque sua senha de acesso.">
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        <div>
          <label className="label">Senha atual *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
            required
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">Nova senha (mín. 8) *</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirmar nova senha *</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-field"
            required
            autoComplete="new-password"
          />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : 'Alterar senha'}
          </button>
        </div>
      </form>
    </Section>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: any }[] = [
    { value: 'light', label: 'Claro', icon: HiOutlineSun },
    { value: 'dark', label: 'Escuro', icon: HiOutlineMoon },
    { value: 'system', label: 'Automático (sistema)', icon: HiOutlineDesktopComputer },
  ];

  return (
    <Section icon={HiOutlineSun} title="Aparência" desc="Escolha o tema da interface.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              theme === o.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 dark:border-primary-400'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <o.icon className="h-6 w-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">{o.label}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

function NotificationPrefsSection() {
  const [enabled, setEnabled] = useState(true);
  const { unread, markAllAsRead, refresh } = useNotifications();

  useEffect(() => {
    setEnabled(localStorage.getItem('escola-notif-enabled') !== 'off');
  }, []);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem('escola-notif-enabled', next ? 'on' : 'off');
    if (next) refresh();
    toast.success(next ? 'Notificações ativadas' : 'Notificações pausadas');
  };

  return (
    <Section
      icon={HiOutlineBell}
      title="Notificações"
      desc="Controle os avisos que você recebe no sino do topo."
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            role="switch"
            aria-checked={enabled}
            onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {enabled ? 'Recebendo notificações (atualiza a cada 30s)' : 'Notificações pausadas'}
          </span>
        </label>
        <button onClick={markAllAsRead} className="btn-secondary text-xs">
          Marcar todas como lidas ({unread} não lidas)
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Você recebe avisos automáticos de notas lançadas e matrículas em turmas, além de
        comunicados da coordenação.
      </p>
    </Section>
  );
}

function AnnouncementsSection() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/api/notifications', {
        title,
        message,
        type: 'announcement',
        targetRole: targetRole || null,
      });
      toast.success(
        targetRole ? `Aviso enviado para ${roleLabels[targetRole]}!` : 'Aviso geral publicado!'
      );
      setTitle('');
      setMessage('');
      setTargetRole('');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao publicar aviso');
    } finally {
      setSending(false);
    }
  };

  return (
    <Section
      icon={HiOutlineSpeakerphone}
      title="Comunicados"
      desc="Publique avisos para um papel específico ou para toda a escola."
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        <div>
          <label className="label">Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className="label">Destinatários</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="input-field"
          >
            <option value="">Toda a escola</option>
            <option value="STUDENT">Alunos</option>
            <option value="TEACHER">Professores</option>
            <option value="COORDINATOR">Coordenadores</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Mensagem *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field"
            rows={3}
            required
            maxLength={500}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={sending} className="btn-primary">
            {sending ? 'Publicando...' : 'Publicar aviso'}
          </button>
        </div>
      </form>
    </Section>
  );
}

function ResetsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/reset-requests');
      setItems(res.data.data);
    } catch {
      toast.error('Erro ao carregar pedidos de reset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const approve = async (id: string, email: string) => {
    try {
      const res = await api.post(`/api/auth/reset-requests/${id}/approve`);
      setTempPassword(res.data.data.tempPassword);
      setTempEmail(email);
      toast.success('Reset aprovado! Anote a senha temporária.');
      fetchItems();
    } catch {
      toast.error('Erro ao aprovar reset');
    }
  };

  const reject = async (id: string) => {
    try {
      await api.post(`/api/auth/reset-requests/${id}/reject`);
      toast.success('Pedido recusado.');
      fetchItems();
    } catch {
      toast.error('Erro ao recusar pedido');
    }
  };

  return (
    <Section
      icon={HiOutlineKey}
      title="Resets de senha"
      desc="Aprove pedidos de quem esqueceu a senha. A senha temporária aparece uma única vez — anote e informe manualmente ao usuário."
    >
      {tempPassword && (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm text-gray-700">
            Senha temporária de <strong>{tempEmail}</strong>:
          </p>
          <p className="mt-1 text-2xl font-mono font-bold tracking-wider text-gray-900">
            {tempPassword}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(tempPassword);
                toast.success('Copiada!');
              }}
              className="btn-secondary text-xs"
            >
              Copiar
            </button>
            <button onClick={() => setTempPassword(null)} className="btn-secondary text-xs">
              Ocultar
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum pedido pendente.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-gray-200 p-3"
            >
              <div className="text-sm">
                <p className="font-medium text-gray-900">{r.user?.email}</p>
                <p className="text-gray-500">
                  {roleLabels[r.user?.role] || r.user?.role} — pedido em{' '}
                  {new Date(r.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve(r.id, r.user?.email)} className="btn-primary text-xs">
                  Aprovar e gerar senha
                </button>
                <button onClick={() => reject(r.id)} className="btn-secondary text-xs">
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/users?limit=50');
      setUsers(res.data.data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (u: any) => {
    try {
      await api.patch(`/api/auth/users/${u.id}/active`, { active: !u.active });
      toast.success(`Conta ${!u.active ? 'ativada' : 'desativada'}!`);
      fetchUsers();
    } catch {
      toast.error('Erro ao atualizar conta');
    }
  };

  return (
    <Section
      icon={HiOutlineUsers}
      title="Gestão de contas"
      desc="Ative ou desative o acesso de usuários. Contas desativadas não conseguem fazer login."
    >
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Papel</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{u.email}</td>
                  <td className="table-cell">{roleLabels[u.role] || u.role}</td>
                  <td className="table-cell">
                    <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                      {u.active ? 'Ativa' : 'Desativada'}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <button onClick={() => toggleActive(u)} className="btn-secondary text-xs">
                      {u.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const canAnnounce = role === 'ADMIN' || role === 'COORDINATOR';
  const canReset = role === 'ADMIN' || role === 'COORDINATOR';
  const isAdmin = role === 'ADMIN';

  return (
    <div className="app-page space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">
          Gerencie sua conta e preferências
          {role && ` — perfil ${roleLabels[role]}`}
        </p>
      </div>

      <ProfileSection />
      <SecuritySection />
      <AppearanceSection />
      <NotificationPrefsSection />
      {canAnnounce && <AnnouncementsSection />}
      {canReset && <ResetsSection />}
      {isAdmin && <UsersSection />}

      {!isAdmin && (
        <p className="text-xs text-gray-500">
          Recursos de gestão de contas são exclusivos do Administrador.
          {role === 'TEACHER' || role === 'STUDENT'
            ? ' Professores e alunos configuram apenas perfil, segurança, aparência e notificações.'
            : ' Coordenadores também podem publicar comunicados.'}
        </p>
      )}
    </div>
  );
}

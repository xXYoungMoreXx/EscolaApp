'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  class: { id: string; name: string; shift: string; subject: { name: string } };
}

const STAFF_ROLES = ['ADMIN', 'COORDINATOR', 'TEACHER'];
const EDITOR_ROLES = ['ADMIN', 'COORDINATOR'];

const DAY_LABELS: Record<number, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
  7: 'Domingo',
};

export default function TimetablePage() {
  const { user } = useAuth();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);
  const canEdit = !!user && EDITOR_ROLES.includes(user.role);

  const [classes, setClasses] = useState<Array<{ id: string; name: string; shift: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [form, setForm] = useState({ dayOfWeek: '1', startTime: '08:00', endTime: '08:50', room: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return; // espera o probe /me resolver para não chamar com o papel errado
    try {
      const url = isStaff && selectedClassId ? `/api/timetable?classId=${selectedClassId}` : '/api/timetable';
      const res = await api.get<{ data: Slot[] }>(url);
      setSlots(res.data.data);
    } catch {
      toast.error('Erro ao carregar horário');
      setSlots([]);
    }
  }, [isStaff, selectedClassId, user]);

  useEffect(() => {
    if (!user) return;
    setSlots(null);
    let cleanup = false;
    if (isStaff) {
      api
        .get<{ data: Array<{ id: string; name: string; shift: string }> }>('/api/classes?limit=100')
        .then((res) => {
          if (cleanup) return;
          setClasses(res.data.data);
          setSelectedClassId(res.data.data[0]?.id ?? null);
        })
        .catch(() => {
          if (!cleanup) {
            toast.error('Erro ao listar turmas');
            setClasses([]);
          }
        });
    } else {
      load();
    }
    return () => { cleanup = true; };
  }, [user, isStaff]);

  // staff: troca de turma via select recarrega a grade
  useEffect(() => {
    if (isStaff && selectedClassId) load();
  }, [isStaff, selectedClassId, load]);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    setSubmitting(true);
    try {
      await api.post('/api/timetable', {
        classId: selectedClassId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room || undefined,
      });
      toast.success('Aula adicionada ao horário');
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao adicionar aula');
    } finally {
      setSubmitting(false);
    }
  };

  const removeSlot = async (id: string) => {
    try {
      await api.delete(`/api/timetable/${id}`);
      toast.success('Aula removida do horário');
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover aula');
    }
  };

  const loading = slots === null;
  const byClass = new Map<string, { label: string; slots: Slot[] }>();
  for (const s of slots ?? []) {
    const key = s.class.id;
    byClass.set(key, byClass.get(key) ?? {
      label: `${s.class.name} · ${s.class.subject?.name ?? ''}`,
      slots: [],
    });
    byClass.get(key)!.slots.push(s);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <HiOutlineCalendar className="h-7 w-7 text-primary-600" />
          Horário
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isStaff ? 'Grade semanal de aulas da turma.' : 'Grade semanal de aulas das suas turmas.'}
        </p>
      </div>

      {isStaff && (
        <div className="card p-4">
          <label className="text-sm font-medium text-gray-700" htmlFor="class-select">Turma</label>
          <select
            id="class-select"
            className="mt-1 block w-full max-w-sm rounded-lg border-gray-300 text-sm"
            value={selectedClassId ?? ''}
            onChange={(e) => { setSelectedClassId(e.target.value || null); setSlots(null); }}
          >
            {classes.length === 0 && <option value="">Nenhuma turma cadastrada</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.shift})</option>
            ))}
          </select>
        </div>
      )}

      {canEdit && selectedClassId && (
        <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={addSlot}>
          <div>
            <label className="block text-xs font-medium text-gray-500" htmlFor="day">Dia</label>
            <select
              id="day"
              className="mt-1 block rounded-lg border-gray-300 text-sm"
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500" htmlFor="start">Início</label>
            <input
              id="start" type="time" required
              className="mt-1 block rounded-lg border-gray-300 text-sm"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500" htmlFor="end">Fim</label>
            <input
              id="end" type="time" required
              className="mt-1 block rounded-lg border-gray-300 text-sm"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500" htmlFor="room">Sala</label>
            <input
              id="room" type="text" placeholder="opcional" maxLength={30}
              className="mt-1 block rounded-lg border-gray-300 text-sm"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            />
          </div>
          <button
            type="submit" disabled={submitting || loading}
            className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <HiOutlinePlus className="h-4 w-4" /> Adicionar aula
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : byClass.size === 0 ? (
        <div className="card p-10 text-center text-gray-500">Nenhuma aula cadastrada no horário.</div>
      ) : (
        [...byClass.entries()].map(([classId, group]) => (
          <div key={classId} className="card overflow-hidden p-6">
            <h2 className="text-lg font-bold text-gray-900">{group.label}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{DAY_LABELS[slot.dayOfWeek]}</p>
                    <p className="text-xs text-gray-500">
                      {slot.startTime} – {slot.endTime}{slot.room ? ` · Sala ${slot.room}` : ''}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      type="button" aria-label="Remover aula" onClick={() => removeSlot(slot.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

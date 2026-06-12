import React, { useState } from 'react';
import { clubs, matches, tournaments } from '../data/mockData';
import { Users, Shield, CalendarDays, Trophy, Newspaper, BarChart3, Plus, ChevronDown } from 'lucide-react';

function getUsers() {
  try { return JSON.parse(localStorage.getItem('gorugby_users') ?? '[]'); } catch { return []; }
}

interface InlineFormProps { title: string; fields: { label: string; type?: string; placeholder?: string }[]; onSave: (values: Record<string,string>) => void; onClose: () => void; }
function InlineForm({ title, fields, onSave, onClose }: InlineFormProps) {
  const [values, setValues] = useState<Record<string,string>>({});
  return (
    <div className="inline-form">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="inline-form-title">{title}</span>
        <button className="btn-icon" onClick={onClose}><ChevronDown size={15} /></button>
      </div>
      {fields.map(f => (
        <div key={f.label} className="form-group" style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12 }}>{f.label}</label>
          <input type={f.type ?? 'text'} placeholder={f.placeholder ?? ''} value={values[f.label] ?? ''} onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))} style={{ padding: '8px 10px', fontSize: 13 }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 7, marginTop: 6 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { onSave(values); onClose(); }}>Guardar</button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

export default function Admin() {
  const users = getUsers();
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const toggle = (key: string) => setActiveForm(v => v === key ? null : key);

  const CARDS: { title: string; icon: React.ElementType; actions: { label: string; formKey?: string; fields?: { label: string; type?: string; placeholder?: string }[] }[] }[] = [
    {
      title: 'Gestión de Usuarios', icon: Users,
      actions: [
        { label: 'Invitar usuario',      formKey: 'inv-user',   fields: [{ label: 'Email', type: 'email', placeholder: 'nuevo@correo.com' }] },
        { label: 'Cambiar rol',          formKey: 'change-role', fields: [{ label: 'Email del usuario' }, { label: 'Nuevo rol', placeholder: 'user / admin' }] },
        { label: 'Ver afiliaciones'                              },
        { label: 'Exportar usuarios'                             },
      ],
    },
    {
      title: 'Gestión de Clubes', icon: Shield,
      actions: [
        { label: 'Crear club',    formKey: 'new-club',  fields: [{ label: 'Nombre' }, { label: 'Ciudad' }, { label: 'Cancha' }] },
        { label: 'Editar club',   formKey: 'edit-club', fields: [{ label: 'ID del club' }, { label: 'Campo a editar' }, { label: 'Nuevo valor' }] },
        { label: 'Estadísticas de club' },
        { label: 'Publicar noticia'     },
      ],
    },
    {
      title: 'Gestión de Partidos', icon: CalendarDays,
      actions: [
        { label: 'Crear partido', formKey: 'new-match', fields: [{ label: 'Local' }, { label: 'Visitante' }, { label: 'Torneo' }, { label: 'Fecha', type: 'date' }, { label: 'Hora', type: 'time' }] },
        { label: 'Actualizar resultado', formKey: 'upd-result', fields: [{ label: 'ID partido' }, { label: 'Score local', type: 'number' }, { label: 'Score visitante', type: 'number' }] },
        { label: 'Cargar estadísticas'   },
        { label: 'Archivar partido'      },
      ],
    },
    {
      title: 'Gestión de Torneos', icon: Trophy,
      actions: [
        { label: 'Crear torneo', formKey: 'new-tour', fields: [{ label: 'Nombre' }, { label: 'Categoría' }, { label: 'Nº equipos', type: 'number' }, { label: 'Fecha inicio', type: 'date' }] },
        { label: 'Editar fixture'  },
        { label: 'Ver historial'   },
        { label: 'Publicar llaves' },
      ],
    },
    {
      title: 'Gestión de Noticias', icon: Newspaper,
      actions: [
        { label: 'Crear noticia',     formKey: 'new-news', fields: [{ label: 'Título' }, { label: 'Contenido', placeholder: 'Texto de la noticia...' }] },
        { label: 'Programar publicación' },
        { label: 'Noticias activas'      },
        { label: 'Eliminar noticia'      },
      ],
    },
    {
      title: 'Reportes', icon: BarChart3,
      actions: [
        { label: 'Actividad de usuarios' },
        { label: 'Partidos más vistos'   },
        { label: 'Engagement comunidad'  },
        { label: 'Exportar CSV'          },
      ],
    },
  ];

  return (
    <div>
      {toast && (
        <div className="toast success" style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, minWidth: 260 }}>
          ✓ {toast}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card c-green">
          <div className="stat-card-icon"><Users size={18} /></div>
          <div className="stat-label">Usuarios</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="stat-card c-blue">
          <div className="stat-card-icon"><Shield size={18} /></div>
          <div className="stat-label">Clubes</div>
          <div className="stat-value">{clubs.length}</div>
        </div>
        <div className="stat-card c-gold">
          <div className="stat-card-icon"><Trophy size={18} /></div>
          <div className="stat-label">Torneos activos</div>
          <div className="stat-value">{tournaments.filter(t => t.status === 'active').length}</div>
        </div>
        <div className="stat-card c-red">
          <div className="stat-card-icon"><CalendarDays size={18} /></div>
          <div className="stat-label">Partidos totales</div>
          <div className="stat-value">{matches.length}</div>
        </div>
      </div>

      {/* Action cards */}
      <div className="admin-grid" style={{ marginBottom: 22 }}>
        {CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="admin-card">
              <h3><Icon size={14} /> {card.title}</h3>
              {card.actions.map(action => (
                <div key={action.label}>
                  <button
                    className="admin-btn"
                    onClick={() => {
                      if (action.formKey) {
                        toggle(action.formKey);
                      } else {
                        showToast(`${action.label} — Funcionalidad en desarrollo`);
                      }
                    }}
                  >
                    {action.formKey ? <Plus size={11} style={{ display: 'inline', marginRight: 4 }} /> : null}
                    {action.label}
                  </button>
                  {action.formKey && activeForm === action.formKey && action.fields && (
                    <InlineForm
                      title={action.label}
                      fields={action.fields}
                      onSave={(vals) => showToast(`${action.label} guardado correctamente`)}
                      onClose={() => setActiveForm(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Users table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Users size={15} /> Usuarios registrados</span>
          <span className="tag tag-gray">{users.length} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Desde</th><th>Club</th></tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td style={{ color: 'var(--text-3)' }}>{u.email}</td>
                  <td><span className={`tag ${u.role === 'admin' ? 'tag-red' : 'tag-green'}`}>{u.role === 'admin' ? 'Admin' : 'Usuario'}</span></td>
                  <td>{u.joinedAt}</td>
                  <td>{clubs.find(c => c.id === u.clubId)?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

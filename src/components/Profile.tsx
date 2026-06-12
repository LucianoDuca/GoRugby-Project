import React, { useState } from 'react';
import { Edit3, Save, X, Star, Trophy, MessageCircle, Shield } from 'lucide-react';
import { useAuth } from '../app/main';
import { clubs, matches, initialReviews } from '../data/mockData';
import { ClubLogo, ClubBadge } from './ClubLogo';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.name ?? '');
  const [bio,      setBio]      = useState(user?.bio ?? '');
  const [clubId,   setClubId]   = useState(user?.clubId ?? '');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [saved,    setSaved]    = useState(false);

  if (!user) return null;

  const initials = user.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const club = clubs.find(c => c.id === user.clubId);

  // Recent reviews by this user
  const myReviews = (() => {
    try { return (JSON.parse(localStorage.getItem('gorugby_reviews') ?? '[]') as typeof initialReviews).filter(r => r.userId === user.id); }
    catch { return initialReviews.filter(r => r.userId === user.id); }
  })();

  const save = () => {
    if (!name.trim()) { setError('El nombre no puede estar vacío'); return; }
    if (password && password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password && password.length < 6)  { setError('Mínimo 6 caracteres para la contraseña'); return; }
    const upd: Partial<typeof user> = { name: name.trim(), bio: bio.trim(), clubId: clubId || undefined };
    if (password) upd.password = password;
    updateUser(upd);
    setPassword(''); setConfirm(''); setError(''); setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const cancel = () => {
    setName(user.name); setBio(user.bio ?? ''); setClubId(user.clubId ?? '');
    setPassword(''); setConfirm(''); setError(''); setEditing(false);
  };

  return (
    <div>
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          {club && <p style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClubBadge clubId={club.id} initials={club.logo} size={18} /> {club.name}
          </p>}
          {user.bio && <p style={{ marginTop: 6, fontStyle: 'italic', maxWidth: 400, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{user.bio}</p>}
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{myReviews.length}</div>
            <div className="profile-stat-label">Reseñas</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{user.totalPredictions}</div>
            <div className="profile-stat-label">Predicciones</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{user.followedClubs.length}</div>
            <div className="profile-stat-label">Clubes</div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div>
          {/* Edit form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Información personal</span>
              {!editing ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit3 size={13} /> Editar</button>
              ) : (
                <div style={{ display: 'flex', gap: 7 }}>
                  <button className="btn btn-ghost btn-sm" onClick={cancel}><X size={13} /> Cancelar</button>
                  <button className="btn btn-primary btn-sm" onClick={save}><Save size={13} /> Guardar</button>
                </div>
              )}
            </div>

            {saved && (
              <div className="toast success" style={{ marginBottom: 14 }}>✓ Perfil actualizado correctamente</div>
            )}
            {error && <p className="form-error" style={{ marginBottom: 10 }}>{error}</p>}

            <DisplayOrEdit label="Nombre completo" editing={editing} value={name} display={user.name}>
              <input type="text" value={name} onChange={e => setName(e.target.value)} />
            </DisplayOrEdit>

            <div className="form-group">
              <label>Email</label>
              <div style={{ padding: '10px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', fontSize: 14, color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                {user.email}
              </div>
            </div>

            <DisplayOrEdit label="Sobre mí" editing={editing} value={bio} display={user.bio || 'Sin descripción'} faded={!user.bio}>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Contá algo sobre vos..." />
            </DisplayOrEdit>

            <div className="form-group">
              <label>Club favorito</label>
              {editing ? (
                <select value={clubId} onChange={e => setClubId(e.target.value)}>
                  <option value="">Sin club</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
                </select>
              ) : (
                <div style={{ padding: '10px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', fontSize: 14, color: club ? 'var(--text)' : 'var(--text-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {club ? <><ClubBadge clubId={club.id} initials={club.logo} size={22} /> {club.name}</> : 'Sin club asociado'}
                </div>
              )}
            </div>

            {editing && (
              <>
                <div className="divider" />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>Cambiar contraseña (dejar vacío para no cambiar)</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nueva contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
                  </div>
                  <div className="form-group">
                    <label>Confirmar contraseña</label>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetir contraseña" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* My reviews */}
          {myReviews.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <span className="card-title"><Star size={15} /> Mis reseñas</span>
                <span className="tag tag-gray">{myReviews.length}</span>
              </div>
              <div className="review-list">
                {myReviews.slice(0, 3).map(r => {
                  const match = matches.find(m => m.id === r.matchId);
                  return (
                    <div key={r.id} className="review-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
                          {match ? `${match.home} vs ${match.away}` : 'Partido'} · {new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={12} fill={r.rating >= n ? 'var(--gold)' : 'none'} color={r.rating >= n ? 'var(--gold)' : 'var(--border)'} />
                          ))}
                        </div>
                      </div>
                      <p className="review-text" style={{ marginBottom: 0 }}>{r.comment}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Account summary */}
          <div className="card">
            <div className="card-header"><span className="card-title">Resumen de cuenta</span></div>
            <div className="admin-stat-row"><span>Miembro desde</span><strong>{user.joinedAt}</strong></div>
            <div className="admin-stat-row"><span>Rol</span>
              <span className={`tag ${user.role === 'admin' ? 'tag-red' : 'tag-green'}`}>
                {user.role === 'admin' ? 'Administrador' : 'Aficionado'}
              </span>
            </div>
            <div className="admin-stat-row"><span>Reseñas</span><strong>{myReviews.length}</strong></div>
            <div className="admin-stat-row"><span>Predicciones</span><strong>{user.totalPredictions}</strong></div>
            <div className="admin-stat-row"><span>Clubes seguidos</span><strong>{user.followedClubs.length}</strong></div>
          </div>

          {/* Followed clubs */}
          {user.followedClubs.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <span className="card-title"><Shield size={15} /> Mis clubes</span>
              </div>
              {user.followedClubs.map(cid => {
                const c = clubs.find(cl => cl.id === cid);
                if (!c) return null;
                return (
                  <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-2)' }}>
                    <ClubLogo clubId={c.id} initials={c.logo} size={38} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{c.city} · {c.followers.toLocaleString('es-AR')} seg.</div>
                    </div>
                    {user.clubId === c.id && <span className="tag tag-green">Principal</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Logout */}
          <div className="card" style={{ marginTop: 16 }}>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component to reduce repetition
function DisplayOrEdit({ label, editing, value, display, faded, children }: {
  label: string; editing: boolean; value?: string; display: string; faded?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {editing
        ? children
        : <div style={{ padding: '10px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', fontSize: 14, color: faded ? 'var(--text-3)' : 'var(--text)', border: '1px solid var(--border)' }}>{display}</div>
      }
    </div>
  );
}

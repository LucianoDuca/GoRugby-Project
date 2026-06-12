import React, { useState, useMemo } from 'react';
import { Search, MapPin, X, Calendar, Users, Trophy } from 'lucide-react';
import { clubs, matches, tournaments } from '../data/mockData';
import { useAuth } from '../app/main';
import { ClubLogo } from './ClubLogo';

export default function Clubs() {
  const { user, updateUser } = useAuth();
  const [query, setQuery]           = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => clubs.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.city.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  );

  const toggleFollow = (clubId: string) => {
    if (!user) return;
    const following = user.followedClubs.includes(clubId);
    updateUser({
      followedClubs: following
        ? user.followedClubs.filter(id => id !== clubId)
        : [...user.followedClubs, clubId],
    });
  };

  const selectedClub = clubs.find(c => c.id === selectedId);

  return (
    <>
      <div className="search-box">
        <Search size={14} color="var(--text-3)" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o ciudad..." />
        {query && (
          <button className="btn-icon" style={{ width: 22, height: 22, color: 'var(--text-3)' }} onClick={() => setQuery('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No se encontraron clubes para "{query}"</p>
        </div>
      ) : (
        <div className="clubs-grid">
          {filtered.map(c => {
            const isFollowing = user?.followedClubs.includes(c.id) ?? false;
            const isOwn       = user?.clubId === c.id;
            return (
              <div key={c.id} className="club-card">
                <div className="club-card-header">
                  <ClubLogo clubId={c.id} initials={c.logo} size={52} />
                  <div>
                    <div className="club-name">
                      {c.name}
                      {isOwn && <span className="tag tag-green" style={{ marginLeft: 6 }}>Mi club</span>}
                    </div>
                    <div className="club-location">
                      <MapPin size={11} /> {c.city} · {c.field}
                    </div>
                  </div>
                </div>

                <div className="club-stats-row">
                  <div className="club-stat">
                    <div className="club-stat-value">{c.followers.toLocaleString('es-AR')}</div>
                    <div className="club-stat-label">Seguidores</div>
                  </div>
                  <div className="club-stat">
                    <div className="club-stat-value">{c.affiliates.toLocaleString('es-AR')}</div>
                    <div className="club-stat-label">Afiliados</div>
                  </div>
                  <div className="club-stat">
                    <div className="club-stat-value">{c.founded}</div>
                    <div className="club-stat-label">Fundación</div>
                  </div>
                </div>

                <div className="club-card-footer">
                  <button
                    className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => toggleFollow(c.id)}
                  >
                    {isFollowing ? '✓ Siguiendo' : '+ Seguir'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedId(c.id)}>
                    Ver perfil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Club detail drawer */}
      {selectedClub && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedId(null)} />
          <div className="club-detail-drawer">
            <div className="drawer-header">
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{selectedClub.name}</span>
              <button className="btn-icon" onClick={() => setSelectedId(null)}><X size={18} /></button>
            </div>

            <div className="drawer-hero">
              <ClubLogo clubId={selectedClub.id} initials={selectedClub.logo} size={80} />
              <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedClub.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {selectedClub.city} · Fundado en {selectedClub.founded}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span className="tag tag-green">
                  {user?.followedClubs.includes(selectedClub.id) ? '✓ Siguiendo' : 'No seguido'}
                </span>
                {user?.clubId === selectedClub.id && <span className="tag tag-gold">Mi club</span>}
              </div>
            </div>

            <div className="drawer-body">
              <div className="drawer-stat-grid">
                <div className="drawer-stat">
                  <div className="drawer-stat-value">{selectedClub.followers.toLocaleString('es-AR')}</div>
                  <div className="drawer-stat-label">Seguidores</div>
                </div>
                <div className="drawer-stat">
                  <div className="drawer-stat-value">{selectedClub.affiliates.toLocaleString('es-AR')}</div>
                  <div className="drawer-stat-label">Afiliados</div>
                </div>
                <div className="drawer-stat">
                  <div className="drawer-stat-value">{new Date().getFullYear() - selectedClub.founded}</div>
                  <div className="drawer-stat-label">Años</div>
                </div>
              </div>

              {/* Club matches */}
              <div className="section-title"><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Partidos recientes</div>
              {(() => {
                const clubMatches = matches.filter(m => m.homeId === selectedClub.id || m.awayId === selectedClub.id);
                if (!clubMatches.length) return <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sin partidos registrados</p>;
                return clubMatches.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{m.home} vs {m.away}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{m.tournament} · {m.date}</div>
                    </div>
                    <span className={`status-badge ${m.status}`} style={{ fontSize: 9 }}>
                      {m.status === 'live' ? 'En vivo' : m.status === 'finished'
                        ? `${m.homeScore} – ${m.awayScore}`
                        : m.time}
                    </span>
                  </div>
                ));
              })()}

              {/* Info */}
              <div className="section-title" style={{ marginTop: 20 }}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Información</div>
              <div className="admin-stat-row"><span>Cancha</span><strong>{selectedClub.field}</strong></div>
              <div className="admin-stat-row"><span>Ciudad</span><strong>{selectedClub.city}</strong></div>
              <div className="admin-stat-row"><span>Fundación</span><strong>{selectedClub.founded}</strong></div>

              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                <button
                  className={`btn ${user?.followedClubs.includes(selectedClub.id) ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => toggleFollow(selectedClub.id)}
                >
                  {user?.followedClubs.includes(selectedClub.id) ? '✓ Siguiendo' : '+ Seguir club'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

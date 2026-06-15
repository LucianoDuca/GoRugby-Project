import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, X, Calendar, Users, Globe, Loader, ChevronDown } from 'lucide-react';
import { clubs, matches } from '../data/mockData';
import { useAuth } from '../app/main';
import { ClubLogo } from './ClubLogo';
import { rugbyApi, NormalisedTeam, NormalisedMatch, LEAGUES } from '../services/rugbyApi';

type Tab = 'local' | 'international';

const INTL_LEAGUES: { id: number; name: string; country: string }[] = [
  { id: LEAGUES.SIX_NATIONS,        name: 'Six Nations',           country: 'Europa' },
  { id: LEAGUES.RUGBY_CHAMPIONSHIP, name: 'Rugby Championship',    country: 'Mundo' },
  { id: LEAGUES.PREMIERSHIP,        name: 'Premiership Rugby',     country: 'Inglaterra' },
  { id: LEAGUES.TOP_14,             name: 'Top 14',                country: 'Francia' },
  { id: LEAGUES.URC,                name: 'United Rugby Championship', country: 'Mundo' },
  { id: LEAGUES.SUPER_RUGBY,        name: 'Super Rugby',           country: 'Mundo' },
  { id: LEAGUES.TOP_12_ARG,         name: 'Top 12',                country: 'Argentina' },
];
const DEFAULT_SEASON = 2024;

// ── International teams section ───────────────────────────────────────────────

function InternationalClubs() {
  const [selectedLeague, setSelectedLeague] = useState(INTL_LEAGUES[0]);
  const [teams,          setTeams]          = useState<NormalisedTeam[]>([]);
  const [teamMatches,    setTeamMatches]    = useState<NormalisedMatch[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [selectedTeam,   setSelectedTeam]   = useState<NormalisedTeam | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const [query,          setQuery]          = useState('');

  const fetchTeams = (league: typeof INTL_LEAGUES[0]) => {
    setLoading(true);
    setTeams([]);
    setSelectedTeam(null);
    rugbyApi.getTeams(league.id, DEFAULT_SEASON)
      .then(t => setTeams(t))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTeams(selectedLeague); }, []);

  const selectLeague = (league: typeof INTL_LEAGUES[0]) => {
    setSelectedLeague(league);
    setShowLeaguePicker(false);
    setQuery('');
    fetchTeams(league);
  };

  const openTeam = (team: NormalisedTeam) => {
    setSelectedTeam(team);
    setLoadingMatches(true);
    rugbyApi.getFixtures(selectedLeague.id, DEFAULT_SEASON).then(ms => {
      setTeamMatches(ms.filter(m => m.homeId === String(team.id) || m.awayId === String(team.id)));
    }).finally(() => setLoadingMatches(false));
  };

  const filtered = useMemo(
    () => teams.filter(t => !query || t.name.toLowerCase().includes(query.toLowerCase())),
    [teams, query]
  );

  // Team detail view
  if (selectedTeam) {
    return (
      <div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 16 }}
          onClick={() => setSelectedTeam(null)}
        >
          ← {selectedLeague.name}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          {selectedTeam.logo && (
            <img src={selectedTeam.logo} alt={selectedTeam.name}
              style={{ width: 60, height: 60, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedTeam.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
              <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
              {selectedTeam.country} · {selectedLeague.name} {DEFAULT_SEASON}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Calendar size={14} style={{ display: 'inline', marginRight: 5 }} />
              Temporada {DEFAULT_SEASON}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {teamMatches.length} partidos
            </span>
          </div>

          {loadingMatches ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', color: 'var(--text-3)' }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Cargando partidos…
            </div>
          ) : teamMatches.length === 0 ? (
            <p style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13 }}>Sin partidos registrados.</p>
          ) : (
            teamMatches.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    {m.homeLogo && <img src={m.homeLogo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    {m.home}
                    <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>vs</span>
                    {m.awayLogo && <img src={m.awayLogo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    {m.away}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                    {m.date} {m.round ? `· ${m.round}` : ''}
                  </div>
                </div>
                <span className={`status-badge ${m.status}`} style={{ fontSize: 10 }}>
                  {m.status === 'finished'
                    ? `${m.homeScore ?? '-'} – ${m.awayScore ?? '-'}`
                    : m.status === 'live' ? 'En vivo'
                    : m.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* League selector */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer', width: '100%',
            textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--text)',
          }}
          onClick={() => setShowLeaguePicker(!showLeaguePicker)}
        >
          <Globe size={15} color="var(--accent)" />
          {selectedLeague.name}
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400, flex: 1 }}>
            · {selectedLeague.country}
          </span>
          <ChevronDown size={14} color="var(--text-3)"
            style={{ transform: showLeaguePicker ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>

        {showLeaguePicker && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', marginTop: 4,
            overflow: 'hidden',
          }}>
            {INTL_LEAGUES.map(l => (
              <button key={l.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 14px', background: l.id === selectedLeague.id ? 'var(--accent-light, #dcfce7)' : 'none',
                  border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                  borderBottom: '1px solid var(--border)',
                }}
                onClick={() => selectLeague(l)}
              >
                <span style={{ fontWeight: 600 }}>{l.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="search-box" style={{ marginBottom: 16 }}>
        <Search size={14} color="var(--text-3)" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar equipo…" />
        {query && (
          <button className="btn-icon" style={{ width: 22, height: 22, color: 'var(--text-3)' }} onClick={() => setQuery('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Teams grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '40px 0', color: 'var(--text-3)' }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando equipos…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏉</div>
          <p>{teams.length === 0 ? 'Sin datos para esta liga.' : `Sin equipos para "${query}"`}</p>
        </div>
      ) : (
        <div className="clubs-grid">
          {filtered.map(t => (
            <div key={t.id} className="club-card">
              <div className="club-card-header">
                {t.logo ? (
                  <img src={t.logo} alt={t.name}
                    style={{ width: 52, height: 52, objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: 8, background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                  }}>
                    {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                )}
                <div>
                  <div className="club-name">{t.name}</div>
                  <div className="club-location">
                    <MapPin size={11} /> {t.country}
                  </div>
                </div>
              </div>

              <div className="club-stats-row">
                <div className="club-stat">
                  <div className="club-stat-value">{selectedLeague.name.split(' ')[0]}</div>
                  <div className="club-stat-label">Liga</div>
                </div>
                <div className="club-stat">
                  <div className="club-stat-value">{DEFAULT_SEASON}</div>
                  <div className="club-stat-label">Temporada</div>
                </div>
              </div>

              <div className="club-card-footer">
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openTeam(t)}>
                  Ver partidos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Local clubs section (unchanged) ──────────────────────────────────────────

function LocalClubs() {
  const { user, updateUser } = useAuth();
  const [query,      setQuery]      = useState('');
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

      {selectedClub && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedId(null)} />
          <div className="club-detail-drawer">
            <div className="drawer-header">
              <span style={{ fontWeight: 700, fontSize: 15 }}>{selectedClub.name}</span>
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

              <div className="section-title" style={{ marginTop: 16 }}>
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Partidos recientes
              </div>
              {(() => {
                const clubMatches = matches.filter(m => m.homeId === selectedClub.id || m.awayId === selectedClub.id);
                if (!clubMatches.length) return <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sin partidos registrados</p>;
                return clubMatches.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.home} vs {m.away}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{m.tournament} · {m.date}</div>
                    </div>
                    <span className={`status-badge ${m.status}`} style={{ fontSize: 9 }}>
                      {m.status === 'finished' ? `${m.homeScore} – ${m.awayScore}` : m.status === 'live' ? 'En vivo' : m.time}
                    </span>
                  </div>
                ));
              })()}

              <div className="section-title" style={{ marginTop: 20 }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Información
              </div>
              <div className="admin-stat-row"><span>Cancha</span><strong>{selectedClub.field}</strong></div>
              <div className="admin-stat-row"><span>Ciudad</span><strong>{selectedClub.city}</strong></div>
              <div className="admin-stat-row"><span>Fundación</span><strong>{selectedClub.founded}</strong></div>

              <div style={{ marginTop: 20 }}>
                <button
                  className={`btn ${user?.followedClubs.includes(selectedClub.id) ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                  style={{ width: '100%' }}
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

// ── Main component ─────────────────────────────────────────────────────────────

export default function Clubs() {
  const [tab, setTab] = useState<Tab>('local');

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={`filter-tab${tab === 'local' ? ' active' : ''}`} onClick={() => setTab('local')}>
          Clubes locales
        </button>
        <button className={`filter-tab${tab === 'international' ? ' active' : ''}`} onClick={() => setTab('international')}>
          <Globe size={12} style={{ display: 'inline', marginRight: 4 }} />
          Internacional
        </button>
      </div>

      {tab === 'local' ? <LocalClubs /> : <InternationalClubs />}
    </>
  );
}

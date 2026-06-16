import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, X, Calendar, Users, Globe, Loader, ChevronDown, BookOpen, Star } from 'lucide-react';
import { clubs, matches } from '../data/mockData';
import { useAuth } from '../app/main';
import { ClubLogo } from './ClubLogo';
import { NormalisedMatch } from '../services/rugbyApi';
import { espnApi, ESPN_LEAGUES } from '../services/espnApi';
import { theSportsDbApi, TSDBNormalisedTeam } from '../services/theSportsDbApi';
import MatchModal from './MatchModal';

type Tab = 'local' | 'international';

type IntlTeam = { id: string; name: string; logo: string; };

const INTL_LEAGUES: { id: number; name: string; country: string }[] = [
  { id: ESPN_LEAGUES.SIX_NATIONS,         name: 'Six Nations',               country: 'Europa'      },
  { id: ESPN_LEAGUES.RUGBY_CHAMPIONSHIP,  name: 'Rugby Championship',        country: 'Mundo'       },
  { id: ESPN_LEAGUES.PREMIERSHIP,         name: 'Premiership Rugby',         country: 'Inglaterra'  },
  { id: ESPN_LEAGUES.TOP_14,              name: 'Top 14',                    country: 'Francia'     },
  { id: ESPN_LEAGUES.URC,                 name: 'United Rugby Championship', country: 'Mundo'       },
  { id: ESPN_LEAGUES.SUPER_RUGBY_PACIFIC, name: 'Super Rugby Pacific',       country: 'Pacífico'    },
  { id: ESPN_LEAGUES.CHAMPIONS_CUP,       name: 'Champions Cup',             country: 'Europa'      },
  { id: ESPN_LEAGUES.URBA_PRIMERA_A,      name: 'URBA Primera A',            country: 'Argentina'   },
  { id: ESPN_LEAGUES.URBA_TOP_14_ARG,     name: 'URBA Top 14',              country: 'Argentina'   },
];

function extractTeams(ms: NormalisedMatch[]): IntlTeam[] {
  const seen = new Set<string>();
  const teams: IntlTeam[] = [];
  for (const m of ms) {
    if (m.homeId && !seen.has(m.homeId)) {
      seen.add(m.homeId);
      teams.push({ id: m.homeId, name: m.home, logo: m.homeLogo ?? '' });
    }
    if (m.awayId && !seen.has(m.awayId)) {
      seen.add(m.awayId);
      teams.push({ id: m.awayId, name: m.away, logo: m.awayLogo ?? '' });
    }
  }
  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

// ── International teams section ───────────────────────────────────────────────

function InternationalClubs() {
  const { user, updateUser }                    = useAuth();
  const [selectedLeague,   setSelectedLeague]   = useState(INTL_LEAGUES[0]);
  const [leagueMatches,    setLeagueMatches]    = useState<NormalisedMatch[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [selectedTeam,     setSelectedTeam]     = useState<IntlTeam | null>(null);
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const [query,            setQuery]            = useState('');
  const [tsdbInfo,         setTsdbInfo]         = useState<TSDBNormalisedTeam | null>(null);
  const [tsdbLoading,      setTsdbLoading]      = useState(false);
  const [modalMatch,       setModalMatch]       = useState<NormalisedMatch | null>(null);

  const fetchMatches = (league: typeof INTL_LEAGUES[0]) => {
    setLoading(true);
    setLeagueMatches([]);
    setSelectedTeam(null);
    setTsdbInfo(null);
    espnApi.getLeagueGames(league.id)
      .then(ms => setLeagueMatches(ms))
      .catch(() => setLeagueMatches([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMatches(selectedLeague); }, []);

  // Fetch TheSportsDB info when a team is selected
  useEffect(() => {
    if (!selectedTeam) { setTsdbInfo(null); return; }
    setTsdbLoading(true);
    theSportsDbApi.searchTeam(selectedTeam.name)
      .then(info => setTsdbInfo(info))
      .catch(() => setTsdbInfo(null))
      .finally(() => setTsdbLoading(false));
  }, [selectedTeam]);

  const followKey = (teamId: string) => `${teamId}|${selectedLeague.name}`;

  const isFollowing = (teamId: string) =>
    user?.followedIntlTeams?.includes(followKey(teamId)) ?? false;

  const toggleFollow = (teamId: string) => {
    if (!user) return;
    const key      = followKey(teamId);
    const current  = user.followedIntlTeams ?? [];
    const followed = current.includes(key);
    updateUser({ followedIntlTeams: followed ? current.filter(k => k !== key) : [...current, key] });
  };

  const selectLeague = (league: typeof INTL_LEAGUES[0]) => {
    setSelectedLeague(league);
    setShowLeaguePicker(false);
    setQuery('');
    fetchMatches(league);
  };

  const teams = useMemo(() => extractTeams(leagueMatches), [leagueMatches]);

  const filtered = useMemo(
    () => teams.filter(t => !query || t.name.toLowerCase().includes(query.toLowerCase())),
    [teams, query]
  );

  const teamMatches = useMemo(
    () => selectedTeam
      ? leagueMatches.filter(m => m.homeId === selectedTeam.id || m.awayId === selectedTeam.id)
      : [],
    [selectedTeam, leagueMatches]
  );

  // Team detail view
  if (selectedTeam) {
    const following = isFollowing(selectedTeam.id);

    return (
      <div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 16 }}
          onClick={() => { setSelectedTeam(null); setModalMatch(null); }}
        >
          ← {selectedLeague.name}
        </button>

        {/* Team hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {selectedTeam.logo || tsdbInfo?.logo ? (
            <img src={tsdbInfo?.logo ?? selectedTeam.logo} alt={selectedTeam.name}
              style={{ width: 64, height: 64, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : null}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedTeam.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
              <Globe size={11} style={{ display: 'inline', marginRight: 4 }} />
              {selectedLeague.name} · {selectedLeague.country}
              {tsdbInfo?.country && ` · ${tsdbInfo.country}`}
            </div>
          </div>
          <button
            className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => toggleFollow(selectedTeam.id)}
          >
            {following ? '✓ Siguiendo' : '+ Seguir'}
          </button>
        </div>

        {/* TheSportsDB info cards */}
        {tsdbLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
            Cargando información del equipo…
          </div>
        )}

        {tsdbInfo && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {tsdbInfo.stadium && (
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />Estadio
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tsdbInfo.stadium}</div>
              </div>
            )}
            {tsdbInfo.formed && (
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />Fundado
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tsdbInfo.formed}</div>
              </div>
            )}
            {tsdbInfo.country && (
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  <Globe size={10} style={{ display: 'inline', marginRight: 3 }} />País
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tsdbInfo.country}</div>
              </div>
            )}
          </div>
        )}

        {tsdbInfo?.description && (
          <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              <BookOpen size={10} style={{ display: 'inline', marginRight: 3 }} />Sobre el equipo
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              {tsdbInfo.description.length > 400
                ? `${tsdbInfo.description.slice(0, 400)}…`
                : tsdbInfo.description}
            </p>
          </div>
        )}

        {/* Matches */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Calendar size={14} style={{ display: 'inline', marginRight: 5 }} />
              Partidos en {selectedLeague.name}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {teamMatches.length} partidos
            </span>
          </div>

          {teamMatches.length === 0 ? (
            <p style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13 }}>Sin partidos registrados.</p>
          ) : (
            teamMatches.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13,
                  cursor: 'pointer', transition: 'background .15s',
                }}
                onClick={() => setModalMatch(m)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
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

        {modalMatch && (
          <MatchModal match={modalMatch} onClose={() => setModalMatch(null)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
                  width: '100%', padding: '10px 14px',
                  background: l.id === selectedLeague.id ? 'var(--accent-light, #dcfce7)' : 'none',
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
          <p>{teams.length === 0 ? 'Sin datos para esta liga en este momento.' : `Sin equipos para "${query}"`}</p>
        </div>
      ) : (
        <div className="clubs-grid">
          {filtered.map(t => {
            const played = leagueMatches.filter(m => m.homeId === t.id || m.awayId === t.id).length;
            const won    = leagueMatches.filter(m =>
              m.status === 'finished' && (
                (m.homeId === t.id && (m.homeScore ?? 0) > (m.awayScore ?? 0)) ||
                (m.awayId === t.id && (m.awayScore ?? 0) > (m.homeScore ?? 0))
              )
            ).length;
            return (
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
                      {t.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                    </div>
                  )}
                  <div>
                    <div className="club-name">{t.name}</div>
                    <div className="club-location">
                      <Globe size={11} /> {selectedLeague.name}
                    </div>
                  </div>
                </div>

                <div className="club-stats-row">
                  <div className="club-stat">
                    <div className="club-stat-value">{played}</div>
                    <div className="club-stat-label">Partidos</div>
                  </div>
                  <div className="club-stat">
                    <div className="club-stat-value">{won}</div>
                    <div className="club-stat-label">Victorias</div>
                  </div>
                </div>

                <div className="club-card-footer">
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setSelectedTeam(t)}>
                    Ver partidos
                  </button>
                </div>
              </div>
            );
          })}
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

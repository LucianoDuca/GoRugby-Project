import { useState, Fragment, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Trophy, Globe, MapPin, Users, ArrowLeft, Loader } from 'lucide-react';
import { tournamentTree, TournamentNode, matches } from '../data/mockData';
import { rugbyApi, NormalisedLeague, NormalisedStanding } from '../services/rugbyApi';

type Tab = 'local' | 'international';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:   { label: 'Activo',     cls: 'tag-green' },
  upcoming: { label: 'Próximo',    cls: 'tag-blue'  },
  finished: { label: 'Finalizado', cls: 'tag-gray'  },
};

function countCompetitions(node: TournamentNode): number {
  if (node.type === 'competition') return 1;
  return (node.children ?? []).reduce((s, c) => s + countCompetitions(c), 0);
}

function countActive(node: TournamentNode): number {
  if (node.type === 'competition') return node.status === 'active' ? 1 : 0;
  return (node.children ?? []).reduce((s, c) => s + countActive(c), 0);
}

// ── Standings table ────────────────────────────────────────────────────────────

function StandingsTable({ standings }: { standings: NormalisedStanding[] }) {
  return (
    <table className="data-table" style={{ marginTop: 0 }}>
      <thead>
        <tr>
          <th>#</th>
          <th>Equipo</th>
          <th>PJ</th>
          <th>G</th>
          <th>E</th>
          <th>P</th>
          <th>Pts</th>
          <th style={{ textAlign: 'right' }}>Dif</th>
        </tr>
      </thead>
      <tbody>
        {standings.map(s => (
          <tr key={s.teamId}>
            <td>
              <strong style={{ color: s.position <= 3 ? 'var(--gold)' : 'var(--text-2)' }}>
                {s.position}
              </strong>
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {s.teamLogo && (
                  <img
                    src={s.teamLogo} alt={s.teamName}
                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <span style={{ fontWeight: 600 }}>{s.teamName}</span>
              </div>
            </td>
            <td>{s.played}</td>
            <td>{s.won}</td>
            <td>{s.drawn}</td>
            <td>{s.lost}</td>
            <td><strong style={{ color: 'var(--accent)' }}>{s.points}</strong></td>
            <td style={{ textAlign: 'right', color: s.diff >= 0 ? 'var(--accent)' : 'var(--live)', fontWeight: 600 }}>
              {s.diff >= 0 ? '+' : ''}{s.diff}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── International leagues view ─────────────────────────────────────────────────

function InternationalView() {
  const [leagues,   setLeagues]   = useState<NormalisedLeague[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<NormalisedLeague | null>(null);
  const [standings, setStandings] = useState<NormalisedStanding[]>([]);
  const [loadSt,    setLoadSt]    = useState(false);

  useEffect(() => {
    rugbyApi.getLeagues()
      .then(data => setLeagues(data))
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, []);

  const openLeague = (league: NormalisedLeague) => {
    setSelected(league);
    setStandings([]);
    setLoadSt(true);
    rugbyApi.getStandings(league.id, Number(league.currentSeason) || 2025)
      .then(data => setStandings(data))
      .catch(() => setStandings([]))
      .finally(() => setLoadSt(false));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '40px 20px', color: 'var(--text-3)' }}>
        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
        Cargando ligas…
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏆</div>
        <p>No se pudieron cargar las ligas. Verificá tu RUGBY_API_KEY.</p>
      </div>
    );
  }

  // Detail view for a selected league
  if (selected) {
    return (
      <div>
        <button
          className="tourney-back-btn"
          style={{ marginBottom: 16 }}
          onClick={() => { setSelected(null); setStandings([]); }}
        >
          <ArrowLeft size={14} /> Todas las ligas
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {selected.logo && (
            <img src={selected.logo} alt={selected.name} style={{ width: 44, height: 44, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {selected.country} · {selected.type} · Temporada {selected.currentSeason}
            </div>
          </div>
        </div>

        {loadSt ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', padding: '20px 0' }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Cargando tabla de posiciones…
          </div>
        ) : standings.length > 0 ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
              Tabla de posiciones
            </div>
            <div style={{ padding: '0 4px 4px' }}>
              <StandingsTable standings={standings} />
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sin tabla de posiciones disponible para esta liga.</p>
        )}
      </div>
    );
  }

  // Group by type
  const grouped: Record<string, NormalisedLeague[]> = {};
  for (const l of leagues) {
    const key = l.type || 'Other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(l);
  }

  return (
    <div>
      {Object.entries(grouped).map(([type, list]) => (
        <div key={type} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-3)', marginBottom: 10 }}>
            {type}
          </div>
          <div className="tournaments-list">
            {list.map(l => (
              <button key={l.id} className="tournament-card" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => openLeague(l)}>
                <div className="tournament-icon" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {l.logo
                    ? <img src={l.logo} alt={l.name} style={{ width: 28, height: 28, objectFit: 'contain' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <Trophy size={18} color="var(--accent)" />
                  }
                </div>
                <div className="tournament-info">
                  <div className="tournament-name">{l.name}</div>
                  <div className="tournament-meta">{l.country} · Temporada {l.currentSeason}</div>
                </div>
                <div className="tournament-card-right">
                  <ChevronRight size={15} color="var(--text-3)" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Local tree view (unchanged) ────────────────────────────────────────────────

function LocalTree() {
  const [path, setPath] = useState<TournamentNode[]>([]);

  const currentItems: TournamentNode[] =
    path.length === 0 ? tournamentTree : (path[path.length - 1].children ?? []);

  const navigate = (node: TournamentNode) => { if (node.type !== 'competition') setPath([...path, node]); };
  const goBack   = () => setPath(path.slice(0, -1));
  const goTo     = (idx: number) => setPath(path.slice(0, idx + 1));

  const current = path[path.length - 1];
  const depth   = path.length;

  return (
    <>
      {/* Breadcrumb */}
      <div className="tourney-breadcrumb">
        <button className={`tourney-crumb${depth === 0 ? ' active' : ''}`} onClick={() => setPath([])}>
          <Globe size={12} /> Mundial
        </button>
        {path.map((node, idx) => (
          <Fragment key={node.id}>
            <ChevronRight size={12} className="tourney-crumb-sep" />
            <button
              className={`tourney-crumb${idx === depth - 1 ? ' active' : ''}`}
              onClick={() => goTo(idx)}
            >
              {(node.flag || node.icon) && <span>{node.flag ?? node.icon}</span>}
              {node.name}
            </button>
          </Fragment>
        ))}
      </div>

      {/* Back + level header */}
      {depth > 0 && (
        <div className="tourney-level-bar">
          <button className="tourney-back-btn" onClick={goBack}>
            <ChevronLeft size={15} />
            {depth > 1 ? path[depth - 2].name : 'Mundial'}
          </button>
          <div className="tourney-level-info">
            {(current.flag || current.icon) && (
              <span className="tourney-level-flag">{current.flag ?? current.icon}</span>
            )}
            <div>
              <div className="tourney-level-title">{current.name}</div>
              <div className="tourney-level-sub">
                {countCompetitions(current)} competicion{countCompetitions(current) !== 1 ? 'es' : ''}
                {countActive(current) > 0 && (
                  <span className="tourney-active-pill">{countActive(current)} activas</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {depth === 0 && (
        <div className="tourney-continent-grid">
          {currentItems.map(node => (
            <button key={node.id} className="tourney-continent-card" onClick={() => navigate(node)}>
              <span className="tourney-continent-icon">{node.icon}</span>
              <div className="tourney-continent-body">
                <span className="tourney-continent-name">{node.name}</span>
                <span className="tourney-continent-meta">
                  {(node.children ?? []).length} países · {countCompetitions(node)} competiciones
                </span>
              </div>
              <ChevronRight size={18} className="tourney-arrow" />
            </button>
          ))}
        </div>
      )}

      {depth === 1 && (
        <div className="tourney-country-grid">
          {currentItems.map(node => (
            <button key={node.id} className="tourney-country-card" onClick={() => navigate(node)}>
              <span className="tourney-country-flag">{node.flag ?? node.icon}</span>
              <div className="tourney-country-info">
                <span className="tourney-country-name">{node.name}</span>
                <span className="tourney-country-meta">
                  {(node.children ?? []).length} uniones · {countCompetitions(node)} competiciones
                </span>
              </div>
              {countActive(node) > 0 && (
                <span className="tag tag-green" style={{ flexShrink: 0 }}>{countActive(node)} activas</span>
              )}
              <ChevronRight size={15} className="tourney-arrow" />
            </button>
          ))}
        </div>
      )}

      {depth === 2 && (
        <div className="tourney-region-grid">
          {currentItems.map(node => {
            const comps     = node.children ?? [];
            const activeN   = comps.filter(c => c.status === 'active').length;
            const upcomingN = comps.filter(c => c.status === 'upcoming').length;
            return (
              <button key={node.id} className="tourney-region-card" onClick={() => navigate(node)}>
                <div className="tourney-region-icon"><MapPin size={17} /></div>
                <div className="tourney-region-info">
                  <span className="tourney-region-name">{node.name}</span>
                  <span className="tourney-region-meta">{comps.length} competicion{comps.length !== 1 ? 'es' : ''}</span>
                </div>
                <div className="tourney-region-tags">
                  {activeN > 0   && <span className="tag tag-green">{activeN} activas</span>}
                  {upcomingN > 0 && <span className="tag tag-blue">{upcomingN} próximas</span>}
                </div>
                <ChevronRight size={15} className="tourney-arrow" />
              </button>
            );
          })}
        </div>
      )}

      {depth === 3 && (
        <div className="tournaments-list">
          {currentItems.map(node => {
            const cfg        = STATUS_CONFIG[node.status ?? 'upcoming'];
            const matchCount = matches.filter(m => m.tournament === node.name).length;
            return (
              <div key={node.id} className="tournament-card">
                <div className="tournament-icon"><Trophy size={20} color="white" /></div>
                <div className="tournament-info">
                  <div className="tournament-name">{node.name}</div>
                  <div className="tournament-meta">{node.category} · Desde {node.startDate}</div>
                </div>
                <div className="tournament-card-right">
                  <span className={`tag ${cfg.cls}`}>{cfg.label}</span>
                  <span className="tournament-teams">
                    <Users size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {node.teams} equipos
                  </span>
                  {matchCount > 0 && (
                    <span className="tournament-matches-count">
                      {matchCount} partido{matchCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Tournaments() {
  const [tab, setTab] = useState<Tab>('local');

  return (
    <div className="tournaments-page">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Tab bar */}
      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={`filter-tab${tab === 'local' ? ' active' : ''}`} onClick={() => setTab('local')}>
          <Globe size={12} style={{ display: 'inline', marginRight: 4 }} />
          Estructura local
        </button>
        <button className={`filter-tab${tab === 'international' ? ' active' : ''}`} onClick={() => setTab('international')}>
          <Trophy size={12} style={{ display: 'inline', marginRight: 4 }} />
          Ligas internacionales
        </button>
      </div>

      {tab === 'local'         ? <LocalTree />         : <InternationalView />}
    </div>
  );
}

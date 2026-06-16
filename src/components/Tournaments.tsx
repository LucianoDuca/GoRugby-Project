import { useState, Fragment, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Trophy, Globe, MapPin, Users, ArrowLeft, Loader, BarChart2 } from 'lucide-react';
import { tournamentTree, TournamentNode, matches } from '../data/mockData';
import { NormalisedMatch } from '../services/rugbyApi';
import { espnApi, ESPN_LEAGUES } from '../services/espnApi';
import { highlightlyApi, HLNormalisedStanding } from '../services/highlightlyApi';
import { mappingByEspnId } from '../data/idMapping';
import MatchModal from './MatchModal';

type Tab = 'local' | 'international';
type LeagueTab = 'partidos' | 'posiciones';

type IntlTournament = { id: number; name: string; country: string; type: string; };

const INTL_TOURNAMENTS: IntlTournament[] = [
  { id: ESPN_LEAGUES.SIX_NATIONS,         name: 'Six Nations',               country: 'Europa',     type: 'Selecciones' },
  { id: ESPN_LEAGUES.RUGBY_CHAMPIONSHIP,  name: 'Rugby Championship',        country: 'Mundo',      type: 'Selecciones' },
  { id: ESPN_LEAGUES.INTERNATIONAL_TESTS, name: 'International Tests',       country: 'Mundial',    type: 'Selecciones' },
  { id: ESPN_LEAGUES.WORLD_CUP,           name: 'Rugby World Cup',           country: 'Mundial',    type: 'Selecciones' },
  { id: ESPN_LEAGUES.PREMIERSHIP,         name: 'Premiership Rugby',         country: 'Inglaterra', type: 'Clubes' },
  { id: ESPN_LEAGUES.TOP_14,              name: 'Top 14',                    country: 'Francia',    type: 'Clubes' },
  { id: ESPN_LEAGUES.URC,                 name: 'United Rugby Championship', country: 'Mundo',      type: 'Clubes' },
  { id: ESPN_LEAGUES.SUPER_RUGBY_PACIFIC, name: 'Super Rugby Pacific',       country: 'Pacífico',   type: 'Clubes' },
  { id: ESPN_LEAGUES.CHAMPIONS_CUP,       name: 'Champions Cup',             country: 'Europa',     type: 'Clubes' },
  { id: ESPN_LEAGUES.MAJOR_LEAGUE_RUGBY,  name: 'Major League Rugby',        country: 'EE.UU.',     type: 'Clubes' },
  { id: ESPN_LEAGUES.CURRIE_CUP,          name: 'Currie Cup',                country: 'Sudáfrica',  type: 'Clubes' },
  { id: ESPN_LEAGUES.URBA_PRIMERA_A,      name: 'URBA Primera A',            country: 'Argentina',  type: 'Clubes' },
  { id: ESPN_LEAGUES.URBA_TOP_14_ARG,     name: 'URBA Top 14',              country: 'Argentina',  type: 'Clubes' },
];

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

// ── Match row (clickable) ─────────────────────────────────────────────────────

function MatchRow({ m, onClick }: { m: NormalisedMatch; onClick?: (m: NormalisedMatch) => void }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background .15s',
      }}
      onClick={() => onClick?.(m)}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => { if (onClick && e.key === 'Enter') onClick(m); }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          {m.homeLogo && (
            <img src={m.homeLogo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          {m.home}
          <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>vs</span>
          {m.awayLogo && (
            <img src={m.awayLogo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          {m.away}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
          {m.date} {m.round ? `· ${m.round}` : ''}
        </div>
      </div>
      <span className={`status-badge ${m.status}`} style={{ fontSize: 10 }}>
        {m.status === 'finished'
          ? `${m.homeScore ?? '-'} – ${m.awayScore ?? '-'}`
          : m.status === 'live' ? (m.minute ?? 'En vivo')
          : m.time}
      </span>
    </div>
  );
}

function MatchSection({ title, ms, titleColor, onOpen }: {
  title: string;
  ms: NormalisedMatch[];
  titleColor?: string;
  onOpen?: (m: NormalisedMatch) => void;
}) {
  return (
    <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: titleColor }}>
        {title}
      </div>
      {ms.map(m => <MatchRow key={m.id} m={m} onClick={onOpen} />)}
    </div>
  );
}

// ── Standings table ───────────────────────────────────────────────────────────

function StandingsTable({ standings, loading }: { standings: HLNormalisedStanding[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', padding: '24px 0' }}>
        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Cargando posiciones…
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="card" style={{ padding: 20, textAlign: 'center' }}>
        <BarChart2 size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          Posiciones no disponibles para esta liga.<br />
          <span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
            Se activarán automáticamente una vez que se configure el ID de Highlightly.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 40px 40px 40px 40px 44px',
        gap: 0,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-3)',
      }}>
        <span>#</span>
        <span>Equipo</span>
        <span style={{ textAlign: 'center' }}>PJ</span>
        <span style={{ textAlign: 'center' }}>G</span>
        <span style={{ textAlign: 'center' }}>E</span>
        <span style={{ textAlign: 'center' }}>P</span>
        <span style={{ textAlign: 'right' }}>Pts</span>
      </div>
      {standings.map((s, i) => (
        <div key={s.teamId} style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 40px 40px 40px 40px 44px',
          alignItems: 'center',
          padding: '9px 12px',
          borderBottom: i < standings.length - 1 ? '1px solid var(--border)' : 'none',
          fontSize: 13,
          background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)',
        }}>
          <span style={{ fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text-3)', fontSize: 12 }}>
            {s.position}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {s.teamLogo && (
              <img src={s.teamLogo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <span style={{ fontWeight: 600 }}>{s.teamName}</span>
          </div>
          <span style={{ textAlign: 'center', color: 'var(--text-2)' }}>{s.played}</span>
          <span style={{ textAlign: 'center', color: 'var(--text-2)' }}>{s.won}</span>
          <span style={{ textAlign: 'center', color: 'var(--text-2)' }}>{s.drawn}</span>
          <span style={{ textAlign: 'center', color: 'var(--text-2)' }}>{s.lost}</span>
          <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{s.points}</span>
        </div>
      ))}
    </div>
  );
}

// ── International leagues view ─────────────────────────────────────────────────

function InternationalView() {
  const [selected,      setSelected]      = useState<IntlTournament | null>(null);
  const [leagueMatches, setLeagueMatches] = useState<NormalisedMatch[]>([]);
  const [logo,          setLogo]          = useState('');
  const [loading,       setLoading]       = useState(false);
  const [leagueTab,     setLeagueTab]     = useState<LeagueTab>('partidos');
  const [standings,     setStandings]     = useState<HLNormalisedStanding[]>([]);
  const [loadingStand,  setLoadingStand]  = useState(false);
  const [modalMatch,    setModalMatch]    = useState<NormalisedMatch | null>(null);

  const openLeague = (t: IntlTournament) => {
    setSelected(t);
    setLeagueMatches([]);
    setLogo('');
    setLoading(true);
    setLeagueTab('partidos');
    setStandings([]);
    espnApi.getLeagueGames(t.id)
      .then(ms => {
        setLeagueMatches(ms);
        const first = ms.find(m => m.tournamentLogo);
        if (first?.tournamentLogo) setLogo(first.tournamentLogo);
      })
      .catch(() => setLeagueMatches([]))
      .finally(() => setLoading(false));
  };

  const loadStandings = (t: IntlTournament) => {
    const mapping = mappingByEspnId(t.id);
    if (!mapping?.highlightlyId) { setStandings([]); return; }
    setLoadingStand(true);
    highlightlyApi.getStandings(mapping.highlightlyId, mapping.season)
      .then(s => setStandings(s))
      .catch(() => setStandings([]))
      .finally(() => setLoadingStand(false));
  };

  const handleLeagueTab = (tab: LeagueTab) => {
    setLeagueTab(tab);
    if (tab === 'posiciones' && selected && standings.length === 0 && !loadingStand) {
      loadStandings(selected);
    }
  };

  // Detail view for selected league
  if (selected) {
    const live     = leagueMatches.filter(m => m.status === 'live');
    const upcoming = leagueMatches.filter(m => m.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date));
    const finished = leagueMatches.filter(m => m.status === 'finished').sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div>
        <button
          className="tourney-back-btn"
          style={{ marginBottom: 16 }}
          onClick={() => { setSelected(null); setLeagueMatches([]); setModalMatch(null); }}
        >
          <ArrowLeft size={14} /> Todas las ligas
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {logo && (
            <img src={logo} alt={selected.name} style={{ width: 44, height: 44, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {selected.country} · {selected.type}
            </div>
          </div>
        </div>

        {/* League sub-tabs */}
        <div className="filter-tabs" style={{ marginBottom: 16 }}>
          <button
            className={`filter-tab${leagueTab === 'partidos' ? ' active' : ''}`}
            onClick={() => handleLeagueTab('partidos')}
          >
            Partidos
          </button>
          <button
            className={`filter-tab${leagueTab === 'posiciones' ? ' active' : ''}`}
            onClick={() => handleLeagueTab('posiciones')}
          >
            <BarChart2 size={11} style={{ display: 'inline', marginRight: 4 }} />
            Posiciones
          </button>
        </div>

        {leagueTab === 'posiciones' ? (
          <StandingsTable standings={standings} loading={loadingStand} />
        ) : loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', padding: '20px 0' }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Cargando partidos…
          </div>
        ) : leagueMatches.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sin partidos disponibles para esta liga en este momento.</p>
        ) : (
          <>
            {live.length > 0 && (
              <MatchSection title="En vivo" ms={live} titleColor="var(--live)" onOpen={setModalMatch} />
            )}
            {upcoming.length > 0 && (
              <MatchSection title="Próximos partidos" ms={upcoming.slice(0, 12)} onOpen={setModalMatch} />
            )}
            {finished.length > 0 && (
              <MatchSection title="Últimos resultados" ms={finished.slice(0, 12)} onOpen={setModalMatch} />
            )}
          </>
        )}

        {modalMatch && (
          <MatchModal match={modalMatch} onClose={() => setModalMatch(null)} />
        )}
      </div>
    );
  }

  // Group leagues by type
  const grouped: Record<string, IntlTournament[]> = {};
  for (const t of INTL_TOURNAMENTS) {
    if (!grouped[t.type]) grouped[t.type] = [];
    grouped[t.type].push(t);
  }

  return (
    <div>
      {Object.entries(grouped).map(([type, list]) => (
        <div key={type} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-3)', marginBottom: 10 }}>
            {type}
          </div>
          <div className="tournaments-list">
            {list.map(t => (
              <button key={t.id} className="tournament-card" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => openLeague(t)}>
                <div className="tournament-icon" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={18} color="var(--accent)" />
                </div>
                <div className="tournament-info">
                  <div className="tournament-name">{t.name}</div>
                  <div className="tournament-meta">{t.country}</div>
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

      {tab === 'local' ? <LocalTree /> : <InternationalView />}
    </div>
  );
}

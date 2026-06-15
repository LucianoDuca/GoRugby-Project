import { useState, Fragment, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Trophy, Globe, MapPin, Users, ArrowLeft, Loader } from 'lucide-react';
import { tournamentTree, TournamentNode, matches } from '../data/mockData';
import { NormalisedMatch } from '../services/rugbyApi';
import { espnApi, ESPN_LEAGUES } from '../services/espnApi';

type Tab = 'local' | 'international';

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

// ── Match row used in league detail ───────────────────────────────────────────

function MatchRow({ m }: { m: NormalisedMatch }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13,
    }}>
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

function MatchSection({ title, ms, titleColor }: { title: string; ms: NormalisedMatch[]; titleColor?: string }) {
  return (
    <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: titleColor }}>
        {title}
      </div>
      {ms.map(m => <MatchRow key={m.id} m={m} />)}
    </div>
  );
}

// ── International leagues view ─────────────────────────────────────────────────

function InternationalView() {
  const [selected,      setSelected]      = useState<IntlTournament | null>(null);
  const [leagueMatches, setLeagueMatches] = useState<NormalisedMatch[]>([]);
  const [logo,          setLogo]          = useState('');
  const [loading,       setLoading]       = useState(false);

  const openLeague = (t: IntlTournament) => {
    setSelected(t);
    setLeagueMatches([]);
    setLogo('');
    setLoading(true);
    espnApi.getLeagueGames(t.id)
      .then(ms => {
        setLeagueMatches(ms);
        const first = ms.find(m => m.tournamentLogo);
        if (first?.tournamentLogo) setLogo(first.tournamentLogo);
      })
      .catch(() => setLeagueMatches([]))
      .finally(() => setLoading(false));
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
          onClick={() => { setSelected(null); setLeagueMatches([]); }}
        >
          <ArrowLeft size={14} /> Todas las ligas
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', padding: '20px 0' }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Cargando partidos…
          </div>
        ) : leagueMatches.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sin partidos disponibles para esta liga en este momento.</p>
        ) : (
          <>
            {live.length > 0 && (
              <MatchSection title="En vivo" ms={live} titleColor="var(--live)" />
            )}
            {upcoming.length > 0 && (
              <MatchSection title="Próximos partidos" ms={upcoming.slice(0, 12)} />
            )}
            {finished.length > 0 && (
              <MatchSection title="Últimos resultados" ms={finished.slice(0, 12)} />
            )}
          </>
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

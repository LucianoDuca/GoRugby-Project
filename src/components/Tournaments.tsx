import { useState, Fragment } from 'react';
import { ChevronRight, ChevronLeft, Trophy, Globe, MapPin, Users } from 'lucide-react';
import { tournamentTree, TournamentNode, matches } from '../data/mockData';

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

export default function Tournaments() {
  const [path, setPath] = useState<TournamentNode[]>([]);

  const currentItems: TournamentNode[] =
    path.length === 0 ? tournamentTree : (path[path.length - 1].children ?? []);

  const navigate = (node: TournamentNode) => {
    if (node.type === 'competition') return;
    setPath([...path, node]);
  };

  const goBack = () => setPath(path.slice(0, -1));
  const goTo   = (idx: number) => setPath(path.slice(0, idx + 1));

  const current = path[path.length - 1];
  const depth   = path.length;

  return (
    <div className="tournaments-page">

      {/* ── Breadcrumb ── */}
      <div className="tourney-breadcrumb">
        <button
          className={`tourney-crumb${depth === 0 ? ' active' : ''}`}
          onClick={() => setPath([])}
        >
          <Globe size={12} />
          Mundial
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

      {/* ── Back + Level header ── */}
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

      {/* ── Level 0: Continents ── */}
      {depth === 0 && (
        <div className="tourney-continent-grid">
          {currentItems.map(node => (
            <button key={node.id} className="tourney-continent-card" onClick={() => navigate(node)}>
              <span className="tourney-continent-icon">{node.icon}</span>
              <div className="tourney-continent-body">
                <span className="tourney-continent-name">{node.name}</span>
                <span className="tourney-continent-meta">
                  {(node.children ?? []).length} países ·{' '}
                  {countCompetitions(node)} competiciones
                </span>
              </div>
              <ChevronRight size={18} className="tourney-arrow" />
            </button>
          ))}
        </div>
      )}

      {/* ── Level 1: Countries ── */}
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
                <span className="tag tag-green" style={{ flexShrink: 0 }}>
                  {countActive(node)} activas
                </span>
              )}
              <ChevronRight size={15} className="tourney-arrow" />
            </button>
          ))}
        </div>
      )}

      {/* ── Level 2: Regions / Federations ── */}
      {depth === 2 && (
        <div className="tourney-region-grid">
          {currentItems.map(node => {
            const comps    = node.children ?? [];
            const activeN  = comps.filter(c => c.status === 'active').length;
            const upcomingN = comps.filter(c => c.status === 'upcoming').length;
            return (
              <button key={node.id} className="tourney-region-card" onClick={() => navigate(node)}>
                <div className="tourney-region-icon">
                  <MapPin size={17} />
                </div>
                <div className="tourney-region-info">
                  <span className="tourney-region-name">{node.name}</span>
                  <span className="tourney-region-meta">{comps.length} competicion{comps.length !== 1 ? 'es' : ''}</span>
                </div>
                <div className="tourney-region-tags">
                  {activeN > 0 && <span className="tag tag-green">{activeN} activas</span>}
                  {upcomingN > 0 && <span className="tag tag-blue">{upcomingN} próximas</span>}
                </div>
                <ChevronRight size={15} className="tourney-arrow" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Level 3: Competitions (leaf) ── */}
      {depth === 3 && (
        <div className="tournaments-list">
          {currentItems.map(node => {
            const cfg = STATUS_CONFIG[node.status ?? 'upcoming'];
            const matchCount = matches.filter(m => m.tournament === node.name).length;
            return (
              <div key={node.id} className="tournament-card">
                <div className="tournament-icon">
                  <Trophy size={20} color="white" />
                </div>
                <div className="tournament-info">
                  <div className="tournament-name">{node.name}</div>
                  <div className="tournament-meta">
                    {node.category} · Desde {node.startDate}
                  </div>
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

    </div>
  );
}

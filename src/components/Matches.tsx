import { useState, useMemo } from 'react';
import { matches } from '../data/mockData';
import { MatchCard } from './Home';
import { Filter, X, ChevronDown } from 'lucide-react';

type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all',      label: 'Todos' },
  { id: 'live',     label: '🔴 En vivo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'finished', label: 'Finalizados' },
];

function uniqueMonths(list: typeof matches): string[] {
  return Array.from(new Set(list.map(m => m.date.slice(0, 7)))).sort().reverse();
}

function uniqueTournaments(list: typeof matches): string[] {
  return Array.from(new Set(list.map(m => m.tournament)));
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${names[parseInt(m) - 1]} ${y}`;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDate(list: typeof matches): Record<string, typeof matches> {
  const groups: Record<string, typeof matches> = {};
  for (const m of list) {
    if (!groups[m.date]) groups[m.date] = [];
    groups[m.date].push(m);
  }
  return groups;
}

export default function Matches() {
  const [status,     setStatus]     = useState<StatusFilter>('all');
  const [tournament, setTournament] = useState('all');
  const [month,      setMonth]      = useState('all');
  const [showPanel,  setShowPanel]  = useState(false);

  const allMonths      = useMemo(() => uniqueMonths(matches),      []);
  const allTournaments = useMemo(() => uniqueTournaments(matches), []);

  const filtered = useMemo(() => {
    return matches
      .filter(m => {
        if (status !== 'all'     && m.status      !== status)    return false;
        if (tournament !== 'all' && m.tournament  !== tournament) return false;
        if (month !== 'all'      && !m.date.startsWith(month))   return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'live'     && b.status !== 'live')     return -1;
        if (b.status === 'live'     && a.status !== 'live')     return 1;
        if (a.status === 'upcoming' && b.status === 'upcoming') return a.date.localeCompare(b.date);
        if (a.status === 'finished' && b.status === 'finished') return b.date.localeCompare(a.date);
        return 0;
      });
  }, [status, tournament, month]);

  const grouped     = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const aLive = grouped[a].some(m => m.status === 'live');
      const bLive = grouped[b].some(m => m.status === 'live');
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      const aUp = grouped[a].some(m => m.status === 'upcoming');
      const bUp = grouped[b].some(m => m.status === 'upcoming');
      if (aUp && bUp) return a.localeCompare(b);
      return b.localeCompare(a);
    });
  }, [grouped]);

  const activeCount = [status !== 'all', tournament !== 'all', month !== 'all'].filter(Boolean).length;

  const clearFilters = () => { setStatus('all'); setTournament('all'); setMonth('all'); };

  return (
    <div className="matches-page">

      {/* ── Filter bar ── */}
      <div className="matches-filter-bar">
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              className={`filter-tab${status === t.id ? ' active' : ''}`}
              onClick={() => setStatus(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="matches-filter-actions">
          <button
            className={`matches-filter-toggle${activeCount > 0 ? ' has-filters' : ''}`}
            onClick={() => setShowPanel(!showPanel)}
          >
            <Filter size={13} />
            Filtros
            {activeCount > 0 && <span className="filter-count-badge">{activeCount}</span>}
            <ChevronDown size={13} style={{ transform: showPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {activeCount > 0 && (
            <button className="matches-clear-btn" onClick={clearFilters}>
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Expandable filter panel ── */}
      {showPanel && (
        <div className="matches-filter-panel">
          <div className="filter-panel-group">
            <span className="filter-panel-label">Competición</span>
            <div className="filter-panel-chips">
              <button className={`filter-chip${tournament === 'all' ? ' active' : ''}`} onClick={() => setTournament('all')}>
                Todas
              </button>
              {allTournaments.map(t => (
                <button
                  key={t}
                  className={`filter-chip${tournament === t ? ' active' : ''}`}
                  onClick={() => setTournament(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-panel-group">
            <span className="filter-panel-label">Mes</span>
            <div className="filter-panel-chips">
              <button className={`filter-chip${month === 'all' ? ' active' : ''}`} onClick={() => setMonth('all')}>
                Todos
              </button>
              {allMonths.map(m => (
                <button
                  key={m}
                  className={`filter-chip${month === m ? ' active' : ''}`}
                  onClick={() => setMonth(m)}
                >
                  {formatMonth(m)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏉</div>
          <p>No hay partidos con estos filtros</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="matches-grouped">
          {sortedDates.map(date => (
            <div key={date} className="matches-date-group">
              <div className="matches-date-header">
                <span className="matches-date-label">{formatDateHeader(date)}</span>
                <span className="matches-date-count">
                  {grouped[date].length} partido{grouped[date].length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="match-list">
                {grouped[date].map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

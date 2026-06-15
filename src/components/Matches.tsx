import { useState, useMemo, useEffect, useCallback } from 'react';
import { Filter, X, ChevronDown, RefreshCw, Wifi, WifiOff, List, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { rugbyApi, NormalisedMatch, LEAGUES } from '../services/rugbyApi';
import MatchModal from './MatchModal';

type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all',      label: 'Todos' },
  { id: 'live',     label: 'En vivo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'finished', label: 'Finalizados' },
];

const DEFAULT_LEAGUES = [
  LEAGUES.SIX_NATIONS,
  LEAGUES.RUGBY_CHAMPIONSHIP,
  LEAGUES.PREMIERSHIP,
  LEAGUES.TOP_14,
  LEAGUES.URC,
  LEAGUES.SUPER_RUGBY,
  LEAGUES.TOP_12_ARG,
];
const DEFAULT_SEASON = 2024;

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function uniqueMonths(list: NormalisedMatch[]): string[] {
  return Array.from(new Set(list.map(m => m.date.slice(0, 7)))).sort().reverse();
}

function uniqueTournaments(list: NormalisedMatch[]): string[] {
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

function groupByDate(list: NormalisedMatch[]): Record<string, NormalisedMatch[]> {
  const groups: Record<string, NormalisedMatch[]> = {};
  for (const m of list) {
    if (!groups[m.date]) groups[m.date] = [];
    groups[m.date].push(m);
  }
  return groups;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        style={{ width: 32, height: 32, objectFit: 'contain' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 4, background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff',
    }}>
      {initials}
    </div>
  );
}

function MatchCard({ match: m, onOpen }: { match: NormalisedMatch; onOpen: (m: NormalisedMatch) => void }) {
  const statusLabel =
    m.status === 'live'     ? (m.minute ? `${m.minute}'` : 'En vivo') :
    m.status === 'finished' ? 'Finalizado' : m.time;

  return (
    <div className="match-card match-card-clickable" onClick={() => onOpen(m)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen(m)}>
      <div className="match-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {m.tournamentLogo && (
            <img src={m.tournamentLogo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <span className="match-tournament-label">{m.tournament}</span>
          {m.round && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {m.round}</span>}
        </div>
        <span className={`status-badge ${m.status}`}>{statusLabel}</span>
      </div>

      <div className="match-teams">
        <div className="match-team">
          <TeamLogo logo={m.homeLogo} name={m.home} />
          <div className="match-team-name">{m.home}</div>
        </div>

        <div className="match-score-block">
          {m.status === 'upcoming' ? (
            <div style={{ textAlign: 'center' }}>
              <div className="match-upcoming-time">{m.time}</div>
              <div className="match-upcoming-date">{m.date}</div>
            </div>
          ) : (
            <>
              <div className="match-score-nums">
                <span>{m.homeScore ?? '-'}</span>
                <span className="match-score-sep"> – </span>
                <span>{m.awayScore ?? '-'}</span>
              </div>
              {m.status === 'live' && m.minute && (
                <span className="match-score-time">{m.minute}'</span>
              )}
            </>
          )}
        </div>

        <div className="match-team" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
          <TeamLogo logo={m.awayLogo} name={m.away} />
          <div className="match-team-name">{m.away}</div>
        </div>
      </div>

      {m.status === 'live' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 11, color: 'var(--live)', fontWeight: 600 }}>En curso</span>
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="match-card" style={{ opacity: 0.45 }}>
      <div style={{ height: 11, background: 'var(--border)', borderRadius: 3, width: '38%', marginBottom: 14 }} />
      <div style={{ height: 18, background: 'var(--border)', borderRadius: 3, width: '75%' }} />
    </div>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────

interface CalendarViewProps {
  matches:      NormalisedMatch[];
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}

function CalendarView({ matches, selectedDate, onSelectDate }: CalendarViewProps) {
  const today = todayStr();
  const [calYM, setCalYM] = useState(() => {
    // Start at the month with the most matches, defaulting to today's month
    const monthCounts: Record<string, number> = {};
    for (const m of matches) {
      const ym = m.date.slice(0, 7);
      monthCounts[ym] = (monthCounts[ym] ?? 0) + 1;
    }
    const dominated = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return dominated ?? today.slice(0, 7);
  });

  const [year, month] = calYM.split('-').map(Number);

  const matchesByDate = useMemo(() => {
    const map: Record<string, NormalisedMatch[]> = {};
    for (const m of matches) {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    }
    return map;
  }, [matches]);

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth     = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCalYM(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCalYM(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="cal-wrapper">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={15} /></button>
        <span className="cal-month-label">{MONTHS[month - 1]} {year}</span>
        <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={15} /></button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dateStr = `${calYM}-${String(day).padStart(2, '0')}`;
          const dayMatches = matchesByDate[dateStr] ?? [];
          const hasMatch   = dayMatches.length > 0;
          const isToday    = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const hasLive    = dayMatches.some(m => m.status === 'live');
          const hasUpcoming = dayMatches.some(m => m.status === 'upcoming');

          return (
            <div
              key={dateStr}
              className={[
                'cal-day',
                hasMatch  ? 'has-match' : 'empty',
                isToday   ? 'today'     : '',
                isSelected ? 'selected'  : '',
              ].join(' ')}
              onClick={() => hasMatch ? onSelectDate(isSelected ? null : dateStr) : undefined}
              title={hasMatch ? `${dayMatches.length} partido${dayMatches.length !== 1 ? 's' : ''}` : undefined}
            >
              <span className="cal-day-num">{day}</span>
              {hasMatch && (
                <div className="cal-match-dots">
                  {hasLive    && <span className="cal-dot live" />}
                  {hasUpcoming && <span className="cal-dot upcoming" />}
                  {!hasLive && !hasUpcoming && <span className="cal-dot" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && matchesByDate[selectedDate] && (
        <div className="cal-day-label">
          {formatDateHeader(selectedDate)} — {matchesByDate[selectedDate].length} partido{matchesByDate[selectedDate].length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Matches() {
  const [matches, setMatches]         = useState<NormalisedMatch[]>([]);
  const [loading, setLoading]         = useState(true);
  const [apiOnline, setApiOnline]     = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [upcomingLoaded,  setUpcomingLoaded]  = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  const [status,     setStatus]     = useState<StatusFilter>('all');
  const [tournament, setTournament] = useState('all');
  const [month,      setMonth]      = useState('all');
  const [showPanel,  setShowPanel]  = useState(false);

  const [viewMode,     setViewMode]     = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalMatch,   setModalMatch]   = useState<NormalisedMatch | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [todayResult, ...leagueResults] = await Promise.allSettled([
        rugbyApi.getTodayGames(),
        ...DEFAULT_LEAGUES.map(id => rugbyApi.getFixtures(id, DEFAULT_SEASON)),
      ]);

      const today = todayResult.status === 'fulfilled' ? todayResult.value : [];
      const byLeague = leagueResults
        .filter((r): r is PromiseFulfilledResult<NormalisedMatch[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);

      const todayIds = new Set(today.map(m => m.id));
      const merged   = [...today, ...byLeague.filter(m => !todayIds.has(m.id))];

      const seen   = new Set<number>();
      const unique = merged.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

      setMatches(unique);
      setApiOnline(true);
      setLastUpdated(new Date());
    } catch {
      if (matches.length === 0) setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    if (status !== 'upcoming' || upcomingLoaded || loadingUpcoming) return;
    setLoadingUpcoming(true);
    rugbyApi.getUpcomingGames(5).then(upcoming => {
      setMatches(prev => {
        const seen  = new Set(prev.map(m => m.id));
        const fresh = upcoming.filter(m => !seen.has(m.id));
        return [...prev, ...fresh];
      });
      setUpcomingLoaded(true);
    }).finally(() => setLoadingUpcoming(false));
  }, [status, upcomingLoaded, loadingUpcoming]);

  const allMonths      = useMemo(() => uniqueMonths(matches),      [matches]);
  const allTournaments = useMemo(() => uniqueTournaments(matches), [matches]);

  const filtered = useMemo(() => {
    return matches
      .filter(m => {
        if (status !== 'all'     && m.status     !== status)     return false;
        if (tournament !== 'all' && m.tournament !== tournament)  return false;
        if (month !== 'all'      && !m.date.startsWith(month))   return false;
        if (selectedDate         && m.date        !== selectedDate) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'live'     && b.status !== 'live')     return -1;
        if (b.status === 'live'     && a.status !== 'live')     return 1;
        if (a.status === 'upcoming' && b.status === 'upcoming') return a.date.localeCompare(b.date);
        if (a.status === 'finished' && b.status === 'finished') return b.date.localeCompare(a.date);
        return 0;
      });
  }, [status, tournament, month, selectedDate, matches]);

  const grouped     = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = useMemo(() => Object.keys(grouped).sort((a, b) => {
    const aLive = grouped[a].some(m => m.status === 'live');
    const bLive = grouped[b].some(m => m.status === 'live');
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    const aUp = grouped[a].some(m => m.status === 'upcoming');
    const bUp = grouped[b].some(m => m.status === 'upcoming');
    if (aUp && bUp) return a.localeCompare(b);
    return b.localeCompare(a);
  }), [grouped]);

  const liveCount   = matches.filter(m => m.status === 'live').length;
  const activeCount = [status !== 'all', tournament !== 'all', month !== 'all', !!selectedDate].filter(Boolean).length;

  const clearFilters = () => {
    setStatus('all');
    setTournament('all');
    setMonth('all');
    setSelectedDate(null);
  };

  return (
    <div className="matches-page">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* API status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 20px',
        background: apiOnline === false ? 'var(--live-bg)' : 'transparent',
        borderBottom: '1px solid var(--border)',
        fontSize: 11.5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: apiOnline === false ? 'var(--live)' : 'var(--text-3)' }}>
          {apiOnline === false ? <WifiOff size={12} /> : <Wifi size={12} />}
          {apiOnline === false
            ? 'Sin conexión. Configurá RUGBY_API_KEY en .env.local'
            : lastUpdated
            ? `Actualizado ${lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
            : 'Conectando con API…'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >
              <List size={13} />
            </button>
            <button
              className={`view-toggle-btn${viewMode === 'calendar' ? ' active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Vista calendario"
            >
              <Calendar size={13} />
            </button>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 11.5, padding: '2px 6px' }}
          >
            <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="matches-filter-bar">
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              className={`filter-tab${status === t.id ? ' active' : ''}`}
              onClick={() => setStatus(t.id)}
            >
              {t.id === 'live' && liveCount > 0 && (
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--live)', marginRight: 4, verticalAlign: 'middle' }} />
              )}
              {t.label}
              {t.id === 'live' && liveCount > 0 && (
                <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: 'var(--live)' }}>{liveCount}</span>
              )}
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
            <ChevronDown size={13} style={{ transform: showPanel ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {activeCount > 0 && (
            <button className="matches-clear-btn" onClick={clearFilters}>
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {showPanel && (
        <div className="matches-filter-panel">
          <div className="filter-panel-group">
            <span className="filter-panel-label">Competición</span>
            <div className="filter-panel-chips">
              <button className={`filter-chip${tournament === 'all' ? ' active' : ''}`} onClick={() => setTournament('all')}>Todas</button>
              {allTournaments.map(t => (
                <button key={t} className={`filter-chip${tournament === t ? ' active' : ''}`} onClick={() => setTournament(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="filter-panel-group">
            <span className="filter-panel-label">Mes</span>
            <div className="filter-panel-chips">
              <button className={`filter-chip${month === 'all' ? ' active' : ''}`} onClick={() => setMonth('all')}>Todos</button>
              {allMonths.map(m => (
                <button key={m} className={`filter-chip${month === m ? ' active' : ''}`} onClick={() => setMonth(m)}>{formatMonth(m)}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {viewMode === 'calendar' && !loading && matches.length > 0 && (
        <CalendarView
          matches={filtered.length > 0 ? (tournament !== 'all' || status !== 'all' ? filtered : matches) : matches}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {loadingUpcoming && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 12, color: 'var(--text-3)' }}>
          <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
          Buscando próximos partidos…
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="matches-grouped">
          {[0, 1].map(i => (
            <div key={i} className="matches-date-group">
              <div className="matches-date-header">
                <div style={{ height: 12, background: 'var(--border)', borderRadius: 3, width: 140 }} />
              </div>
              <div className="match-list">
                {[0, 1, 2].map(j => <SkeletonRow key={j} />)}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏉</div>
          <p>
            {matches.length === 0
              ? 'Sin datos. Verificá tu RUGBY_API_KEY en .env.local'
              : selectedDate
              ? `Sin partidos el ${formatDateHeader(selectedDate)}`
              : 'No hay partidos con estos filtros'}
          </p>
          {activeCount > 0 && (
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
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
                {grouped[date].map(m => (
                  <MatchCard key={m.id} match={m} onOpen={setModalMatch} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalMatch && (
        <MatchModal match={modalMatch} onClose={() => setModalMatch(null)} />
      )}
    </div>
  );
}
